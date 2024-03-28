import { Buffer } from 'buffer'
import { OriginalMetadata, TargetMetadata } from '../types/metadata'

export function createOriginalMetadata(data: OriginalMetadata) {
  return Buffer.from(`data:,${JSON.stringify(data)}`)
}

export function createTargetMetadata(data: TargetMetadata) {
  return Buffer.from(`data:,${JSON.stringify(data)}`)
}
