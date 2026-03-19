'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLeaveGuard } from '../context/LeaveGuardContext'
import { useRole, VENDOR_RESTRICTED_KEYS } from '../context/RoleContext'
import {
  MessageSquare, FileText, User, Monitor, Shield,
  ChevronDown, ChevronRight, Settings, PanelLeftClose, PanelLeftOpen,
  PenLine,
} from 'lucide-react'

type ChildItem = { label: string; key: string; href?: string; activeWhen?: 'exact' | 'prefix' }
type MenuItem = {
  label: string
  key: string
  icon: React.ElementType
  children?: ChildItem[]
}

const MENU: MenuItem[] = [
  {
    label: '论坛资源',
    key: '/forum',
    icon: MessageSquare,
    children: [
      { label: '论坛', key: '/forum/list' },
      { label: '金刚位', key: '/forum/diamond' },
      { label: '社区导航', key: '/forum/community-nav' },
      { label: '置顶', key: '/forum/announcement' },
      { label: '分区', key: '/tab-route' },
      { label: '集合页', key: '/collection-pages' },
      { label: 'Wiki 管理', key: '/wiki', href: '/wiki' },
      { label: '下载按钮', key: '/download-button' },
    ],
  },
  {
    label: '内容',
    key: '/content',
    icon: FileText,
    children: [
      { label: '帖子', key: '/content' },
      { label: '话题', key: '/content/topics' },
      { label: '官方内容', key: '/forum/official' },
    ],
  },
  {
    label: '用户',
    key: '/users',
    icon: User,
    children: [
      { label: '用户列表', key: '/users' },
      { label: '认证账号', key: '/users/certified' },
      { label: '马甲号', key: '/users/sockpuppet' },
    ],
  },
  {
    label: '创作者管理',
    key: '/creator',
    icon: PenLine,
    children: [
      { label: '认证创作者', key: '/creator/creators' },
      { label: '返利管理', key: '/creator/rebate' },
      { label: '素材库管理（待定）', key: '/creator/materials' },
      { label: '多语言审校管理（待定）', key: '/creator/review' },
    ],
  },
  {
    label: '平台',
    key: '/platform',
    icon: Monitor,
    children: [
      { label: '应用', key: '/platform' },
    ],
  },
  {
    label: '权限',
    key: '/permissions',
    icon: Shield,
    children: [
      { label: '角色', key: '/permissions' },
      { label: '用户', key: '/permissions/users' },
    ],
  },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const leaveGuard = useLeaveGuard()
  const role = useRole()
  const [collapsed, setCollapsed] = useState(false)
  const isVendor = role?.isVendor ?? false

  const isRestricted = (key: string) => isVendor && VENDOR_RESTRICTED_KEYS.has(key)

  const navigateTo = (href: string) => {
    if (leaveGuard?.checkBeforeLeave) {
      leaveGuard.checkBeforeLeave(() => router.push(href))
    } else {
      router.push(href)
    }
  }

  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    MENU
      .filter(item => item.children?.some(child => pathname?.startsWith(child.key)))
      .map(item => item.key)
  )

  const toggleOpen = (key: string) => {
    setOpenKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const strikethroughStyle = (key: string): React.CSSProperties =>
    isRestricted(key) ? { textDecoration: 'line-through', color: '#9CA3AF' } : {}

  return (
    <aside style={{
      width: collapsed ? 56 : 200,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      overflow: 'hidden',
      borderRight: '1px solid #E5E7EB',
      transition: 'width 0.2s',
    }}>
      {/* Logo */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 12px' : '0 14px',
        gap: 8,
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Settings size={15} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
              JoyTap Admin
            </span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Settings size={15} color="#fff" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* 展开按钮（折叠状态） */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Menu */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {MENU.map(item => {
          const Icon = item.icon
          const hasChildren = item.children !== undefined && item.children.length > 0
          const isOpen = openKeys.includes(item.key)
          const isGroupActive = item.children?.some(child => pathname?.startsWith(child.key)) ?? false
          const isLeafActive = !item.children && pathname === item.key

          if (!hasChildren) {
            return (
              <div
                key={item.key}
                title={collapsed ? item.label : undefined}
                onClick={() => navigateTo(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: collapsed ? '10px 0' : '10px 16px',
                  cursor: 'pointer',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isLeafActive ? '#1677FF' : '#374151',
                  background: isLeafActive ? '#EFF6FF' : 'transparent',
                  fontSize: 13,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                  ...strikethroughStyle(item.key),
                }}
                onMouseEnter={e => { if (!isLeafActive) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (!isLeafActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <Icon size={15} />
                {!collapsed && <span>{item.label}</span>}
              </div>
            )
          }

          return (
            <div key={item.key}>
              {/* Group header */}
              <div
                title={collapsed ? item.label : undefined}
                onClick={() => { if (collapsed) setCollapsed(false); else toggleOpen(item.key) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: collapsed ? '10px 0' : '10px 16px',
                  cursor: 'pointer',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isGroupActive ? '#1677FF' : '#374151',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <Icon size={15} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isOpen
                      ? <ChevronDown size={13} style={{ color: '#9CA3AF' }} />
                      : <ChevronRight size={13} style={{ color: '#9CA3AF' }} />
                    }
                  </>
                )}
              </div>

              {/* Children */}
              {!collapsed && isOpen && item.children!.map(child => {
                const href = child.href ?? child.key
                const basePath = child.key.replace(/\/config$/, '')
                // 若存在兄弟项的 key 以当前 key 为前缀（如 /users 与 /users/sockpuppet），则当前项仅做精确匹配，避免同时高亮
                const hasLongerSibling = item.children!.some(c => c.key !== child.key && c.key.startsWith(child.key + '/'))
                let isActive: boolean
                if (child.activeWhen === 'exact') {
                  isActive = pathname === child.key
                } else if (child.activeWhen === 'prefix') {
                  isActive = !!pathname?.startsWith(child.key + '/')
                } else if (hasLongerSibling) {
                  isActive = pathname === child.key
                } else {
                  isActive = pathname === child.key || !!pathname?.startsWith(basePath + '/')
                }
                const restricted = isRestricted(child.key)
                return (
                  <div
                    key={child.key + child.label}
                    onClick={() => navigateTo(href)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px 8px 40px',
                      cursor: 'pointer',
                      color: isActive ? '#fff' : '#6B7280',
                      background: isActive ? '#1677FF' : 'transparent',
                      fontSize: 13,
                      transition: 'all 0.15s',
                      userSelect: 'none',
                      ...(restricted && !isActive ? { textDecoration: 'line-through', color: '#9CA3AF' } : {}),
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    {child.label}
                  </div>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
