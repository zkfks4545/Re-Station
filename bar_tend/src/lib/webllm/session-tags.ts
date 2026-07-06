import type { SemanticSessionTag } from './types.js'

export class SemanticSessionTagStore {
  private readonly tags = new Set<SemanticSessionTag>()

  add(tags: readonly SemanticSessionTag[]): void {
    for (const tag of tags) this.tags.add(tag)
  }

  snapshot(): SemanticSessionTag[] {
    return [...this.tags]
  }

  reset(): void {
    this.tags.clear()
  }
}

export const semanticSessionTags = new SemanticSessionTagStore()
