import { getLocalStorage, setLocalStorage } from './chromeRuntime'
import { removeCollectionFromSnippets } from './snippetStorage'
import type { Collection, CollectionDraft, CollectionUpdate } from '../types/collection'
import { getIsoNow } from '../utils/dates'
import { createId } from '../utils/ids'
import { collapseWhitespace } from '../utils/text'

export const COLLECTIONS_STORAGE_KEY = 'snipbit.collections'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sanitizeStoredCollection(value: unknown): Collection | null {
  if (!isRecord(value)) {
    return null
  }

  const name = typeof value.name === 'string' ? collapseWhitespace(value.name) : ''

  if (!name) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id : createId()
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : getIsoNow()
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : createdAt
  const description =
    typeof value.description === 'string' ? collapseWhitespace(value.description) || undefined : undefined
  const color = typeof value.color === 'string' ? value.color || undefined : undefined

  return {
    id,
    name,
    createdAt,
    updatedAt,
    ...(description ? { description } : {}),
    ...(color ? { color } : {}),
  }
}

function sortCollections(collections: Collection[]): Collection[] {
  return [...collections].sort((a, b) => a.name.localeCompare(b.name))
}

export function parseStoredCollections(value: unknown): Collection[] {
  if (!Array.isArray(value)) {
    return []
  }

  return sortCollections(
    value.map(sanitizeStoredCollection).filter((c): c is Collection => c !== null),
  )
}

async function readCollections(): Promise<Collection[]> {
  const stored = await getLocalStorage<Record<string, unknown>>({
    [COLLECTIONS_STORAGE_KEY]: [],
  })

  return parseStoredCollections(stored[COLLECTIONS_STORAGE_KEY])
}

async function writeCollections(collections: Collection[]): Promise<Collection[]> {
  const sorted = sortCollections(collections)

  await setLocalStorage({ [COLLECTIONS_STORAGE_KEY]: sorted })

  return sorted
}

export async function getCollections(): Promise<Collection[]> {
  return readCollections()
}

export async function createCollection(input: CollectionDraft): Promise<Collection[]> {
  const collections = await readCollections()
  const name = collapseWhitespace(input.name)

  if (!name) {
    throw new Error('Collection name cannot be blank.')
  }

  const isDuplicate = collections.some((c) => c.name.toLowerCase() === name.toLowerCase())

  if (isDuplicate) {
    throw new Error('A collection with this name already exists.')
  }

  const now = getIsoNow()
  const nextCollection: Collection = {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    ...(input.description ? { description: input.description } : {}),
    ...(input.color ? { color: input.color } : {}),
  }

  return writeCollections([nextCollection, ...collections])
}

export async function updateCollection(id: string, updates: CollectionUpdate): Promise<Collection[]> {
  const collections = await readCollections()
  const target = collections.find((c) => c.id === id)

  if (!target) {
    throw new Error('Collection not found.')
  }

  const name = updates.name !== undefined ? collapseWhitespace(updates.name) : target.name

  if (!name) {
    throw new Error('Collection name cannot be blank.')
  }

  const isDuplicate = collections.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase())

  if (isDuplicate) {
    throw new Error('A collection with this name already exists.')
  }

  const nextCollections = collections.map((collection) => {
    if (collection.id !== id) {
      return collection
    }

    const nextDescription =
      updates.description !== undefined
        ? updates.description
          ? updates.description
          : undefined
        : collection.description

    const nextColor =
      updates.color !== undefined
        ? updates.color
          ? updates.color
          : undefined
        : collection.color

    return {
      id: collection.id,
      name,
      createdAt: collection.createdAt,
      updatedAt: getIsoNow(),
      ...(nextDescription ? { description: nextDescription } : {}),
      ...(nextColor ? { color: nextColor } : {}),
    }
  })

  return writeCollections(nextCollections)
}

export async function deleteCollection(id: string): Promise<Collection[]> {
  const collections = await readCollections()
  const nextCollections = collections.filter((c) => c.id !== id)

  if (nextCollections.length === collections.length) {
    throw new Error('Collection not found.')
  }

  // Unassign snippets from the deleted collection before removing it.
  await removeCollectionFromSnippets(id)

  return writeCollections(nextCollections)
}
