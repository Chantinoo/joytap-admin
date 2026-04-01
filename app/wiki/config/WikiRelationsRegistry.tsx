'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { WikiRelationDefinition, WikiRelationInstanceRow } from './wikiRelationDefinitions'
import { buildInitialRelationInstanceRows, buildInitialWikiRelations } from './wikiRelationDefinitions'

type RelationUpdater = WikiRelationDefinition[] | ((prev: WikiRelationDefinition[]) => WikiRelationDefinition[])
type InstanceUpdater =
  | WikiRelationInstanceRow[]
  | ((prev: WikiRelationInstanceRow[]) => WikiRelationInstanceRow[])

export interface WikiRelationsRegistryValue {
  relations: WikiRelationDefinition[]
  setRelations: React.Dispatch<React.SetStateAction<WikiRelationDefinition[]>>
  updateRelations: (updater: RelationUpdater) => void
  instanceRows: WikiRelationInstanceRow[]
  setInstanceRows: React.Dispatch<React.SetStateAction<WikiRelationInstanceRow[]>>
  updateInstanceRows: (updater: InstanceUpdater) => void
  getRelation: (key: string) => WikiRelationDefinition | undefined
}

const WikiRelationsRegistryContext = createContext<WikiRelationsRegistryValue | null>(null)

export function WikiRelationsRegistryProvider({ children }: { children: React.ReactNode }) {
  const [relations, setRelations] = useState<WikiRelationDefinition[]>(() => buildInitialWikiRelations())
  const [instanceRows, setInstanceRows] = useState<WikiRelationInstanceRow[]>(() =>
    buildInitialRelationInstanceRows(),
  )

  const updateRelations = useCallback((updater: RelationUpdater) => {
    setRelations((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  const updateInstanceRows = useCallback((updater: InstanceUpdater) => {
    setInstanceRows((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  const getRelation = useCallback(
    (key: string) => relations.find((r) => r.key === key),
    [relations],
  )

  const value = useMemo<WikiRelationsRegistryValue>(
    () => ({
      relations,
      setRelations,
      updateRelations,
      instanceRows,
      setInstanceRows,
      updateInstanceRows,
      getRelation,
    }),
    [relations, updateRelations, instanceRows, updateInstanceRows, getRelation],
  )

  return (
    <WikiRelationsRegistryContext.Provider value={value}>{children}</WikiRelationsRegistryContext.Provider>
  )
}

export function useWikiRelationsRegistry(): WikiRelationsRegistryValue {
  const ctx = useContext(WikiRelationsRegistryContext)
  if (!ctx) {
    throw new Error('useWikiRelationsRegistry must be used within WikiRelationsRegistryProvider')
  }
  return ctx
}
