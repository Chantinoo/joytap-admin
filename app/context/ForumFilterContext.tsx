'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { FORUM_OPTIONS } from '../data/forums'

const STORAGE_KEY = 'joytap-admin-forum-filter'
export const FORUM_ALL = '' // 全部

type ForumFilterContextValue = {
  forumId: string
  setForumId: (id: string) => void
  forumOptions: { id: string; name: string }[]
}

const ForumFilterContext = createContext<ForumFilterContextValue | null>(null)

export function ForumFilterProvider({ children }: { children: React.ReactNode }) {
  const [forumId, setForumIdState] = useState<string>(FORUM_ALL)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && FORUM_OPTIONS.some((f) => f.id === stored)) {
        setForumIdState(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  const setForumId = useCallback((id: string) => {
    setForumIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // ignore
    }
  }, [])

  const value: ForumFilterContextValue = {
    forumId,
    setForumId,
    forumOptions: FORUM_OPTIONS,
  }

  return (
    <ForumFilterContext.Provider value={value}>
      {children}
    </ForumFilterContext.Provider>
  )
}

export function useForumFilter(): ForumFilterContextValue | null {
  return useContext(ForumFilterContext)
}
