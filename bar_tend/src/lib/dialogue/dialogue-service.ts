import type { CocktailData, Expression, Message } from '../../types.js'
import type { DialogueTurn } from '../../types/dialogue-turn.js'
import {
  isRecommendationBlockedInPhase,
  type SessionPhase,
} from '../session/session-flow.js'
import {
  IntentClassifier,
  type ClassifiedIntent,
  type DialogueContext,
} from '../bartender/intent-classifier.js'
import { detectSafetyConcern, getCocktailResponseFromClassified } from '../bartender/engine.js'
import { selectShortCocktailStory } from '../recommendation/response.js'
import { resolveDialogueAction, type DialogueAction } from './action-resolver.js'
import {
  getDisclosedCocktailFactKeys,
  getDiscussedCocktailIds,
  getLoreFollowupCocktailId,
  getOrderCandidateCocktailId,
  getStoryCocktailId,
  type ConversationContextEvent,
  type ConversationContextState,
} from './conversation-context.js'
import type { RouteResult } from './input-router.js'
import { SHAKE_REFERENCE } from './pattern-utils.js'
import { assembleResponse } from './response-pipeline.js'
import {
  formatStoryQueryReply,
  getSelectedCocktailStoryFactKey,
} from './story-query.js'
import {
  buildDialogueTurn,
  type RecommendationOutcome,
} from './turn-builder.js'
import { validateDialogueTurn } from '../../types/dialogue-turn.js'

export interface DialogueServiceSessionSnapshot {
  phase: SessionPhase
  activeRecommendationSession: boolean
  allowRecommendationRoutes: boolean
  welcomeDrinkUsed: boolean
  alcoholStarsTotal: number
  totalUserMessages: number
  conversationTurnCount: number
}

export interface DialogueServiceRequest {
  text: string
  messages: Message[]
  conversationContext: ConversationContextState
  session: DialogueServiceSessionSnapshot
  displayedCocktail: CocktailData | null
  lastServedCocktail: CocktailData | null
}

export type DirectDialogueKind =
  | 'safety'
  | 'exit'
  | 'recommendation-cancel'
  | 'cocktail-content'
  | 'character'
  | 'unknown-cocktail'
  | 'lore-followup'

export interface DirectDialogueResponse {
  kind: DirectDialogueKind
  turn: DialogueTurn
  cocktail: CocktailData | null
  contextEvents: ConversationContextEvent[]
  unknownCocktailName?: string
}

export interface DialogueResolution {
  classifiedIntent: ClassifiedIntent
  routeResult: RouteResult
  action: DialogueAction
  blockedBySession: boolean
  contextEvents: ConversationContextEvent[]
  directResponse: DirectDialogueResponse | null
}

export interface MainTurnOptions {
  outcome: RecommendationOutcome | null
  inviteRecommendation?: boolean
}

export class DialogueService {
  private readonly classifier: IntentClassifier
  private readonly cocktailsById: Map<string, CocktailData>

  constructor(cocktails: CocktailData[]) {
    this.classifier = new IntentClassifier(cocktails)
    this.cocktailsById = new Map(cocktails.map((cocktail) => [cocktail.id, cocktail]))
  }

  resolve(request: DialogueServiceRequest): DialogueResolution {
    const dialogueContext = this.buildDialogueContext(request)
    const classifiedIntent = this.classifier.classify(request.text, dialogueContext)
    const routeResult = classifiedIntent.route
    const action = resolveDialogueAction(classifiedIntent, request.conversationContext)
    const blockedBySession = isRecommendationBlockedInPhase(
      request.session.phase,
      routeResult.route,
    )
    const contextEvents = blockedBySession
      ? []
      : this.resolveActionContextEvents(action)
    const directResponse = this.resolveDirectResponse(request, classifiedIntent, action)

    return {
      classifiedIntent,
      routeResult,
      action,
      blockedBySession,
      contextEvents,
      directResponse,
    }
  }

  isSafetyConcern(text: string): boolean {
    return detectSafetyConcern(text)
  }

