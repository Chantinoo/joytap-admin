'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLeaveGuard } from '../context/LeaveGuardContext'
import {
  MessageSquare, FileText, User, Monitor, Shield,
  ChevronDown, ChevronRight, Settings, PanelLeftClose, PanelLeftOpen,
  BookOpen, PenLine,
} from 'lucide-react'

type ChildItem = { label: string; key: string }
type MenuItem = {
  label: string
  key: string
  icon: React.ElementType
  children?: ChildItem[]
}

const MENU: MenuItem[] = [
  {
    label: '论坛管理',
    key: '/forum',
    icon: MessageSquare,
    children: [
      { label: '论坛列表', key: '/forum/list' },
      { label: '官方内容', key: '/forum/official' },
      { label: '金刚位', key: '/forum/diamond' },
      { label: '社区导航', key: '/forum/community-nav' },
      { label: '公告', key: '/forum/announcement' },
      { label: '分区管理', key: '/tab-route' },
      { label: '集合页管理', key: '/collection-pages' },
      { label: '下载按钮', key: '/download-button' },
    ],
  },
  { label: '内容管理', key: '/content', icon: FileText, children: [] },
  {
    label: '用户管理',
    key: '/users',
    icon: User,
    children: [
      { label: '用户列表', key: '/users' },
      { label: '认证账号', key: '/users/certified' },
    ],
  },
  {
    label: '创作者管理',
    key: '/creator',
    icon: PenLine,
    children: [
      { label: '认证创作者', key: '/creator/creators' },
      { label: '返利管理', key: '/creator/rebate' },
      { label: '素材库管理', key: '/creator/materials' },
      { label: '多语言审校管理', key: '/creator/review' },
    ],
  },
  { label: 'Wiki 管理', key: '/wiki', icon: BookOpen, children: [] },
  { label: '平台管理', key: '/platform', icon: Monitor, children: [] },
  { label: '权限管理', key: '/permissions', icon: Shield, children: [] },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const leaveGuard = useLeaveGuard()
  const [collapsed, setCollapsed] = useState(false)

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
                const isPrefixOfOther = item.children!.some(c => c.key !== child.key && pathname?.startsWith(c.key))
                const isActive = pathname === child.key || (pathname?.startsWith(child.key + '/') && !isPrefixOfOther)
                return (
                  <div
                    key={child.key}
                    onClick={() => navigateTo(child.key)}
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
