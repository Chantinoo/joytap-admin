'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Tag,
  Space,
  Modal,
  Input,
  message,
  Tooltip,
  Popconfirm,
  Segmented,
  Select,
} from 'antd'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Trash2,
  List,
  Grid2x2,
  LayoutGrid,
  Eye,
  Pencil,
  Image as ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react'
import {
  ContentModule,
  CollectionListModule,
  CollectionGridModule,
  PostGridModule,
  PostGridLayout,
  MODULE_TYPE_CONFIG,
  CollectionEntry,
  PostEntry,
  TAB_PARTITION_LAYOUT_CONFIG,
  tabRouteHasSecondaryTabs,
  type TabRoute,
} from '../../types'
import { initialTabRoutes, guidesModules } from '../../data/mockData'
import { subTabPrimaryDisplayName, tabPrimaryDisplayName } from '../../lib/tabRouteLocale'
import { useCollectionPages } from '../../context/CollectionPagesContext'
import { useLeaveGuard } from '../../context/LeaveGuardContext'
import {
  totalArticlesCount,
  collectionPageMatchesPublicLink,
  primaryCollectionLink,
} from '../../lib/collectionPageLocale'
import ImageCropModal from '../../components/ImageCropModal'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import ForumSelectRequired from '../../components/ForumSelectRequired'

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const MODULE_STATE_PRIMARY = '__primary'

function cloneModulesDeep(m: ContentModule[]): ContentModule[] {
  return JSON.parse(JSON.stringify(m)) as ContentModule[]
}

function buildModulesState(
  tabInfo: TabRoute | undefined,
  tabId: string,
  guidesFallback: ContentModule[],
): { map: Record<string, ContentModule[]>; firstSubId: string | null } {
  if (!tabInfo) {
    return { map: { [MODULE_STATE_PRIMARY]: [] }, firstSubId: null }
  }
  if (tabRouteHasSecondaryTabs(tabInfo) && tabInfo.subTabs?.length) {
    const sorted = [...tabInfo.subTabs].sort((a, b) => a.sortOrder - b.sortOrder)
    const map: Record<string, ContentModule[]> = {}
    for (const st of sorted) {
      map[st.id] = st.modules?.length ? cloneModulesDeep(st.modules) : []
    }
    return { map, firstSubId: sorted[0]?.id ?? null }
  }
  const primary =
    tabInfo.modules?.length
      ? cloneModulesDeep(tabInfo.modules)
      : tabId === '2'
        ? cloneModulesDeep(guidesFallback)
        : []
  return { map: { [MODULE_STATE_PRIMARY]: primary }, firstSubId: null }
}

// ─────────────────────────────────────────────
// 只读 Link 展示
// ─────────────────────────────────────────────
function LinkDisplay({ value }: { value: string }) {
  return value ? (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      style={{ fontSize: 11, color: '#1677FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  ) : (
    <span style={{ fontSize: 11, color: '#C0C8D0' }}>未设置链接</span>
  )
}

// ─────────────────────────────────────────────
// CollectionReplacer：替换图标 + 搜索下拉
// ─────────────────────────────────────────────
type AvailableCollection = { id: string; name: string; link: string; postsTotal?: number }

function CollectionReplacer({
  currentName,
  available,
  onReplace,
}: {
  currentName: string
  available: AvailableCollection[]
  onReplace: (name: string, link: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest?.('.ant-select-dropdown')) return
      if (containerRef.current && !containerRef.current.contains(target as Node)) {
        setOpen(false)
        setSelected(undefined)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleConfirm = () => {
    if (!selected) return
    const col = available.find((c) => c.id === selected)
    if (col) onReplace(col.name, col.link)
    setOpen(false)
    setSelected(undefined)
  }

  const handleCancel = () => { setOpen(false); setSelected(undefined) }

  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }} onClick={(e) => e.stopPropagation()}>
      {/* 替换按钮在左侧 */}
      <Button
        type="text"
        size="small"
        icon={<Pencil size={12} color={open ? '#1677FF' : '#9CA3AF'} />}
        onClick={() => { setOpen((v) => !v); setSelected(undefined) }}
        style={{
          padding: '0 4px',
          height: 22,
          flexShrink: 0,
          borderRadius: 4,
          background: open ? '#EFF6FF' : 'transparent',
        }}
      />

      {open ? (
        /* 展开状态：下拉选择 + 确认/取消 */
        <>
          <Select
            autoFocus
            showSearch
            size="small"
            placeholder="搜索集合页..."
            value={selected}
            onChange={setSelected}
            style={{ width: 160, fontSize: 12 }}
            optionFilterProp="label"
            options={available.map((c) => ({
              value: c.id,
              label: c.postsTotal != null ? `${c.name}（${c.postsTotal}）` : c.name,
            }))}
            popupMatchSelectWidth={160}
          />
          <Button
            type="primary"
            size="small"
            disabled={!selected}
            style={{ padding: '0 8px', fontSize: 11, height: 22, borderRadius: 4, flexShrink: 0 }}
            onClick={handleConfirm}
          >
            确认
          </Button>
          <Button
            size="small"
            style={{ padding: '0 8px', fontSize: 11, height: 22, borderRadius: 4, flexShrink: 0 }}
            onClick={handleCancel}
          >
            取消
          </Button>
        </>
      ) : (
        /* 收起状态：只显示名称 */
        <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentName}
        </span>
      )}
    </div>
  )
}

