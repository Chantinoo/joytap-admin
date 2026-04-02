'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Dropdown, Select, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { Languages, ChevronDown } from 'lucide-react'
import { useForumFilter } from '../context/ForumFilterContext'
import { useRole, type AdminRole } from '../context/RoleContext'

const ROLE_LABELS: Record<AdminRole, string> = {
  platform: '平台运营',
  vendor: '厂商',
}

// 显示游戏筛选器且包含「全部」选项的页面（可选）
const FILTER_OPTIONAL_PATHS = [
  '/users/certified',
  '/creator/creators',
  '/creator/rebate',
  '/creator/materials',
  '/creator/review',
  '/forum/official',
]

// 论坛资源模块：显示游戏筛选器但不含「全部」选项（必选）
const FILTER_REQUIRED_PATHS = [
  '/forum/community-nav',
  '/forum/diamond',
  '/forum/announcement',
  '/tab-route',
  '/collection-pages',
  '/wiki',
  '/download-button',
]

function useForumFilterMode(): 'optional' | 'required' | 'none' {
  const pathname = usePathname()
  if (FILTER_REQUIRED_PATHS.some((p) => pathname?.startsWith(p))) return 'required'
  if (FILTER_OPTIONAL_PATHS.some((p) => pathname?.startsWith(p))) return 'optional'
  return 'none'
}

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const filterMode = useForumFilterMode()
  const forumFilter = useForumFilter()
  const roleContext = useRole()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header style={{
      height: 48,
      background: '#fff',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* 全局游戏筛选（客户端挂载后渲染避免 hydration 不一致） */}
      {mounted && filterMode !== 'none' && forumFilter && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>论坛：</span>
          <Select
            value={forumFilter.forumId || undefined}
            onChange={(v) => forumFilter.setForumId(v ?? '')}
            style={{ width: 140 }}
            size="middle"
            allowClear={filterMode === 'optional'}
            placeholder={filterMode === 'optional' ? '全部' : '请选择论坛'}
            getPopupContainer={() => document.body}
            popupMatchSelectWidth={140}
            styles={{ popup: { root: { zIndex: 9999 } } }}
            virtual={false}
            options={[
              ...(filterMode === 'optional' ? [{ label: '全部', value: '' }] : []),
              ...forumFilter.forumOptions.map((f) => ({ label: f.name, value: f.id })),
            ]}
          />
        </div>
      )}

      {/* 语言切换 */}
      <Tooltip title="切换语言">
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          borderRadius: 6,
          color: '#6B7280',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
        >
          <Languages size={18} />
        </button>
      </Tooltip>

      {/* 身份切换 + 用户头像 */}
      <Dropdown
        menu={{
          items: [
            { key: 'platform', label: '平台运营' },
            { key: 'vendor', label: '厂商' },
          ] as MenuProps['items'],
          onClick: ({ key }) => roleContext?.setRole(key as AdminRole),
        }}
        trigger={['click']}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 6,
          background: '#F3F4F6',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#E5E7EB' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6' }}
        >
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            {roleContext ? ROLE_LABELS[roleContext.role] : '平台运营'}
          </span>
          <ChevronDown size={14} style={{ color: '#6B7280' }} />
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            管
          </div>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>User1153159</span>
        </div>
      </Dropdown>
    </header>
  )
}
