import { startTransition, useEffect, useState } from 'react'
import {
  createSnippet as createSnippetRecord,
  deleteSnippet as deleteSnippetRecord,
  duplicateSnippet as duplicateSnippetRecord,
  ensureSeededSnippets,
  getSnippets,
  parseStoredSnippets,
  SNIPPETS_STORAGE_KEY,
  toggleFavoriteSnippet as toggleFavoriteSnippetRecord,
  updateSnippet as updateSnippetRecord,
} from '../services/snippetStorage'
import { addStorageChangeListener } from '../services/chromeRuntime'
import type { Snippet, SnippetDraft, SnippetUpdate } from '../types/snippet'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while updating SnipBit.'
}

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)

    try {
      await ensureSeededSnippets()
      const nextSnippets = await getSnippets()

      startTransition(() => {
        setSnippets(nextSnippets)
      })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        await ensureSeededSnippets()
        const nextSnippets = await getSnippets()

        if (!isMounted) {
          return
        }

        startTransition(() => {
          setSnippets(nextSnippets)
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

      const changedSnippets = changes[SNIPPETS_STORAGE_KEY]

      if (!changedSnippets) {
        return
      }

      startTransition(() => {
        setSnippets(parseStoredSnippets(changedSnippets.newValue))
      })
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function runMutation(mutation: () => Promise<Snippet[]>) {
    setError(null)

    try {
      const nextSnippets = await mutation()

      startTransition(() => {
        setSnippets(nextSnippets)
      })

      return nextSnippets
    } catch (caughtError) {
      const message = getErrorMessage(caughtError)
      setError(message)
      throw new Error(message)
    }
  }

  return {
    snippets,
    loading,
    error,
    refresh,
    clearError() {
      setError(null)
    },
    async createSnippet(input: SnippetDraft) {
      await runMutation(() => createSnippetRecord(input))
    },
    async updateSnippet(id: string, updates: SnippetUpdate) {
      await runMutation(() => updateSnippetRecord(id, updates))
    },
    async deleteSnippet(id: string) {
      await runMutation(() => deleteSnippetRecord(id))
    },
    async duplicateSnippet(id: string) {
      await runMutation(() => duplicateSnippetRecord(id))
    },
    async toggleFavorite(id: string) {
      await runMutation(() => toggleFavoriteSnippetRecord(id))
    },
  }
}