function CollectionListEditor({
  mod,
  onChange,
  onEditCollection,
  available,
}: {
  mod: CollectionListModule
  onChange: (m: CollectionListModule) => void
  onEditCollection: (col: CollectionEntry) => void
  available: AvailableCollection[]
}) {
  const updateCollection = (id: string, patch: Partial<CollectionEntry>) => {
    onChange({ ...mod, collections: mod.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* 表头 */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 90px 90px 64px 64px', gap: 8, padding: '4px 8px 8px', borderBottom: '1px solid #E5E7EB' }}>
        {['集合页名称', '链接', '修改时间', '操作人', '文章数', ''].map((h) => (
          <span key={h} style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
        ))}
      </div>

      {mod.collections.map((col) => (
        <div
          key={col.id}
          style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 90px 90px 64px 64px', gap: 8, alignItems: 'center', padding: '8px', borderBottom: '1px solid #F9FAFB', borderRadius: 6 }}
        >
          {/* 名称列：替换图标在左 + 名称/选择器 */}
          <CollectionReplacer
            currentName={col.name}
            available={available}
            onReplace={(name, link) => updateCollection(col.id, { name, link })}
          />

          {/* 链接（只读） */}
          <LinkDisplay value={col.link} />

          {/* 修改时间 */}
          <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{col.addedAt ?? '—'}</span>

          {/* 操作人 */}
          <span style={{ fontSize: 11, color: '#6B7280' }}>{col.operator ?? '—'}</span>

          {/* 文章数 */}
          <span style={{ fontSize: 12, color: '#6B7280' }}>{col.articlesCount} 篇</span>

          {/* 操作 */}
          <Space size={2}>
            <Tooltip title="管理集合页">
              <Button type="text" size="small" icon={<ExternalLink size={13} color="#4F46E5" />} onClick={() => onEditCollection(col)} style={{ padding: '0 4px' }} />
            </Tooltip>
            <Popconfirm
              title={`确认移除「${col.name}」？`}
              onConfirm={() => onChange({ ...mod, collections: mod.collections.filter((c) => c.id !== col.id) })}
              okText="移除" cancelText="取消" okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<Trash2 size={13} color="#EF4444" />} style={{ padding: '0 4px' }} />
            </Popconfirm>
          </Space>
        </div>
      ))}

      {/* 单篇集合页：仅当未选择时显示添加，每次只能有一个 */}
      {mod.collections.length === 0 && (
        <AddCollectionRow
          available={available}
          onAdd={(name, link) => {
            const newCol: CollectionEntry = {
              id: `cl-${Date.now()}`, name, link, articlesCount: 0, viewsCount: 0,
              addedAt: new Date().toISOString().slice(0, 10),
              operator: 'Admin',
            }
            onChange({ ...mod, collections: [newCol] })
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// AddCollectionRow：底部「+ 添加集合页」行（带选择器）
// ─────────────────────────────────────────────
function AddCollectionRow({
  available,
  onAdd,
}: {
  available: AvailableCollection[]
  onAdd: (name: string, link: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest?.('.ant-select-dropdown')) return
      if (containerRef.current && !containerRef.current.contains(target as Node)) {
        setOpen(false)
        setSelected(undefined)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleConfirm = () => {
    if (!selected) return
    const col = available.find((c) => c.id === selected)
    if (col) onAdd(col.name, col.link)
    setOpen(false)
    setSelected(undefined)
  }

  if (!open) {
    return (
      <Button
        type="dashed"
        size="small"
        icon={<Plus size={14} />}
        style={{ marginTop: 8, borderRadius: 6 }}
        onClick={() => setOpen(true)}
      >
        添加集合页
      </Button>
    )
  }

  return (
    <div ref={containerRef} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
      <Select
        autoFocus
        showSearch
        open
        size="small"
        placeholder="搜索集合页..."
        value={selected}
        onChange={setSelected}
        style={{ width: 160, fontSize: 12 }}
        optionFilterProp="label"
        options={available.map((c) => ({
          value: c.id,
          label: c.postsTotal != null ? `${c.name}（${c.postsTotal}）` : c.name,
        }))}
        popupMatchSelectWidth={160}
      />
      <Button
        type="primary"
        size="small"
        disabled={!selected}
        style={{ padding: '0 10px', fontSize: 12, height: 24, borderRadius: 4 }}
        onClick={handleConfirm}
      >
        确认
      </Button>
      <Button
        size="small"
        style={{ padding: '0 10px', fontSize: 12, height: 24, borderRadius: 4 }}
        onClick={() => { setOpen(false); setSelected(undefined) }}
      >
        取消
      </Button>
    </div>
  )
}

const THUMB_DEFAULT = 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=240&fit=crop&sat=-100'

// ─────────────────────────────────────────────
// ThumbnailCell — 缩略图编辑单元
// 支持：粘贴链接 / 本地上传 / 拖拽裁切
// ─────────────────────────────────────────────
function ThumbnailCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hover, setHover] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [uploadSrc, setUploadSrc] = useState('')
  const [showCropper, setShowCropper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setUploadSrc(url)
    setShowCropper(true)
    e.target.value = ''
  }

  const handleCropConfirm = (dataUrl: string) => {
    onChange(dataUrl)
    setShowCropper(false)
    setUploadSrc('')
    setPanelOpen(false)
  }

  return (
    <>
      {showCropper && uploadSrc && (
        <ImageCropModal
          src={uploadSrc}
          aspectRatio={3 / 2}
          onConfirm={handleCropConfirm}
          onCancel={() => { setShowCropper(false); setUploadSrc('') }}
        />
      )}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 缩略图预览（无封面时用缺省图） */}
        <div
          style={{
            position: 'relative', width: 96, height: 64, borderRadius: 4, overflow: 'hidden',
            background: '#374151',
            backgroundImage: `url(${value || THUMB_DEFAULT})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            flexShrink: 0, cursor: 'pointer',
            border: panelOpen ? '2px solid #1677FF' : '2px solid transparent',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => setPanelOpen((v) => !v)}
        >
          {/* 无自定义封面时显示"缺省图"标记 */}
          {!value && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', padding: '2px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>默认封面</span>
            </div>
          )}
          {(hover || panelOpen) && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>更换封面</span>
            </div>
          )}
        </div>

        {/* 编辑面板 */}
        {panelOpen && (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6,
            padding: '8px', display: 'flex', flexDirection: 'column', gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
            width: 160, position: 'absolute',
          }}>
            {/* 上传并裁切 */}
            <Button
              size="small"
              icon={<Plus size={11} />}
              style={{ fontSize: 11, height: 26 }}
              onClick={() => fileInputRef.current?.click()}
            >
              上传图片（可裁切）
            </Button>

            <Button
              size="small" type="text"
              style={{ fontSize: 11, height: 22, color: '#9CA3AF' }}
              onClick={() => setPanelOpen(false)}
            >
              取消
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Collection Grid Editor (Form 2)
// 紧凑行列表：小缩略图 · 名称 · 链接 · 操作
// ─────────────────────────────────────────────
function CollectionGridEditor({
  mod,
  onChange,
  onEditCollection,
  available,
}: {
  mod: CollectionGridModule
  onChange: (m: CollectionGridModule) => void
  onEditCollection: (col: CollectionEntry) => void
  available: AvailableCollection[]
}) {
  const updateCollection = (id: string, patch: Partial<CollectionEntry>) => {
    onChange({ ...mod, collections: mod.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* 表头 */}
      <div style={{ display: 'grid', gridTemplateColumns: '96px 0.7fr 1fr 90px 90px 64px 64px', gap: 8, padding: '4px 8px 8px', borderBottom: '1px solid #E5E7EB' }}>
        {['封面', '集合页名称', '链接', '修改时间', '操作人', '文章数', ''].map((h) => (
          <span key={h} style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
        ))}
      </div>

      {/* 数据行 */}
      {mod.collections.map((col) => (
        <div
          key={col.id}
          style={{ display: 'grid', gridTemplateColumns: '96px 0.7fr 1fr 90px 90px 64px 64px', gap: 8, alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid #F3F4F6' }}
        >
          {/* 缩略图 */}
          <div style={{ position: 'relative' }}>
            <ThumbnailCell
              value={col.coverUrl || ''}
              onChange={(v) => updateCollection(col.id, { coverUrl: v })}
            />
          </div>

          {/* 名称列：替换图标在左 + 名称/选择器 */}
          <CollectionReplacer
            currentName={col.name}
            available={available}
            onReplace={(name, link) => updateCollection(col.id, { name, link })}
          />

          {/* 链接（只读） */}
          <LinkDisplay value={col.link} />

          {/* 修改时间 */}
          <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{col.addedAt ?? '—'}</span>

          {/* 操作人 */}
          <span style={{ fontSize: 11, color: '#6B7280' }}>{col.operator ?? '—'}</span>

          {/* 文章数 */}
          <span style={{ fontSize: 12, color: '#6B7280' }}>{col.articlesCount} 篇</span>

          {/* 操作 */}
          <Space size={2}>
            <Tooltip title="管理集合页">
              <Button type="text" size="small" icon={<ExternalLink size={13} color="#4F46E5" />} onClick={() => onEditCollection(col)} style={{ padding: '0 4px' }} />
            </Tooltip>
            <Popconfirm
              title={`确认移除「${col.name}」？`}
              onConfirm={() => onChange({ ...mod, collections: mod.collections.filter((c) => c.id !== col.id) })}
              okText="移除" cancelText="取消" okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<Trash2 size={13} color="#EF4444" />} style={{ padding: '0 4px' }} />
            </Popconfirm>
          </Space>
        </div>
      ))}

      {/* 添加 */}
      <AddCollectionRow
        available={available}
        onAdd={(name, link) => {
          const newCol: CollectionEntry = {
            id: `cg-${Date.now()}`, name, link, coverUrl: '', articlesCount: 0, viewsCount: 0,
            addedAt: new Date().toISOString().slice(0, 10),
            operator: 'Admin',
          }
          onChange({ ...mod, collections: [...mod.collections, newCol] })
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Post Grid Editor
// ─────────────────────────────────────────────
function PostGridEditor({ mod, onChange }: { mod: PostGridModule; onChange: (m: PostGridModule) => void }) {
  const layoutOptions: { value: PostGridLayout; label: string }[] = [
    { value: '2-per-row', label: '每行 2 列' },
    { value: '3-per-row', label: '每行 3 列' },
    { value: '6-per-row', label: '每行 6 列' },
  ]
  const cols = mod.layout === '6-per-row' ? 6 : mod.layout === '3-per-row' ? 3 : 2
  const previewCols = Math.min(cols, 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>布局</span>
        <Segmented
          size="small"
          value={mod.layout}
          onChange={(val) => onChange({ ...mod, layout: val as PostGridLayout })}
          options={layoutOptions}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${previewCols}, 1fr)`, gap: 8 }}>
        {mod.posts.map((post) => (
          <div key={post.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <div
              style={{
                aspectRatio: cols >= 6 ? '1' : '16/10',
                background: post.thumbnailUrl ? '#374151' : '#F3F4F6',
                backgroundImage: post.thumbnailUrl ? `url(${post.thumbnailUrl})` : 'none',
                backgroundSize: 'cover',
              }}
            />
            <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.title}
            </div>
            <Button
              type="text"
              size="small"
              icon={<X size={11} color="#fff" />}
              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 18, height: 18, padding: 0, minWidth: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onChange({ ...mod, posts: mod.posts.filter((p) => p.id !== post.id) })}
            />
          </div>
        ))}
      </div>
      <Button
        type="dashed"
        size="small"
        icon={<Plus size={14} />}
        style={{ borderRadius: 6 }}
        onClick={() => {
          const newPost: PostEntry = { id: `pg-${Date.now()}`, title: '新帖子', thumbnailUrl: '', link: '' }
          onChange({ ...mod, posts: [...mod.posts, newPost] })
        }}
      >
        添加帖子
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Preview components
// ─────────────────────────────────────────────
function PreviewCollectionList({ mod }: { mod: CollectionListModule }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{mod.title || '未命名'}</div>
      {mod.collections.slice(0, 5).map((col) => (
        <div key={col.id} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: 10, background: '#1F2937', borderRadius: 8, alignItems: 'center' }}>
          <div style={{ width: 80, height: 48, borderRadius: 6, background: '#374151', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>{col.name}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{col.articlesCount} articles · {formatViews(col.viewsCount)} views</div>
          </div>
          <ChevronRight size={14} color="#6B7280" />
        </div>
      ))}
    </div>
  )
}

function PreviewCollectionGrid({ mod }: { mod: CollectionGridModule }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{mod.title || '未命名'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {mod.collections.slice(0, 9).map((c) => (
          <div key={c.id} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', aspectRatio: '16/10' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#374151', backgroundImage: c.coverUrl ? `url(${c.coverUrl})` : 'none', backgroundSize: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.7))' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: '#D1D5DB' }}>{c.articlesCount} articles · {formatViews(c.viewsCount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewPostGrid({ mod }: { mod: PostGridModule }) {
  const cols = mod.layout === '3-per-row' ? 3 : mod.layout === '6-per-row' ? 3 : 2
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{mod.title || '未命名'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {mod.posts.slice(0, cols * 2).map((post) => (
          <div key={post.id} style={{ borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ aspectRatio: mod.layout === '6-per-row' ? '1' : '16/10', background: '#374151', backgroundImage: post.thumbnailUrl ? `url(${post.thumbnailUrl})` : 'none', backgroundSize: 'cover' }} />
            <div style={{ padding: '6px 0', fontSize: 11, color: '#D1D5DB', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TabEditPageClient({ tabId }: { tabId: string }) {
  const router = useRouter()

  const { pages: collectionPages } = useCollectionPages()
  // 当前可选集合页列表（供替换下拉使用）
  const availableCollections: AvailableCollection[] = collectionPages
    .filter((p) => !p.hidden)
    .map((p) => ({
      id: p.id,
      name: p.name,
      link: primaryCollectionLink(p),
      postsTotal: totalArticlesCount(p),
    }))

  const tabInfo = initialTabRoutes.find((t) => t.id === tabId)
  const bundle = useMemo(() => buildModulesState(tabInfo, tabId, guidesModules), [tabInfo, tabId])

  const [modulesByKey, setModulesByKey] = useState<Record<string, ContentModule[]>>(() => bundle.map)
  const [activeSubTabId, setActiveSubTabId] = useState<string | null>(() => bundle.firstSubId)

  const hasSecondary = !!(tabInfo && tabRouteHasSecondaryTabs(tabInfo))
  const sortedSubTabs = tabInfo?.subTabs ? [...tabInfo.subTabs].sort((a, b) => a.sortOrder - b.sortOrder) : []
  const effectiveSubId = hasSecondary ? (activeSubTabId ?? sortedSubTabs[0]?.id ?? null) : null

  const activeSubTab = effectiveSubId ? sortedSubTabs.find((s) => s.id === effectiveSubId) : undefined
  const moduleKey = hasSecondary && effectiveSubId ? effectiveSubId : MODULE_STATE_PRIMARY
  const moduleKeyRef = useRef(moduleKey)
  moduleKeyRef.current = moduleKey

  const modules = modulesByKey[moduleKey] ?? []

  const setModules = useCallback((action: React.SetStateAction<ContentModule[]>) => {
    setModulesByKey((prev) => {
      const key = moduleKeyRef.current
      const cur = prev[key] ?? []
      const next = typeof action === 'function' ? (action as (c: ContentModule[]) => ContentModule[])(cur) : action
      return { ...prev, [key]: next }
    })
  }, [])

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor')
  /** 仅由视图模式控制「添加模块」显隐（已取消手动保存与 isDirty） */
  const editorToolbarVisible = viewMode === 'editor'
  const [messageApi, contextHolder] = message.useMessage()

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)

  const leaveGuard = useLeaveGuard()
  /** 模块增改即时生效，无需「保存」；离开本页时不应再提示未保存 */
  useEffect(() => {
    if (!leaveGuard) return
    leaveGuard.setGuard(() => false, () => {})
    return () => leaveGuard.clearGuard()
  }, [leaveGuard])

  const toggleCollapse = useCallback((modId: string) => {
    setModules((prev) => prev.map((m) => m.id === modId ? { ...m, collapsed: !m.collapsed } : m))
  }, [])

  const updateModule = useCallback((updated: ContentModule) => {
    setModules((prev) => prev.map((m) => m.id === updated.id ? updated : m))
  }, [])

  const deleteModule = useCallback((modId: string) => {
    setModules((prev) => prev.filter((m) => m.id !== modId))
    messageApi.success('模块已删除')
  }, [messageApi])

  const moveModule = useCallback((id: string, dir: 'up' | 'down') => {
    setModules((prev) => {
      const items = [...prev]
      const idx = items.findIndex((m) => m.id === id)
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= items.length) return prev
      ;[items[idx], items[target]] = [items[target], items[idx]]
      return items.map((m, i) => ({ ...m, sortOrder: i + 1 }))
    })
  }, [])

  const addModule = useCallback((type: ContentModule['type']) => {
    const id = `mod-${Date.now()}`
    const base = { id, sortOrder: modules.length + 1, collapsed: false }
    let newMod: ContentModule
    if (type === 'collection-list') {
      newMod = { ...base, type, title: '', collections: [] }
    } else if (type === 'collection-grid') {
      newMod = { ...base, type, title: '', collections: [] }
    } else {
      newMod = { ...base, type, title: '', layout: '2-per-row', posts: [] }
    }
    setModules((prev) => [...prev, newMod])
    setAddModalOpen(false)
    messageApi.success('模块已添加')
  }, [modules.length, messageApi])

  const handleEditCollection = useCallback((col: CollectionEntry) => {
    const matched = collectionPages.find((p) => collectionPageMatchesPublicLink(p, col.link))
    if (!matched) {
      messageApi.warning(`未找到对应的集合页（${col.link}），请先在集合页管理中创建`)
      return
    }
    const go = () => router.push(`/collection-pages/${matched.id}`)
    leaveGuard?.checkBeforeLeave(go) ?? go()
  }, [collectionPages, router, messageApi, leaveGuard])

  const getTypeIcon = (type: ContentModule['type']) => {
    if (type === 'collection-list') return <List size={14} />
    if (type === 'collection-grid') return <Grid2x2 size={14} />
    return <LayoutGrid size={14} />
  }

  const previewModule = selectedPreview ? modules.find((m) => m.id === selectedPreview) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {contextHolder}

      <ForumSelectRequired>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PageBreadcrumb
            items={[
              { label: '论坛管理', href: '/forum/list' },
              { label: '分区管理', href: '/tab-route' },
              { label: tabInfo ? tabPrimaryDisplayName(tabInfo) : '编辑' },
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{tabInfo ? tabPrimaryDisplayName(tabInfo) : 'Tab'}</h1>
            {tabInfo && !tabInfo.isFixed && !tabRouteHasSecondaryTabs(tabInfo) ? (
              <Space size={8} align="center" wrap>
                <Tag color="processing" style={{ margin: 0, fontSize: 12, borderRadius: 6 }}>
                  分区类型：{TAB_PARTITION_LAYOUT_CONFIG[tabInfo.layoutType ?? 'feeds'].label}
                </Tag>
              </Space>
            ) : null}
          </div>
        </div>
        <Space size={8}>
          <Segmented
            size="small"
            value={viewMode}
            onChange={(v) => setViewMode(v as 'editor' | 'preview')}
            options={[{ value: 'editor', label: '编辑' }, { value: 'preview', label: '预览' }]}
          />
          {editorToolbarVisible ? (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              size="small"
              onClick={() => setAddModalOpen(true)}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              添加模块
            </Button>
          ) : null}
        </Space>
      </div>

      {hasSecondary && sortedSubTabs.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Segmented
            value={effectiveSubId ?? undefined}
            onChange={(v) => setActiveSubTabId(String(v))}
            options={sortedSubTabs.map((st) => ({ label: subTabPrimaryDisplayName(st), value: st.id }))}
          />
        </div>
      )}

      {/* Body */}
      {viewMode === 'editor' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modules.map((mod, modIndex) => {
            const cfg = MODULE_TYPE_CONFIG[mod.type]
            const isCollapsed = mod.collapsed
            const isFirst = modIndex === 0
            const isLast = modIndex === modules.length - 1
            return (
              <div
                key={mod.id}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  border: selectedPreview === mod.id ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Module Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: selectedPreview === mod.id ? '#EEF2FF' : '#FAFAFA',
                    borderBottom: isCollapsed ? 'none' : '1px solid #F3F4F6',
                  }}
                >
                  {/* 上下移动箭头 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
                    <Button
                      type="text" size="small"
                      icon={<ChevronUp size={12} color={isFirst ? '#D1D5DB' : '#6B7280'} />}
                      disabled={isFirst}
                      style={{ padding: '0 2px', height: 16, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => moveModule(mod.id, 'up')}
                    />
                    <Button
                      type="text" size="small"
                      icon={<ChevronDown size={12} color={isLast ? '#D1D5DB' : '#6B7280'} />}
                      disabled={isLast}
                      style={{ padding: '0 2px', height: 16, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => moveModule(mod.id, 'down')}
                    />
                  </div>
                  <Tag style={{ background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {cfg.label}
                  </Tag>
                  {mod.type === 'collection-list' ? (
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {mod.collections.length === 1 ? mod.collections[0].name : '请选择集合页'}
                    </span>
                  ) : (
                    <>
                      {editingTitleId === mod.id ? (
                        <Input
                          size="small"
                          value={mod.title}
                          placeholder="名称（选填）"
                          autoFocus
                          variant="borderless"
                          style={{ fontWeight: 600, fontSize: 14, color: '#111827', flex: 1, padding: '0 4px' }}
                          onChange={(e) => updateModule({ ...mod, title: e.target.value })}
                          onBlur={() => setEditingTitleId(null)}
                          onPressEnter={() => setEditingTitleId(null)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, cursor: 'text', padding: '0 4px', minWidth: 0 }}
                          onClick={(e) => { e.stopPropagation(); setEditingTitleId(mod.id) }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: mod.title ? '#111827' : '#9CA3AF' }}>
                            {mod.title || '名称（选填）'}
                          </span>
                          <Pencil size={11} color="#C0C8D0" style={{ flexShrink: 0 }} />
                        </div>
                      )}
                    </>
                  )}
                  <Space size={4}>
                    <Tooltip title="预览">
                      <Button
                        type="text"
                        size="small"
                        icon={<Eye size={14} color={selectedPreview === mod.id ? '#4F46E5' : '#9CA3AF'} />}
                        onClick={() => setSelectedPreview(selectedPreview === mod.id ? null : mod.id)}
                      />
                    </Tooltip>
                    <Popconfirm title="确认删除该模块？" onConfirm={() => deleteModule(mod.id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
                      <Button type="text" size="small" icon={<Trash2 size={14} color="#EF4444" />} />
                    </Popconfirm>
                    <Button
                      type="text"
                      size="small"
                      icon={isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      onClick={() => toggleCollapse(mod.id)}
                    />
                  </Space>
                </div>

                {/* Preview panel (inline, collapsible) */}
                {!isCollapsed && selectedPreview === mod.id && (
                  <div style={{ background: '#111827', padding: '12px 14px', borderBottom: '1px solid #1F2937' }}>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em' }}>PREVIEW</div>
                    {mod.type === 'collection-list' && <PreviewCollectionList mod={mod} />}
                    {mod.type === 'collection-grid' && <PreviewCollectionGrid mod={mod} />}
                    {mod.type === 'post-grid' && <PreviewPostGrid mod={mod} />}
                  </div>
                )}

                {/* Module Body */}
                {!isCollapsed && (
                  <div style={{ padding: '12px 14px' }}>
                    {mod.type === 'collection-list' && (
                      <CollectionListEditor mod={mod} onChange={(m) => updateModule(m)} onEditCollection={handleEditCollection} available={availableCollections} />
                    )}
                    {mod.type === 'collection-grid' && (
                      <CollectionGridEditor mod={mod} onChange={(m) => updateModule(m)} onEditCollection={handleEditCollection} available={availableCollections} />
                    )}
                    {mod.type === 'post-grid' && (
                      <PostGridEditor mod={mod} onChange={(m) => updateModule(m)} />
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {modules.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <LayoutGrid size={40} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>暂无模块</div>
              <div style={{ fontSize: 13 }}>
                {hasSecondary && activeSubTab
                  ? `「${subTabPrimaryDisplayName(activeSubTab)}」下暂无模块，点击「添加模块」开始配置`
                  : '点击「添加模块」开始配置'}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#111827', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>实时预览</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['#EF4444', '#F59E0B', '#10B981'].map((c) => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              ))}
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {previewModule ? (
              <>
                {previewModule.type === 'collection-list' && <PreviewCollectionList mod={previewModule} />}
                {previewModule.type === 'collection-grid' && <PreviewCollectionGrid mod={previewModule} />}
                {previewModule.type === 'post-grid' && <PreviewPostGrid mod={previewModule} />}
              </>
            ) : (
              modules.map((mod) => (
                <div key={mod.id}>
                  {mod.type === 'collection-list' && <PreviewCollectionList mod={mod} />}
                  {mod.type === 'collection-grid' && <PreviewCollectionGrid mod={mod} />}
                  {mod.type === 'post-grid' && <PreviewPostGrid mod={mod} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      <Modal title="添加模块" open={addModalOpen} onCancel={() => setAddModalOpen(false)} footer={null} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {(Object.entries(MODULE_TYPE_CONFIG) as [ContentModule['type'], typeof MODULE_TYPE_CONFIG[ContentModule['type']]][]).map(([type, cfg]) => (
            <div
              key={type}
              onClick={() => addModule(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = cfg.color
                ;(e.currentTarget as HTMLDivElement).style.background = cfg.bg
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'
                ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getTypeIcon(type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{cfg.label}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{cfg.description}</div>
              </div>
              <Plus size={18} color="#9CA3AF" />
            </div>
          ))}
        </div>
      </Modal>
      </ForumSelectRequired>
    </div>
  )
}
