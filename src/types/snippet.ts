export type Snippet = {
  id: string
  title: string
  body: string
  tags: string[]
  favorite: boolean
  createdAt: string
  updatedAt: string
  sourceUrl?: string
  sourceTitle?: string
  keyboardHint?: string
  collectionId: string | null
}

export type SnippetDraft = {
  title: string
  body: string
  tags: string[]
  favorite: boolean
  sourceUrl?: string
  sourceTitle?: string
  keyboardHint?: string
  collectionId?: string | null
}

export type SnippetUpdate = Partial<
  Pick<SnippetDraft, 'title' | 'body' | 'tags' | 'favorite' | 'keyboardHint' | 'collectionId'>
>