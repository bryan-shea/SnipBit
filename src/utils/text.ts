import type { Snippet } from '../types/snippet'

export function normalizeMultilineText(text: string): string {
  return text.replace(/\r\n?/g, '\n').trim()
}

export function collapseWhitespace(text: string): string {
  return normalizeMultilineText(text).replace(/\s+/g, ' ')
}

export function deriveSnippetTitle(text: string, maxLength = 40): string {
  const normalizedText = collapseWhitespace(text)

  if (!normalizedText) {
    return 'Untitled snippet'
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText
  }

  return `${normalizedText.slice(0, maxLength).trimEnd()}...`
}

export function createSnippetPreview(text: string, maxLength = 120): string {
  const normalizedText = collapseWhitespace(text)

  if (normalizedText.length <= maxLength) {
    return normalizedText
  }

  return `${normalizedText.slice(0, maxLength).trimEnd()}...`
}

export function normalizeTagList(tags: string[]): string[] {
  const normalizedTags: string[] = []
  const seenTags = new Set<string>()

  for (const rawTag of tags) {
    const nextTag = collapseWhitespace(rawTag)

    if (!nextTag) {
      continue
    }

    const key = nextTag.toLowerCase()

    if (seenTags.has(key)) {
      continue
    }

    seenTags.add(key)
    normalizedTags.push(nextTag)
  }

  return normalizedTags
}

export function parseTagInput(input: string): string[] {
  return normalizeTagList(input.split(','))
}

export function serializeTags(tags: string[]): string {
  return tags.join(', ')
}

export function matchesSnippetQuery(snippet: Snippet, query: string): boolean {
  const normalizedQuery = collapseWhitespace(query).toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const searchableText = [
    snippet.title,
    snippet.body,
    snippet.tags.join(' '),
    snippet.sourceTitle ?? '',
    snippet.sourceUrl ?? '',
    snippet.keyboardHint ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}