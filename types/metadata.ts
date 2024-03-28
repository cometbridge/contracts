export interface OriginalMetadata {
  targetChain: string
  targetAddress?: string
}

export interface TargetMetadata {
  originalChain: string
  originalHash: string
}
