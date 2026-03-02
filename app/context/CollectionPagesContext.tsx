'use client'

import React, { createContext, useContext, useState } from 'react'
import { collectionPages as initialData } from '../data/mockData'
import { CollectionPageData, Article } from '../types'

interface CollectionPagesCtx {
  pages: CollectionPageData[]
  addPage: (page: CollectionPageData) => void
  deletePage: (id: string) => void
  updatePageName: (id: string, name: string) => void
  updateArticles: (pageId: string, articles: Article[]) => void
}

const CollectionPagesContext = createContext<CollectionPagesCtx | null>(null)

export function CollectionPagesProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<CollectionPageData[]>(initialData)

  const addPage = (page: CollectionPageData) =>
    setPages((prev) => [...prev, page])

  const deletePage = (id: string) =>
    setPages((prev) => prev.filter((p) => p.id !== id))

  const updatePageName = (id: string, name: string) =>
    setPages((prev) => prev.map((p) => p.id === id ? { ...p, name } : p))

  const updateArticles = (pageId: string, articles: Article[]) =>
    setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, articles } : p))

  return (
    <CollectionPagesContext.Provider value={{ pages, addPage, deletePage, updatePageName, updateArticles }}>
      {children}
    </CollectionPagesContext.Provider>
  )
}

export function useCollectionPages() {
  const ctx = useContext(CollectionPagesContext)
  if (!ctx) throw new Error('useCollectionPages must be used within CollectionPagesProvider')
  return ctx
}
