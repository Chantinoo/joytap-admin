'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { WikiField } from './wikiFieldSeed'
import { buildInitialWikiFieldsMap } from './wikiFieldSeed'

type WikiFieldsMap = Record<string, WikiField[]>

type Updater = WikiField[] | ((prev: WikiField[]) => WikiField[])

export interface WikiFieldsRegistryValue {
  /** 各 Wiki 分类字段（引用随更新变化，便于组件订阅） */
  fieldsByWiki: WikiFieldsMap
  /** 更新单个分类的字段列表 */
  updateWiki: (wikiKey: string, updater: Updater) => void
  /** 在一次 setState 内修改多个分类 */
  batchUpdate: (fn: (draft: WikiFieldsMap) => void) => void
}

const WikiFieldsRegistryContext = createContext<WikiFieldsRegistryValue | null>(null)

export function WikiFieldsRegistryProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<WikiFieldsMap>(() => buildInitialWikiFieldsMap())

  const updateWiki = useCallback((wikiKey: string, updater: Updater) => {
    setMap((prev) => {
      const cur = prev[wikiKey] ?? []
      const nextRows = typeof updater === 'function' ? updater(cur) : updater
      return { ...prev, [wikiKey]: nextRows }
    })
  }, [])

  const batchUpdate = useCallback((fn: (draft: WikiFieldsMap) => void) => {
    setMap((prev) => {
      const draft: WikiFieldsMap = {}
      for (const k of Object.keys(prev)) {
        draft[k] = [...prev[k]!]
      }
      fn(draft)
      return draft
    })
  }, [])

  const value = useMemo<WikiFieldsRegistryValue>(
    () => ({ fieldsByWiki: map, updateWiki, batchUpdate }),
    [map, updateWiki, batchUpdate],
  )

  return (
    <WikiFieldsRegistryContext.Provider value={value}>
      {children}
    </WikiFieldsRegistryContext.Provider>
  )
}

export function useWikiFieldsRegistry(): WikiFieldsRegistryValue {
  const ctx = useContext(WikiFieldsRegistryContext)
  if (!ctx) {
    throw new Error('useWikiFieldsRegistry must be used within WikiFieldsRegistryProvider')
  }
  return ctx
}
