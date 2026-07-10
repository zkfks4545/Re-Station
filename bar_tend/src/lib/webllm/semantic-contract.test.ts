import { describe, expect, it } from 'vitest'
import actionExecutorSource from '../dialogue/action-executor.ts?raw'
import actionResolverSource from '../dialogue/action-resolver.ts?raw'
import dialogueServiceSource from '../dialogue/dialogue-service.ts?raw'
import responsePipelineSource from '../dialogue/response-pipeline.ts?raw'
import responsePlanSource from '../dialogue/response-plan.ts?raw'
import responsePlanRendererSource from '../dialogue/response-plan-renderer.ts?raw'
import recommendationQuestionEngineSource from '../recommendation/question-engine.ts?raw'
import recommendationResponseSource from '../recommendation/response.ts?raw'
import recommendationStateSource from '../recommendation/state.ts?raw'
import sessionFlowSource from '../session/session-flow.ts?raw'
import controllerSource from '../../hooks/useRestationController.ts?raw'

describe('Phase 12 WebLLM semantic isolation contract', () => {
  it('keeps WebLLM out of final response, recommendation, action, and FSM modules', () => {
    const protectedModules = [
      ['dialogue-service.ts', dialogueServiceSource],
      ['response-pipeline.ts', responsePipelineSource],
      ['response-plan.ts', responsePlanSource],
      ['response-plan-renderer.ts', responsePlanRendererSource],
      ['action-resolver.ts', actionResolverSource],
      ['action-executor.ts', actionExecutorSource],
      ['recommendation/response.ts', recommendationResponseSource],
      ['recommendation/state.ts', recommendationStateSource],
      ['question-engine.ts', recommendationQuestionEngineSource],
      ['session-flow.ts', sessionFlowSource],
    ]

    const offenders = protectedModules
      .filter(([, moduleSource]) => /webllm/i.test(moduleSource))
      .map(([path]) => path)

    expect(offenders).toEqual([])
  })

  it('keeps the controller semantic call fire-and-forget', () => {
    expect(controllerSource).toContain('void experimentalSemanticAssistant.analyze')
  })
})