  buildServingContextEvents(
    cocktail: CocktailData,
    options: { reply?: string; recommended?: boolean } = {},
  ): ConversationContextEvent[] {
    const events: ConversationContextEvent[] = []
    if (options.recommended) {
      events.push({ type: 'recommended', cocktailId: cocktail.id })
    }
    events.push({ type: 'served', cocktailId: cocktail.id })

    if (options.reply) {
      const factKey = getSelectedCocktailStoryFactKey(cocktail)
      if (factKey && options.reply.includes(selectShortCocktailStory(cocktail))) {
        events.push({ type: 'fact-disclosed', cocktailId: cocktail.id, factKey })
      }
    }
    return events
  }

  buildDiscussionContextEvents(cocktail: CocktailData): ConversationContextEvent[] {
    return [{ type: 'discussed', cocktailId: cocktail.id }]
  }

  buildMainTurn(
    request: Pick<DialogueServiceRequest, 'text' | 'messages'>,
    resolution: DialogueResolution,
    options: MainTurnOptions,
  ): DialogueTurn | null {
    const fallback = getCocktailResponseFromClassified(
      request.text,
      request.messages,
      resolution.classifiedIntent,
    )
    const fallbackResponse = options.inviteRecommendation
      ? assembleResponse({
          text: `${fallback.response}\n슬슬 빈 잔이 심심해 보이네요. 괜찮으면 이제 제가 한 잔 맞춰볼까요?`,
          tone: 'smirk',
        })
      : fallback
    const outcome = this.applyPreparationStyle(request.text, resolution, options.outcome)
    const turn = buildDialogueTurn(
      request.text,
      resolution.routeResult.route,
      fallbackResponse.response,
      fallbackResponse.expression,
      outcome,
      { confidence: resolution.routeResult.confidence },
    )
    return validateDialogueTurn(turn) ? turn : null
  }

  private buildDialogueContext(request: DialogueServiceRequest): DialogueContext {
    const discussedCocktails = getDiscussedCocktailIds(request.conversationContext)
      .map((id) => this.getCocktail(id))
      .filter((cocktail): cocktail is CocktailData => cocktail !== null)

    return {
      lastServedCocktail: request.lastServedCocktail,
      mentionedCocktails: discussedCocktails,
      sessionPhase: request.session.phase,
      activeRecommendationSession: request.session.activeRecommendationSession,
      allowRecommendationRoutes: request.session.allowRecommendationRoutes,
      lastDiscussedCocktailId: getStoryCocktailId(request.conversationContext) ?? undefined,
      orderCandidateCocktailId: getOrderCandidateCocktailId(request.conversationContext) ?? undefined,
      welcomeDrinkUsed: request.session.welcomeDrinkUsed,
      alcoholStarsTotal: request.session.alcoholStarsTotal,
      totalUserMessages: request.session.totalUserMessages,
      conversationTurnCount: request.session.conversationTurnCount,
    }
  }

  private resolveActionContextEvents(action: DialogueAction): ConversationContextEvent[] {
    if (action.type === 'order' || action.type === 'loreBasedOrder') {
      return [{ type: 'order-candidate', cocktailId: action.cocktailId }]
    }
    if (action.type === 'discuss') {
      return [{ type: 'discussed', cocktailId: action.cocktailId }]
    }
    return []
  }

