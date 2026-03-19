'use client'

import React, { useEffect } from 'react'
import { useForumFilter } from '../context/ForumFilterContext'

interface Props {
  children: React.ReactNode
}

/**
 * 包裹需要选择游戏后才展示内容的页面。
 * 当 forumId 为空时自动选中下拉列表中的第一个游戏。
 */
export default function ForumSelectRequired({ children }: Props) {
  const forumFilter = useForumFilter()

  useEffect(() => {
    if (!forumFilter) return
    if (forumFilter.forumId) return
    const first = forumFilter.forumOptions[0]
    if (first) forumFilter.setForumId(first.id)
  }, [forumFilter])

  return <>{children}</>
}
