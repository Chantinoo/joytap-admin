'use client'

import React, { createContext, useContext, useState } from 'react'
import { collectionPages as initialData } from '../data/mockData'
import { mergeArticlesBuckets } from '../lib/collectionPageLocale'
import { CollectionPageData, type Article } from '../types'
import type { LangCode } from '../wiki/components/fieldI18nConstants'

interface CollectionPagesCtx {
  pages: CollectionPageData[]
  addPage: (page: CollectionPageData) => void
  deletePage: (id: string) => void
  updatePageMeta: (id: string, patch: Partial<Pick<CollectionPageData, 'name' | 'nameI18n' | 'hidden'>>) => void
  updateArticles: (pageId: string, locale: LangCode, articles: Article[]) => void
}

const CollectionPagesContext = createContext<CollectionPagesCtx | null>(null)

export function CollectionPagesProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<CollectionPageData[]>(initialData)

  const addPage = (page: CollectionPageData) =>
    setPages((prev) => [...prev, page])

  const deletePage = (id: string) =>
    setPages((prev) => prev.filter((p) => p.id !== id))

  const updatePageMeta = (id: string, patch: Partial<Pick<CollectionPageData, 'name' | 'nameI18n' | 'hidden'>>) =>
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const updateArticles = (pageId: string, locale: LangCode, articles: Article[]) =>
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p
        const nextBuckets = { ...mergeArticlesBuckets(p), [locale]: articles }
        const { articles: _legacy, ...rest } = p
        return { ...rest, articlesByLocale: nextBuckets }
      }),
    )

  return (
    <CollectionPagesContext.Provider value={{ pages, addPage, deletePage, updatePageMeta, updateArticles }}>
      {children}
    </CollectionPagesContext.Provider>
  )
}

export function useCollectionPages() {
  const ctx = useContext(CollectionPagesContext)
  if (!ctx) throw new Error('useCollectionPages must be used within CollectionPagesProvider')
  return ctx
}
