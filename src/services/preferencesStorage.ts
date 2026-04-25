import { getLocalStorage, setLocalStorage } from './chromeRuntime'

export const PREFERENCES_STORAGE_KEY = 'snipbit.preferences'

export type Preferences = {
  defaultCollectionId?: string | null
  snippetSortMode?: 'recent' | 'title' | 'favorite'
  collectionSortMode?: 'name' | 'updatedAt'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function getPreferences(): Promise<Preferences> {
  try {
    const stored = await getLocalStorage<Record<string, unknown>>({
      [PREFERENCES_STORAGE_KEY]: {},
    })
    const raw = stored[PREFERENCES_STORAGE_KEY]

    return isRecord(raw) ? (raw as Preferences) : {}
  } catch {
    return {}
  }
}

export async function updatePreferences(updates: Partial<Preferences>): Promise<Preferences> {
  const current = await getPreferences()
  const next: Preferences = { ...current, ...updates }

  await setLocalStorage({ [PREFERENCES_STORAGE_KEY]: next })

  return next
}
