export type Collection = {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
  updatedAt: string
}

export type CollectionDraft = {
  name: string
  description?: string
  color?: string
}

export type CollectionUpdate = Partial<CollectionDraft>
