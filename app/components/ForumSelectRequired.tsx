'use client'

import React from 'react'
import { useForumFilter } from '../context/ForumFilterContext'

/** 当未选择论坛时展示的占位提示 */
const EMPTY_MESSAGE = '请选择论坛以查看内容'

interface Props {
  children: React.ReactNode
}

/**
 * 包裹需要选择论坛后才展示内容的页面。
 * 当 forumId 为空时显示「请选择论坛以查看内容」提示。
 */
export default function ForumSelectRequired({ children }: Props) {
  const forumFilter = useForumFilter()
  const hasForum = !!forumFilter?.forumId

  if (!forumFilter) {
    return <>{children}</>
  }

  if (!hasForum) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 280,
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>{EMPTY_MESSAGE}</p>
      </div>
    )
  }

  return <>{children}</>
}