  private resolveDirectResponse(
    request: DialogueServiceRequest,
    classifiedIntent: ClassifiedIntent,
    action: DialogueAction,
  ): DirectDialogueResponse | null {
    const { route } = classifiedIntent.route

    if (route === 'safety' || route === 'exit' || route === 'recommendation-cancel') {
      const turn = this.createTurn(request.text, route, '', 'idle', classifiedIntent.route.confidence)
      return turn
        ? { kind: route, turn, cocktail: null, contextEvents: [] }
        : null
    }

    if (route === 'story-query' || route === 'lore-query' || route === 'cocktail-info-query') {
      return this.resolveCocktailContent(request, classifiedIntent, action)
    }

    if (route === 'character-query') {
      const response = getCocktailResponseFromClassified(request.text, request.messages, classifiedIntent)
      const turn = this.createTurn(
        request.text,
        route,
        response.response,
        response.expression,
        classifiedIntent.route.confidence,
      )
      return turn ? { kind: 'character', turn, cocktail: null, contextEvents: [] } : null
    }

    if (route === 'unknown-cocktail-query' && classifiedIntent.route.unknownCocktailName) {
      const unknownCocktailName = classifiedIntent.route.unknownCocktailName
      const response = assembleResponse({
        text: `「${unknownCocktailName}」이라는 메뉴는 아직 등록하지 않았어요.\n비슷한 맛이나 원하시는 종류를 말씀해 주시면 다른 칵테일을 찾아드릴게요.`,
        tone: 'thinking',
      })
      const turn = this.createTurn(
        request.text,
        route,
        response.response,
        response.expression,
        classifiedIntent.route.confidence,
        { cocktailName: unknownCocktailName },
      )
      return turn
        ? { kind: 'unknown-cocktail', turn, cocktail: null, contextEvents: [], unknownCocktailName }
        : null
    }

    if (classifiedIntent.intent === 'lore-followup') {
      const cocktailId = getLoreFollowupCocktailId(request.conversationContext)
      const cocktail = this.getCocktail(cocktailId)
      const response = getCocktailResponseFromClassified(
        request.text,
        request.messages,
        classifiedIntent,
        cocktail,
      )
      const turn = this.createTurn(
        request.text,
        route,
        response.response,
        response.expression,
        classifiedIntent.route.confidence,
      )
      return turn ? { kind: 'lore-followup', turn, cocktail, contextEvents: [] } : null
    }

    return null
  }

  private resolveCocktailContent(
    request: DialogueServiceRequest,
    classifiedIntent: ClassifiedIntent,
    action: DialogueAction,
  ): DirectDialogueResponse | null {
    const cocktailId = action.type === 'continueStory'
      ? action.cocktailId
      : classifiedIntent.route.matchedCocktailId ?? null
    const cocktail = this.getCocktail(cocktailId)
      ?? request.displayedCocktail
      ?? request.lastServedCocktail
    const disclosed = cocktail
      ? getDisclosedCocktailFactKeys(request.conversationContext, cocktail.id)
      : []
    const reply = formatStoryQueryReply(cocktail, disclosed)
    const response = assembleResponse({
      text: reply.text,
      preferredExpression: reply.expression,
    })
    const turn = this.createTurn(
      request.text,
      classifiedIntent.route.route,
      response.response,
      response.expression,
      classifiedIntent.route.confidence,
      cocktail ? { cocktailName: cocktail.name } : undefined,
    )
    if (!turn) return null

    const contextEvents: ConversationContextEvent[] = cocktail
      ? [
          { type: 'discussed', cocktailId: cocktail.id },
          { type: 'story-targeted', cocktailId: cocktail.id },
          ...reply.factKeys.map((factKey): ConversationContextEvent => ({
            type: 'fact-disclosed',
            cocktailId: cocktail.id,
            factKey,
          })),
        ]
      : []
    return {
      kind: 'cocktail-content',
      turn,
      cocktail,
      contextEvents,
    }
  }

  private applyPreparationStyle(
    text: string,
    resolution: DialogueResolution,
    outcome: RecommendationOutcome | null,
  ): RecommendationOutcome | null {
    if (!outcome || resolution.classifiedIntent.intent !== 'order-cocktail' || !SHAKE_REFERENCE.test(text)) {
      return outcome
    }
    const cocktailName = outcome.decision?.cocktail?.name
    if (!cocktailName) return outcome
    const response = assembleResponse({
      text: `${cocktailName} 한 잔, 본드식으로요. 젓지 말고 흔들어서 준비할게요.`,
      tone: 'smirk',
    })
    return {
      ...outcome,
      reply: response.response,
      expression: response.expression,
    }
  }

  private createTurn(
    text: string,
    route: RouteResult['route'],
    reply: string,
    expression: Expression,
    confidence: number,
    entities?: { cocktailName?: string },
  ): DialogueTurn | null {
    const turn = buildDialogueTurn(text, route, reply, expression, null, { confidence, entities })
    return validateDialogueTurn(turn) ? turn : null
  }

  private getCocktail(id: string | null | undefined): CocktailData | null {
    return id ? this.cocktailsById.get(id) ?? null : null
  }
}
