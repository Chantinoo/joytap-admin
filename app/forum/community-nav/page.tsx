'use client'

import React, { useContext, useMemo, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { CSS } from '@dnd-kit/utilities'
import { Button, Input, Modal, Select, Space, Switch, Table, Tag, message } from 'antd'
import { GripVertical, Plus } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import ForumSelectRequired from '../../components/ForumSelectRequired'

// ── 拖拽排序 ─────────────────────────────────────────────────────────────────
interface RowContextValue {
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: SyntheticListenerMap
}
const RowContext = React.createContext<RowContextValue>({})

const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext)
  return (
    <span
      style={{ cursor: 'move', display: 'inline-flex', padding: '4px 0' }}
      ref={setActivatorNodeRef}
      {...listeners}
    >
      <GripVertical size={14} style={{ color: '#9CA3AF' }} />
    </span>
  )
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string
}

const SortableRow: React.FC<RowProps> = (props) => {
  const rowKey = props['data-row-key']
  const isDiscussion = rowKey === 'discussion'
  const {
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowKey, disabled: isDiscussion })

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  }

  const contextValue = useMemo(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  )

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} />
    </RowContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 数据模型（ discriminated union，每种类型只包含必要字段）
// ─────────────────────────────────────────────────────────────────────────────

/** Wiki 导航可选列表（与 Wiki 管理中的导航一致） */
type WikiNavOption = { key: string; label: string; description: string; link: string }

/** 社区导航条目：交流(固定) | 单个 Wiki | 下拉菜单 | 充值入口 */
type CommunityNavEntry =
  | { kind: 'discussion'; id: string }
  | { kind: 'wiki'; id: string; wikiKey: string; displayName: string; enabled: boolean }
  | { kind: 'dropdown'; id: string; title: string; wikiKeys: string[]; enabled: boolean }
  | { kind: 'recharge'; id: string; title: string; link: string; enabled: boolean }

const WIKI_OPTIONS: WikiNavOption[] = [
  { key: 'items', label: '道具', description: '武器、防具、消耗品、材料等游戏道具', link: '/wiki/items' },
  { key: 'monsters', label: '怪物', description: '普通怪物、MVP、Mini Boss 等', link: '/wiki/monsters' },
  { key: 'cards', label: '卡片', description: '怪物掉落卡片及其效果', link: '/wiki/cards' },
  { key: 'pets', label: '宠物', description: '可捕获的宠物及其属性、亲密度等', link: '/wiki/pets' },
  { key: 'boxes', label: '箱子', description: '宝箱、礼包等可开启的容器类道具', link: '/wiki/boxes' },
  { key: 'arrows', label: '箭矢制作', description: '弓箭手系列箭矢的制作配方', link: '/wiki/arrows' },
  { key: 'sets', label: '套装', description: '装备套装组合及套装效果', link: '/wiki/sets' },
  { key: 'skills', label: '技能模拟', description: '各职业技能树与技能效果模拟', link: '/wiki/skills' },
  { key: 'npcs', label: 'NPC', description: '游戏内 NPC 位置、功能与对话', link: '/wiki/npcs' },
  { key: 'maps', label: '地图', description: '游戏地图信息、怪物分布与传送点', link: '/wiki/maps' },
]

const getWikiByKey = (key: string) => WIKI_OPTIONS.find((n) => n.key === key)

/** 获取条目的展示链接（新建时自动生成） */
function getEntryLink(entry: CommunityNavEntry): string {
  if (entry.kind === 'discussion') return '/forum/list'
  if (entry.kind === 'wiki') return getWikiByKey(entry.wikiKey)?.link ?? ''
  if (entry.kind === 'recharge') return entry.link
  return ''
}

/** 获取下拉菜单条目的所有链接 */
function getDropdownLinks(entry: CommunityNavEntry): string[] {
  if (entry.kind !== 'dropdown') return []
  return entry.wikiKeys
    .map((k) => getWikiByKey(k)?.link)
    .filter((l): l is string => !!l)
}

/** 获取条目的导航名称 */
function getEntryTitle(entry: CommunityNavEntry): string {
  if (entry.kind === 'discussion') return '交流'
  if (entry.kind === 'wiki') return entry.displayName
  if (entry.kind === 'dropdown') return entry.title
  return entry.title
}

