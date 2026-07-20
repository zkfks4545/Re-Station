import { RAW_RESPONSE_PLANS } from './response-plan-data.js'
import type { ResponsePlan } from './response-plan.js'

export type ResponsePlanDomain = 'dialogue' | 'recommendation' | 'welcome' | 'farewell'

export function getResponsePlanDomain(plan: ResponsePlan): ResponsePlanDomain {
  const request = plan.request ?? ''
  if (request.startsWith('welcome-')) return 'welcome'
  if (request.startsWith('farewell-')) return 'farewell'
  if (
    plan.intent === 'recommend' ||
    plan.intent === 'ask_preference' ||
    request === 'recommendation-cancel'
  ) return 'recommendation'
  return 'dialogue'
}

export const RESPONSE_PLANS_BY_DOMAIN: Readonly<Record<ResponsePlanDomain, readonly ResponsePlan[]>> = {
  dialogue: RAW_RESPONSE_PLANS.filter((plan) => getResponsePlanDomain(plan) === 'dialogue'),
  recommendation: RAW_RESPONSE_PLANS.filter((plan) => getResponsePlanDomain(plan) === 'recommendation'),
  welcome: RAW_RESPONSE_PLANS.filter((plan) => getResponsePlanDomain(plan) === 'welcome'),
  farewell: RAW_RESPONSE_PLANS.filter((plan) => getResponsePlanDomain(plan) === 'farewell'),
}

export const RESPONSE_PLANS: readonly ResponsePlan[] = RAW_RESPONSE_PLANS
