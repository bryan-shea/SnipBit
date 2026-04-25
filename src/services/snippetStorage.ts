import { getLocalStorage, setLocalStorage } from './chromeRuntime'
import type { Snippet, SnippetDraft, SnippetUpdate } from '../types/snippet'
import { getIsoNow } from '../utils/dates'
import { createId } from '../utils/ids'
import { collapseWhitespace, deriveSnippetTitle, normalizeMultilineText, normalizeTagList } from '../utils/text'

export const SNIPPETS_STORAGE_KEY = 'snipbit.snippets'
const SNIPPETS_INITIALIZED_KEY = 'snipbit.initialized'

// Set this to false if you want a completely blank first-run experience.
const ENABLE_DEMO_SNIPPETS = true

const DEMO_SNIPPETS: SnippetDraft[] = [
  {
    title: 'Standup update',
    body: 'Yesterday: wrapped the storage sync layer. Today: shipping the popup polish. Blockers: none.',
    tags: ['work', 'status'],
    favorite: true,
    keyboardHint: 'Alt+Shift+1',
  },
  {
    title: 'Bug report template',
    body: 'Steps to reproduce:\n1.\n2.\n3.\n\nExpected result:\n\nActual result:\n',
    tags: ['template', 'qa'],
    favorite: false,
  },
  {
    title: 'Client follow-up',
    body: 'Quick follow-up on the snippet workflow we discussed today. I have attached the latest changes and would value your review.',
    tags: ['email', 'client'],
    favorite: false,
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = collapseWhitespace(value)

  return normalizedValue || undefined
}

function getOptionalLongText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = normalizeMultilineText(value)

  return normalizedValue || undefined
}

function getStoredTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return normalizeTagList(value.filter((tag): tag is string => typeof tag === 'string'))
}

function sortSnippets(snippets: Snippet[]): Snippet[] {
  return [...snippets].sort((leftSnippet, rightSnippet) => {
    if (leftSnippet.favorite !== rightSnippet.favorite) {
      return Number(rightSnippet.favorite) - Number(leftSnippet.favorite)
    }

    const dateDifference = Date.parse(rightSnippet.updatedAt) - Date.parse(leftSnippet.updatedAt)

    if (!Number.isNaN(dateDifference) && dateDifference !== 0) {
      return dateDifference
    }

    return leftSnippet.title.localeCompare(rightSnippet.title)
  })
}

function sanitizeStoredSnippet(value: unknown): Snippet | null {
  if (!isRecord(value)) {
    return null
  }

  const body = getOptionalLongText(value.body)

  if (!body) {
    return null
  }

  const title = getOptionalString(value.title) ?? deriveSnippetTitle(body)
  const createdAt = getOptionalString(value.createdAt) ?? getIsoNow()
  const updatedAt = getOptionalString(value.updatedAt) ?? createdAt
  const sourceUrl = getOptionalString(value.sourceUrl)
  const sourceTitle = getOptionalString(value.sourceTitle)
  const keyboardHint = getOptionalString(value.keyboardHint)

  const collectionId = typeof value.collectionId === 'string' ? value.collectionId : null

  return {
    id: getOptionalString(value.id) ?? createId(),
    title,
    body,
    tags: getStoredTags(value.tags),
    favorite: Boolean(value.favorite),
    createdAt,
    updatedAt,
    collectionId,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(sourceTitle ? { sourceTitle } : {}),
    ...(keyboardHint ? { keyboardHint } : {}),
  }
}

function buildSnippet(input: SnippetDraft): Snippet {
  const body = normalizeMultilineText(input.body)

  if (!body) {
    throw new Error('Snippet body cannot be empty.')
  }

  const title = collapseWhitespace(input.title) || deriveSnippetTitle(body)
  const keyboardHint = getOptionalString(input.keyboardHint)
  const sourceUrl = getOptionalString(input.sourceUrl)
  const sourceTitle = getOptionalString(input.sourceTitle)
  const timestamp = getIsoNow()

  return {
    id: createId(),
    title,
    body,
    tags: normalizeTagList(input.tags),
    favorite: input.favorite,
    createdAt: timestamp,
    updatedAt: timestamp,
    collectionId: input.collectionId ?? null,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(sourceTitle ? { sourceTitle } : {}),
    ...(keyboardHint ? { keyboardHint } : {}),
  }
}

function updateExistingSnippet(snippet: Snippet, updates: SnippetUpdate): Snippet {
  const body = updates.body !== undefined ? normalizeMultilineText(updates.body) : snippet.body

  if (!body) {
    throw new Error('Snippet body cannot be empty.')
  }

  const title = updates.title !== undefined ? collapseWhitespace(updates.title) || deriveSnippetTitle(body) : snippet.title
  const tags = updates.tags !== undefined ? normalizeTagList(updates.tags) : snippet.tags
  const keyboardHint = updates.keyboardHint !== undefined ? getOptionalString(updates.keyboardHint) : snippet.keyboardHint

  const collectionId = updates.collectionId !== undefined ? updates.collectionId : snippet.collectionId

  return {
    id: snippet.id,
    title,
    body,
    tags,
    favorite: updates.favorite ?? snippet.favorite,
    createdAt: snippet.createdAt,
    updatedAt: getIsoNow(),
    collectionId: collectionId ?? null,
    ...(snippet.sourceUrl ? { sourceUrl: snippet.sourceUrl } : {}),
    ...(snippet.sourceTitle ? { sourceTitle: snippet.sourceTitle } : {}),
    ...(keyboardHint ? { keyboardHint } : {}),
  }
}

