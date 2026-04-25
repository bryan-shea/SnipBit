import { startTransition, useEffect, useState } from 'react'
import {
  createCollection as createCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  getCollections,
  COLLECTIONS_STORAGE_KEY,
  parseStoredCollections,
  updateCollection as updateCollectionRecord,
} from '../services/collectionStorage'
import { addStorageChangeListener } from '../services/chromeRuntime'
import type { Collection, CollectionDraft, CollectionUpdate } from '../types/collection'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const nextCollections = await getCollections()

        if (!isMounted) {
          return
        }

        startTransition(() => {
          setCollections(nextCollections)
        })
      } catch (caughtError) {
        if (isMounted) {
          setError(getErrorMessage(caughtError))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })()

    const unsubscribe = addStorageChangeListener((changes, areaName) => {
      if (areaName !== 'local') {
        return
      }

      const changed = changes[COLLECTIONS_STORAGE_KEY]

      if (!changed) {
        return
      }

      startTransition(() => {
        setCollections(parseStoredCollections(changed.newValue))
      })
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function runMutation(mutation: () => Promise<Collection[]>) {
    setError(null)

    try {
      const nextCollections = await mutation()

      startTransition(() => {
        setCollections(nextCollections)
      })

      return nextCollections
    } catch (caughtError) {
      const message = getErrorMessage(caughtError)
      setError(message)
      throw new Error(message, { cause: caughtError })
    }
  }

  return {
    collections,
    loading,
    error,
    clearError() {
      setError(null)
    },
    async createCollection(input: CollectionDraft) {
      await runMutation(() => createCollectionRecord(input))
    },
    async updateCollection(id: string, updates: CollectionUpdate) {
      await runMutation(() => updateCollectionRecord(id, updates))
    },
    async deleteCollection(id: string) {
      await runMutation(() => deleteCollectionRecord(id))
    },
  }
}
