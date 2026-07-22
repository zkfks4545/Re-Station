import type { CocktailData, Expression, Message } from '../../types.js'
import type { DialogueTurn } from '../../types/dialogue-turn.js'
import {
  isDialogueActionBlockedInPhase,
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
import { getContentLeadReaction } from './conversation-flow.js'
import { SHAKE_REFERENCE } from './pattern-utils.js'
import { detectUserReaction, type UserReaction } from './reaction-layer.js'
import { assembleResponse } from './response-pipeline.js'
import { formatShakeOrderDraft } from './response-templates.js'
import {
  formatStoryQueryReply,
  getSelectedCocktailStoryFactKey,
} from './story-query.js'
import {
  buildDialogueTurn,
  type RecommendationOutcome,
} from './turn-builder.js'
import { validateDialogueTurn } from '../../types/dialogue-turn.js'
import { expressionForSessionAffect, type SessionAffect } from '../session/session-affect.js'
import type { PendingQuestion, SessionTopic } from '../session/dialogue-session.js'
import type { ConversationContextSnapshot } from './conversation-context-snapshot.js'
import { resolveContinuation } from './continuation-resolver.js'
import { createShadowUnderstanding, type InputUnderstanding } from './input-understanding.js'
import { planShadowDialogueMove, type DialogueMove } from './decision-shadow.js'

export interface DialogueServiceSessionSnapshot {
  phase: SessionPhase
  activeRecommendationSession: boolean
  allowRecommendationRoutes: boolean
  welcomeDrinkUsed: boolean
  alcoholStarsTotal: number
  totalUserMessages: number
  conversationTurnCount: number
  sessionAffect?: SessionAffect
  sessionTopic?: SessionTopic
  topicCocktailId?: string | null
  pendingQuestion?: PendingQuestion | null
}

export interface DialogueServiceRequest {
  text: string
  inputKind?: 'text' | 'recommendation-answer'
  messages: Message[]
  conversationContext: ConversationContextState
  session: DialogueServiceSessionSnapshot
  displayedCocktail: CocktailData | null
  continuationContext?: ConversationContextSnapshot
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
  reaction: UserReaction | null
  action: DialogueAction
  blockedBySession: boolean
  contextEvents: ConversationContextEvent[]
  directResponse: DirectDialogueResponse | null
  understanding: InputUnderstanding
  move: DialogueMove
}

export interface MainTurnOptions {
  outcome: RecommendationOutcome | null
  inviteRecommendation?: boolean
  sessionAffect?: SessionAffect
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
    const classified = this.classifier.classify(request.text, dialogueContext)
    const classifiedIntent = request.inputKind === 'recommendation-answer'
      ? this.asRecommendationAnswer(classified)
      : this.applyContinuation(classified, request.text, request.continuationContext)
    const routeResult = classifiedIntent.route
    const reaction = this.resolveReaction(request.text, classifiedIntent)
    const action = resolveDialogueAction(classifiedIntent, request.conversationContext, reaction)
    const understanding = createShadowUnderstanding({
      text: request.text,
      context: request.continuationContext ?? {
        topic: request.session.sessionTopic ?? 'none',
        affect: request.session.sessionAffect ?? 'neutral',
        subject: request.session.sessionTopic === 'recommendation'
          ? { type: 'recommendation', id: null }
          : request.session.topicCocktailId
            ? { type: 'cocktail', id: request.session.topicCocktailId }
            : { type: 'none', id: null },
        pendingQuestion: request.session.pendingQuestion ?? null,
        recommendationActive: request.session.activeRecommendationSession,
        safetyLocked: request.session.phase === 'safetyLocked',
      },
    }, classifiedIntent)
    const move = planShadowDialogueMove(action, understanding)
    const blockedBySession = isRecommendationBlockedInPhase(request.session.phase, routeResult.route)
      || isDialogueActionBlockedInPhase(request.session.phase, action)
    const contextEvents = blockedBySession
      ? []
      : this.resolveActionContextEvents(action)
    const directResponse = reaction
      ? null
      : this.resolveDirectResponse(request, classifiedIntent, action)
    const responseAffect = routeResult.route === 'safety'
      ? 'firm'
      : request.session.sessionAffect ?? 'neutral'

    return {
      classifiedIntent,
      routeResult,
      reaction,
      action,
      blockedBySession,
      contextEvents,
      understanding,
      move,
    directResponse: directResponse
        ? { ...directResponse, turn: this.constrainTurnExpression(directResponse.turn, responseAffect) }
        : null,
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
    const reactedFallback = resolution.reaction
      ? assembleResponse({ text: resolution.reaction.reply, tone: resolution.reaction.tone })
      : fallback
    const fallbackResponse = options.inviteRecommendation
      ? assembleResponse({
          text: `${reactedFallback.response}\n슬슬 빈 잔이 심심해 보이네요. 괜찮으면 이제 제가 한 잔 맞춰볼까요?`,
          tone: 'smirk',
        })
      : reactedFallback
    const outcome = this.applyPreparationStyle(request.text, resolution, options.outcome)
    const reactedOutcome = outcome && resolution.reaction
      ? {
          ...outcome,
          reply: `${resolution.reaction.reply}\n${outcome.reply}`,
        }
      : outcome
    const turn = buildDialogueTurn(
      request.text,
      resolution.routeResult.route,
      fallbackResponse.response,
      fallbackResponse.expression,
      reactedOutcome,
      {
        confidence: resolution.routeResult.confidence,
        responsePlanId: reactedOutcome ? undefined : fallbackResponse.responsePlanId,
      },
    )
    return validateDialogueTurn(turn)
      ? this.constrainTurnExpression(turn, options.sessionAffect ?? 'neutral')
      : null
  }

  private resolveReaction(text: string, classifiedIntent: ClassifiedIntent): UserReaction | null {
    const reaction = detectUserReaction(text)
    if (!reaction) return null

    const routeResult = classifiedIntent.route

    if (['safety', 'exit', 'recommendation-cancel', 'explicit-cocktail', 'lore-based-order', 'character-query', 'unknown-cocktail-query'].includes(routeResult.route)) {
      return null
    }
    const explicitContentRequest = /알려|설명|들려|말해\s*줘|이야기\s*(?:해|줘)|유래|레시피|재료|도수|왜|어떻게|누가/.test(text)
    if (explicitContentRequest && ['story-query', 'lore-query', 'cocktail-info-query'].includes(routeResult.route)) {
      return null
    }

    if (reaction.type === 'another-request') return reaction
    if (classifiedIntent.intent === 'general-chat') return reaction
    if (isStandaloneFeedback(text, reaction.type)) return reaction
    if (
      (reaction.type === 'positive-feedback' || reaction.type === 'negative-feedback')
      && /(?:이|그|저)\s*(?:칵테일|잔|거)|방금\s*(?:그|이)거/.test(text)
    ) return reaction
    return null
  }

  private buildDialogueContext(request: DialogueServiceRequest): DialogueContext {
    const discussedCocktails = getDiscussedCocktailIds(request.conversationContext)
      .map((id) => this.getCocktail(id))
      .filter((cocktail): cocktail is CocktailData => cocktail !== null)

    const lastServedCocktail = this.getCocktail(request.conversationContext.lastServedCocktailId)

    return {
      lastServedCocktail,
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
      sessionTopic: request.session.sessionTopic,
      pendingQuestion: request.session.pendingQuestion,
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

    if (route === 'recommendation-cancel') {
      const response = getCocktailResponseFromClassified(request.text, request.messages, classifiedIntent)
      const turn = this.createTurn(
        request.text,
        route,
        response.response,
        response.expression,
        classifiedIntent.route.confidence,
        undefined,
        response.responsePlanId,
      )
      return turn ? { kind: route, turn, cocktail: null, contextEvents: [] } : null
    }

    if (route === 'safety' || route === 'exit') {
      const turn = this.createTurn(
        request.text,
        route,
        '',
        route === 'safety' ? 'stern' : 'idle',
        classifiedIntent.route.confidence,
      )
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
        undefined,
        response.responsePlanId,
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
      ?? this.getCocktail(request.conversationContext.lastServedCocktailId)
    const disclosed = cocktail
      ? getDisclosedCocktailFactKeys(request.conversationContext, cocktail.id)
      : []
    const contentKind = action.type === 'continueStory' ? action.topic : 'story'
    const reply = formatStoryQueryReply(cocktail, disclosed, contentKind)
    const leadReaction = getContentLeadReaction(classifiedIntent.route.route, {
      hasCocktail: cocktail !== null,
      isFollowup: disclosed.length > 0,
    })
    const response = assembleResponse({
      text: `${leadReaction}\n${reply.text}`,
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
    const cocktail = outcome.decision?.cocktail
    if (!cocktail) return outcome
    const response = assembleResponse(formatShakeOrderDraft(cocktail))
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
    responsePlanId?: string,
  ): DialogueTurn | null {
    const turn = buildDialogueTurn(text, route, reply, expression, null, {
      confidence,
      entities,
      responsePlanId,
    })
    return validateDialogueTurn(turn) ? turn : null
  }

  private applyContinuation(
    classified: ClassifiedIntent,
    text: string,
    context?: ConversationContextSnapshot,
  ): ClassifiedIntent {
    if (!context || classified.route.route !== 'general' || context.safetyLocked) return classified
    const continuation = resolveContinuation(text, context)
    if (!continuation) return classified

    const route: RouteResult = continuation === 'story-query-followup'
      ? {
          route: 'story-query',
          matchedCocktailId: context.subject.type === 'cocktail' ? context.subject.id ?? undefined : undefined,
          confidence: 0.9,
        }
      : { route: 'character-query', confidence: 0.9 }

    return {
      ...classified,
      route,
      intent: continuation,
      confidence: route.confidence,
      source: 'inference',
    }
  }

  private asRecommendationAnswer(classified: ClassifiedIntent): ClassifiedIntent {
    return {
      ...classified,
      route: { route: 'recommendation', confidence: 1 },
      intent: 'recommendation-query',
      confidence: 1,
      source: 'input-router',
      metadata: { ...classified.metadata, answersPendingQuestion: true },
    }
  }

  private constrainTurnExpression(turn: DialogueTurn, sessionAffect: SessionAffect): DialogueTurn {
    return { ...turn, expression: expressionForSessionAffect(turn.expression, sessionAffect) }
  }

  private getCocktail(id: string | null | undefined): CocktailData | null {
    return id ? this.cocktailsById.get(id) ?? null : null
  }
}

function isStandaloneFeedback(text: string, reactionType: UserReaction['type']): boolean {
  const normalized = text.trim().toLowerCase()
  const patterns: Partial<Record<UserReaction['type'], RegExp>> = {
    'positive-feedback': /^(?:정말\s*|진짜\s*)?(?:맛있|마음에\s*들|괜찮|좋|훌륭|최고).{0,8}[.!?]*$/,
    'negative-feedback': /^(?:정말\s*|진짜\s*)?(?:별로|마음에\s*안\s*들|취향이\s*아니|실망|맛없|안\s*맞).{0,8}[.!?]*$/,
    agreement: /^(?:네|응|맞아(?:요)?|그렇(?:죠|네요|습니다)?|동의해(?:요)?|그러게(?:요)?)[\s.!?]*$/,
    confused: /^(?:무슨\s*말|이해(?:가)?\s*안|헷갈|잘\s*모르겠|뭔\s*소리).{0,12}[.!?]*$/,
  }
  return patterns[reactionType]?.test(normalized) ?? false
}