export function parseStoredSnippets(value: unknown): Snippet[] {
  if (!Array.isArray(value)) {
    return []
  }

  return sortSnippets(value.map(sanitizeStoredSnippet).filter((snippet): snippet is Snippet => snippet !== null))
}

async function readStorageState(): Promise<{ initialized: boolean; snippets: Snippet[] }> {
  const storedState = await getLocalStorage<Record<string, unknown>>({
    [SNIPPETS_STORAGE_KEY]: [],
    [SNIPPETS_INITIALIZED_KEY]: false,
  })

  return {
    initialized: Boolean(storedState[SNIPPETS_INITIALIZED_KEY]),
    snippets: parseStoredSnippets(storedState[SNIPPETS_STORAGE_KEY]),
  }
}

async function writeSnippets(snippets: Snippet[]): Promise<Snippet[]> {
  const sortedSnippets = sortSnippets(snippets)

  await setLocalStorage({
    [SNIPPETS_STORAGE_KEY]: sortedSnippets,
    [SNIPPETS_INITIALIZED_KEY]: true,
  })

  return sortedSnippets
}

export async function ensureSeededSnippets(): Promise<Snippet[]> {
  const { initialized, snippets } = await readStorageState()

  if (snippets.length > 0 || initialized || !ENABLE_DEMO_SNIPPETS) {
    if (!initialized) {
      await setLocalStorage({ [SNIPPETS_INITIALIZED_KEY]: true })
    }

    return snippets
  }

  const seededSnippets = DEMO_SNIPPETS.map(buildSnippet)

  return writeSnippets(seededSnippets)
}

export async function getSnippets(): Promise<Snippet[]> {
  const { snippets } = await readStorageState()

  return snippets
}

export async function createSnippet(input: SnippetDraft): Promise<Snippet[]> {
  const snippets = await getSnippets()
  const nextSnippet = buildSnippet(input)

  return writeSnippets([nextSnippet, ...snippets])
}

export async function updateSnippet(id: string, updates: SnippetUpdate): Promise<Snippet[]> {
  const snippets = await getSnippets()
  let snippetFound = false

  const nextSnippets = snippets.map((snippet) => {
    if (snippet.id !== id) {
      return snippet
    }

    snippetFound = true
    return updateExistingSnippet(snippet, updates)
  })

  if (!snippetFound) {
    throw new Error('Snippet not found.')
  }

  return writeSnippets(nextSnippets)
}

export async function deleteSnippet(id: string): Promise<Snippet[]> {
  const snippets = await getSnippets()
  const nextSnippets = snippets.filter((snippet) => snippet.id !== id)

  if (nextSnippets.length === snippets.length) {
    throw new Error('Snippet not found.')
  }

  return writeSnippets(nextSnippets)
}

export async function duplicateSnippet(id: string): Promise<Snippet[]> {
  const snippets = await getSnippets()
  const sourceSnippet = snippets.find((snippet) => snippet.id === id)

  if (!sourceSnippet) {
    throw new Error('Snippet not found.')
  }

  const duplicatedSnippet = buildSnippet({
    title: `${sourceSnippet.title} (Copy)`,
    body: sourceSnippet.body,
    tags: [...sourceSnippet.tags],
    favorite: sourceSnippet.favorite,
    collectionId: sourceSnippet.collectionId,
    ...(sourceSnippet.sourceUrl ? { sourceUrl: sourceSnippet.sourceUrl } : {}),
    ...(sourceSnippet.sourceTitle ? { sourceTitle: sourceSnippet.sourceTitle } : {}),
    ...(sourceSnippet.keyboardHint ? { keyboardHint: sourceSnippet.keyboardHint } : {}),
  })

  return writeSnippets([duplicatedSnippet, ...snippets])
}

export async function toggleFavoriteSnippet(id: string): Promise<Snippet[]> {
  const snippets = await getSnippets()
  let snippetFound = false

  const nextSnippets = snippets.map((snippet) => {
    if (snippet.id !== id) {
      return snippet
    }

    snippetFound = true
    return {
      ...snippet,
      favorite: !snippet.favorite,
      updatedAt: getIsoNow(),
    }
  })

  if (!snippetFound) {
    throw new Error('Snippet not found.')
  }

  return writeSnippets(nextSnippets)
}

export async function removeCollectionFromSnippets(collectionId: string): Promise<Snippet[]> {
  const snippets = await getSnippets()
  const hasAffected = snippets.some((s) => s.collectionId === collectionId)

  if (!hasAffected) {
    return snippets
  }

  const nextSnippets = snippets.map((snippet) => {
    if (snippet.collectionId !== collectionId) {
      return snippet
    }

    return { ...snippet, collectionId: null, updatedAt: getIsoNow() }
  })

  return writeSnippets(nextSnippets)
}

export async function saveSelectedTextSnippet(
  selectionText: string,
  metadata: { sourceUrl?: string; sourceTitle?: string; collectionId?: string | null },
): Promise<Snippet[]> {
  const body = normalizeMultilineText(selectionText)

  if (!body) {
    return getSnippets()
  }

  return createSnippet({
    title: deriveSnippetTitle(body, 40),
    body,
    tags: [],
    favorite: false,
    collectionId: metadata.collectionId ?? null,
    ...(metadata.sourceUrl ? { sourceUrl: metadata.sourceUrl } : {}),
    ...(metadata.sourceTitle ? { sourceTitle: metadata.sourceTitle } : {}),
  })
}