const INITIAL_ENTRIES: CommunityNavEntry[] = [
  { kind: 'discussion', id: 'discussion' },
  {
    kind: 'dropdown',
    id: 'dropdown-db',
    title: '数据库',
    wikiKeys: ['pets', 'boxes', 'arrows', 'sets', 'skills'],
    enabled: true,
  },
  { kind: 'wiki', id: 'wiki-cards', wikiKey: 'cards', displayName: '卡片', enabled: true },
  { kind: 'wiki', id: 'wiki-maps', wikiKey: 'maps', displayName: '地图', enabled: true },
  { kind: 'wiki', id: 'wiki-skills', wikiKey: 'skills', displayName: '技能模拟', enabled: true },
  { kind: 'wiki', id: 'wiki-npcs', wikiKey: 'npcs', displayName: 'NPC', enabled: true },
  { kind: 'recharge', id: 'recharge', title: '充值优惠', link: '/recharge', enabled: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// 页面组件
// ─────────────────────────────────────────────────────────────────────────────

export default function CommunityNavPage() {
  const [entries, setEntries] = useState<CommunityNavEntry[]>(INITIAL_ENTRIES)
  const [navModalOpen, setNavModalOpen] = useState(false)
  const [dropdownModalOpen, setDropdownModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CommunityNavEntry | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // ── 新增导航项（Wiki 或 充值）────────────────────────────────────────────
  const [navType, setNavType] = useState<'wiki' | 'recharge'>('wiki')
  const [navWikiKey, setNavWikiKey] = useState<string | undefined>()
  const [navDisplayName, setNavDisplayName] = useState('')
  const [navEnabled, setNavEnabled] = useState(true)
  const [navRechargeLink, setNavRechargeLink] = useState('')

  const resetNavForm = () => {
    setEditingEntry(null)
    setNavType('wiki')
    setNavWikiKey(undefined)
    setNavDisplayName('')
    setNavEnabled(true)
    setNavRechargeLink('')
  }

  const openEditNav = (entry: CommunityNavEntry) => {
    if (entry.kind === 'wiki') {
      setEditingEntry(entry)
      setNavType('wiki')
      setNavWikiKey(entry.wikiKey)
      setNavDisplayName(entry.displayName)
      setNavEnabled(entry.enabled)
      setNavRechargeLink('')
      setNavModalOpen(true)
    } else if (entry.kind === 'recharge') {
      setEditingEntry(entry)
      setNavType('recharge')
      setNavDisplayName(entry.title)
      setNavRechargeLink(entry.link)
      setNavEnabled(entry.enabled)
      setNavWikiKey(undefined)
      setNavModalOpen(true)
    }
  }

  const handleAddNav = () => {
    if (navType === 'wiki') {
      if (!navWikiKey) {
        messageApi.error('请选择 Wiki 导航')
        return
      }
      const w = getWikiByKey(navWikiKey)
      if (!w) return
      const displayName = navDisplayName.trim() || w.label
      if (editingEntry && editingEntry.kind === 'wiki') {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === editingEntry.id
              ? { ...e, kind: 'wiki' as const, wikiKey: navWikiKey, displayName, enabled: navEnabled }
              : e
          )
        )
        messageApi.success('已更新')
      } else {
        const newEntry: CommunityNavEntry = {
          kind: 'wiki',
          id: `wiki-${Date.now()}`,
          wikiKey: navWikiKey,
          displayName,
          enabled: navEnabled,
        }
        setEntries((prev) => [...prev, newEntry])
        messageApi.success('已新增导航项')
      }
      setNavModalOpen(false)
      resetNavForm()
      return
    }
    const title = navDisplayName.trim() || '充值优惠'
    const link = navRechargeLink.trim()
    if (!link) {
      messageApi.error('请输入跳转链接')
      return
    }
    if (editingEntry && editingEntry.kind === 'recharge') {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id ? { ...e, kind: 'recharge' as const, title, link, enabled: navEnabled } : e
        )
      )
      messageApi.success('已更新')
    } else {
      const newEntry: CommunityNavEntry = {
        kind: 'recharge',
        id: `recharge-${Date.now()}`,
        title,
        link,
        enabled: navEnabled,
      }
      setEntries((prev) => [...prev, newEntry])
      messageApi.success('已新增导航项')
    }
    setNavModalOpen(false)
    resetNavForm()
  }

  // ── 新增下拉菜单 ────────────────────────────────────────────────────────
  const [dropdownTitle, setDropdownTitle] = useState('数据库')
  const [dropdownWikiKeys, setDropdownWikiKeys] = useState<string[]>([])
  const [dropdownEnabled, setDropdownEnabled] = useState(true)

  const openEditDropdown = (entry: CommunityNavEntry) => {
    if (entry.kind !== 'dropdown') return
    setEditingEntry(entry)
    setDropdownTitle(entry.title)
    setDropdownWikiKeys(entry.wikiKeys)
    setDropdownEnabled(entry.enabled)
    setDropdownModalOpen(true)
  }

  const handleAddDropdown = () => {
    const title = dropdownTitle.trim() || '数据库'
    if (!dropdownWikiKeys.length) {
      messageApi.error('请至少选择一个 Wiki 导航')
      return
    }
    if (editingEntry && editingEntry.kind === 'dropdown') {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id
            ? { ...e, kind: 'dropdown' as const, title, wikiKeys: dropdownWikiKeys, enabled: dropdownEnabled }
            : e
        )
      )
      messageApi.success('已更新')
    } else {
      const newEntry: CommunityNavEntry = {
        kind: 'dropdown',
        id: `dropdown-${Date.now()}`,
        title,
        wikiKeys: dropdownWikiKeys,
        enabled: dropdownEnabled,
      }
      setEntries((prev) => [...prev, newEntry])
      messageApi.success('已新增下拉菜单')
    }
    setDropdownModalOpen(false)
    setEditingEntry(null)
    setDropdownTitle('数据库')
    setDropdownWikiKeys([])
    setDropdownEnabled(true)
  }

  const toggleEnabled = (id: string, enabled: boolean) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.kind === 'discussion') return e
        if (e.id === id) return { ...e, enabled }
        return e
      }),
    )
  }

  const handleDelete = (entry: CommunityNavEntry) => {
    if (entry.kind === 'discussion') {
      messageApi.warning('默认交流入口不可删除')
      return
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    messageApi.success('已删除')
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setEntries((prev) => {
        const activeIndex = prev.findIndex((e) => e.id === active.id)
        const overIndex = prev.findIndex((e) => e.id === over?.id)
        if (activeIndex === -1 || overIndex === -1) return prev
        return arrayMove(prev, activeIndex, overIndex)
      })
    }
  }

  const columns = [
    {
      key: 'sort',
      width: 40,
      align: 'center' as const,
      render: (_: unknown, entry: CommunityNavEntry) =>
        entry.kind === 'discussion' ? null : <DragHandle />,
    },
    {
      title: '导航名称',
      key: 'title',
      width: 160,
      render: (_: unknown, entry: CommunityNavEntry) => (
        <Space size={4} orientation="vertical">
          <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{getEntryTitle(entry)}</span>
          {entry.kind === 'discussion' && <Tag color="blue">默认</Tag>}
          {entry.kind === 'dropdown' && (
            <Tag color="geekblue">{entry.wikiKeys.length} 个子项</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '链接',
      key: 'link',
      width: 260,
      ellipsis: true as const,
      render: (_: unknown, entry: CommunityNavEntry) => {
        if (entry.kind === 'dropdown') {
          const links = getDropdownLinks(entry)
          if (links.length === 0) return <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              {links.map((link) => (
                <span
                  key={link}
                  style={{
                    color: '#1890ff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  {link}
                </span>
              ))}
            </div>
          )
        }
        const link = getEntryLink(entry)
        if (!link) return <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
        if (entry.kind === 'discussion')
          return (
            <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#6B7280' }}>
              {link}
            </code>
          )
        return (
          <span
            style={{
              fontSize: 12,
              color: '#1890ff',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {link}
          </span>
        )
      },
    },
    {
      title: '状态',
      key: 'enabled',
      width: 90,
      render: (_: unknown, entry: CommunityNavEntry) => {
        const enabled = entry.kind === 'discussion' ? true : 'enabled' in entry ? entry.enabled : false
        return (
          <Switch
            size="small"
            checked={enabled}
            disabled={entry.kind === 'discussion'}
            onChange={(v) => toggleEnabled(entry.id, v)}
          />
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, entry: CommunityNavEntry) =>
        entry.kind !== 'discussion' ? (
          <Space size={8}>
            <Button
              type="link"
              size="small"
              onClick={() =>
                entry.kind === 'dropdown' ? openEditDropdown(entry) : openEditNav(entry)
              }
            >
              编辑
            </Button>
            <Button type="link" danger size="small" onClick={() => handleDelete(entry)}>
              删除
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb items={[{ label: '论坛管理', href: '/forum/list' }, { label: '社区导航' }]} />

      <ForumSelectRequired>
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>社区导航配置</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              配置顶部导航栏与下拉菜单，关联 Wiki 导航和充值入口
            </p>
          </div>
          <Space size={8}>
            <Button
              icon={<Plus size={14} />}
              onClick={() => {
                setEditingEntry(null)
                setDropdownTitle('数据库')
                setDropdownWikiKeys([])
                setDropdownEnabled(true)
                setDropdownModalOpen(true)
              }}
            >
              新增下拉菜单
            </Button>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                resetNavForm()
                setNavModalOpen(true)
              }}
            >
              新增导航项
            </Button>
          </Space>
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          <DndContext sensors={sensors} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext
              items={entries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table<CommunityNavEntry>
                dataSource={entries}
                rowKey="id"
                pagination={false}
                size="middle"
                columns={columns}
                components={{ body: { row: SortableRow } }}
              />
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* 新增/编辑导航项 */}
      <Modal
        title={editingEntry ? '编辑导航项' : '新增导航项'}
        open={navModalOpen}
        onCancel={() => { setNavModalOpen(false); resetNavForm(); setEditingEntry(null) }}
        onOk={handleAddNav}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ fontSize: 13, color: '#374151' }}>导航类型 <span style={{ color: '#EF4444' }}>*</span></span>
            <Select
              value={navType}
              onChange={setNavType}
              options={[
                { label: 'Wiki 导航', value: 'wiki' },
                { label: '充值入口', value: 'recharge' },
              ]}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>
          {navType === 'wiki' && (
            <div>
              <span style={{ fontSize: 13, color: '#374151' }}>选择 Wiki 导航 <span style={{ color: '#EF4444' }}>*</span></span>
              <Select
                value={navWikiKey}
                onChange={setNavWikiKey}
                placeholder="选择要关联的 Wiki 导航"
                options={WIKI_OPTIONS.map((n) => ({ label: `${n.label}${n.description ? ` - ${n.description}` : ''}`, value: n.key }))}
                  style={{ width: '100%', marginTop: 6 }}
                showSearch
                filterOption={false}
              />
            </div>
          )}
          <div>
            <span style={{ fontSize: 13, color: '#374151' }}>显示名称</span>
            <Input
              placeholder={navType === 'recharge' ? '例如：充值优惠' : '不填则使用所选 Wiki 名称'}
              value={navDisplayName}
              onChange={(e) => setNavDisplayName(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>
          {navType === 'recharge' && (
            <div>
              <span style={{ fontSize: 13, color: '#374151' }}>跳转链接 <span style={{ color: '#EF4444' }}>*</span></span>
              <Input
                placeholder="例如：/recharge"
                value={navRechargeLink}
                onChange={(e) => setNavRechargeLink(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>启用状态</span>
            <Switch checked={navEnabled} onChange={setNavEnabled} size="small" />
          </div>
        </div>
      </Modal>

      {/* 新增/编辑下拉菜单 */}
      <Modal
        title={editingEntry?.kind === 'dropdown' ? '编辑下拉菜单' : '新增下拉菜单'}
        open={dropdownModalOpen}
        onCancel={() => {
          setDropdownModalOpen(false)
          setEditingEntry(null)
          setDropdownTitle('数据库')
          setDropdownWikiKeys([])
          setDropdownEnabled(true)
        }}
        onOk={handleAddDropdown}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ fontSize: 13, color: '#374151' }}>下拉菜单名称 <span style={{ color: '#EF4444' }}>*</span></span>
            <Input
              placeholder="例如：数据库"
              value={dropdownTitle}
              onChange={(e) => setDropdownTitle(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <span style={{ fontSize: 13, color: '#374151' }}>选择 Wiki 导航 <span style={{ color: '#EF4444' }}>*</span></span>
            <Select
              mode="multiple"
              value={dropdownWikiKeys}
              onChange={setDropdownWikiKeys}
              placeholder="选择要收进下拉菜单的 Wiki 导航"
              options={WIKI_OPTIONS.map((n) => ({ label: `${n.label}${n.description ? ` - ${n.description}` : ''}`, value: n.key }))}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>启用状态</span>
            <Switch checked={dropdownEnabled} onChange={setDropdownEnabled} size="small" />
          </div>
        </div>
      </Modal>
      </ForumSelectRequired>
    </div>
  )
}
