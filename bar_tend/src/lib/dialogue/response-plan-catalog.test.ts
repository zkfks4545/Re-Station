import { describe, expect, it } from 'vitest'
import { RAW_RESPONSE_PLANS } from './response-plan-data.js'
import {
  getResponsePlanDomain,
  RESPONSE_PLANS,
  RESPONSE_PLANS_BY_DOMAIN,
} from './response-plan-catalog.js'

describe('ResponsePlan catalog entrypoint', () => {
  it('partitions every raw plan into exactly one stable domain without changing IDs', () => {
    const partitioned = Object.values(RESPONSE_PLANS_BY_DOMAIN).flat()

    expect(partitioned).toHaveLength(RAW_RESPONSE_PLANS.length)
    expect(new Set(partitioned.map((plan) => plan.id)).size).toBe(RAW_RESPONSE_PLANS.length)
    expect(new Set(RESPONSE_PLANS.map((plan) => plan.id))).toEqual(
      new Set(RAW_RESPONSE_PLANS.map((plan) => plan.id)),
    )
    for (const [domain, plans] of Object.entries(RESPONSE_PLANS_BY_DOMAIN)) {
      expect(plans.every((plan) => getResponsePlanDomain(plan) === domain)).toBe(true)
    }
  })
})
