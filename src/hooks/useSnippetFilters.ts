import { useDeferredValue, useMemo } from 'react'
import type { Collection } from '../types/collection'
import type { Snippet } from '../types/snippet'
import { matchesSnippetQuery } from '../utils/text'

export type FilterView = 'all' | 'favorites' | 'unassigned' | (string & Record<never, never>)

export function useSnippetFilters(
  snippets: Snippet[],
  collections: Collection[],
  searchQuery: string,
  activeFilter: FilterView,
) {
  const deferredSearch = useDeferredValue(searchQuery)

  const filtered = useMemo(() => {
    let result = snippets

    if (activeFilter === 'favorites') {
      result = result.filter((s) => s.favorite)
    } else if (activeFilter === 'unassigned') {
      result = result.filter((s) => !s.collectionId)
    } else if (activeFilter !== 'all') {
      result = result.filter((s) => s.collectionId === activeFilter)
    }

    if (deferredSearch) {
      result = result.filter((s) => matchesSnippetQuery(s, deferredSearch))
    }

    return result
  }, [snippets, activeFilter, deferredSearch])

  const countByFilter = useMemo(() => {
    const counts: Record<string, number> = {
      all: snippets.length,
      favorites: snippets.filter((s) => s.favorite).length,
      unassigned: snippets.filter((s) => !s.collectionId).length,
    }

    for (const collection of collections) {
      counts[collection.id] = snippets.filter((s) => s.collectionId === collection.id).length
    }

    return counts
  }, [snippets, collections])

  return { filtered, countByFilter }
}
