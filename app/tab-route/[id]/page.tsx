'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Button,
  Tag,
  Space,
  Modal,
  Input,
  message,
  Breadcrumb,
  Tooltip,
  Popconfirm,
  Segmented,
} from 'antd'
import {
  ArrowLeft,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Home,
  List,
  Grid2x2,
  LayoutGrid,
  Eye,
  Pencil,
  Link as LinkIcon,
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
} from '../../types'
import { initialTabRoutes, guidesModules } from '../../data/mockData'

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─────────────────────────────────────────────
// Collection List Editor (Form 1)
// Name · Link · Articles count — no thumbnail editing
// ─────────────────────────────────────────────
function CollectionListEditor({
  mod,
  onChange,
  onEditCollection,
}: {
  mod: CollectionListModule
  onChange: (m: CollectionListModule) => void
  onEditCollection: (col: CollectionEntry) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const updateCollection = (id: string, patch: Partial<CollectionEntry>) => {
    onChange({
      ...mod,
      collections: mod.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 160px 80px 80px',
          gap: 8,
          padding: '4px 8px 8px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {['COLLECTION NAME', 'LINK', 'ARTICLES', ''].map((h) => (
          <span key={h} style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
        ))}
      </div>

      {mod.collections.map((col) => (
        <div
          key={col.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px 80px 80px',
            gap: 8,
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid #F9FAFB',
            background: editingId === col.id ? '#F9FAFB' : 'transparent',
            borderRadius: 6,
          }}
        >
          {/* Name */}
          {editingId === col.id ? (
            <Input
              size="small"
              value={col.name}
              autoFocus
              style={{ borderRadius: 6 }}
              onChange={(e) => updateCollection(col.id, { name: e.target.value })}
              onBlur={() => setEditingId(null)}
              onPressEnter={() => setEditingId(null)}
            />
          ) : (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => setEditingId(col.id)}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{col.name}</span>
              <Pencil size={11} color="#D1D5DB" />
            </div>
          )}

          {/* Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <LinkIcon size={11} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <Input
              size="small"
              value={col.link}
              placeholder="/collections/..."
              style={{ borderRadius: 4, fontSize: 11 }}
              onChange={(e) => updateCollection(col.id, { link: e.target.value })}
            />
          </div>

          {/* Articles count */}
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {col.articlesCount} articles
          </span>

          {/* Actions */}
          <Space size={2}>
            <Tooltip title="Manage articles (Level 3)">
              <Button
                type="text"
                size="small"
                icon={<ExternalLink size={13} color="#4F46E5" />}
                onClick={() => onEditCollection(col)}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
            <Popconfirm
              title={`Remove "${col.name}" from this module?`}
              onConfirm={() =>
                onChange({ ...mod, collections: mod.collections.filter((c) => c.id !== col.id) })
              }
              okText="Remove"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<Trash2 size={13} color="#EF4444" />} style={{ padding: '0 4px' }} />
            </Popconfirm>
          </Space>
        </div>
      ))}

      <Button
        type="dashed"
        size="small"
        icon={<Plus size={14} />}
        style={{ marginTop: 8, borderRadius: 6 }}
        onClick={() => {
          const newCol: CollectionEntry = {
            id: `cl-${Date.now()}`,
            name: 'New Collection',
            link: '',
            articlesCount: 0,
            viewsCount: 0,
          }
          onChange({ ...mod, collections: [...mod.collections, newCol] })
          setEditingId(newCol.id)
        }}
      >
        Add Collection
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Collection Grid Editor (Form 2)
// Name · Link · Thumbnail (editable) — grid view
// ─────────────────────────────────────────────
function CollectionGridEditor({
  mod,
  onChange,
  onEditCollection,
}: {
  mod: CollectionGridModule
  onChange: (m: CollectionGridModule) => void
  onEditCollection: (col: CollectionEntry) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const updateCollection = (id: string, patch: Partial<CollectionEntry>) => {
    onChange({
      ...mod,
      collections: mod.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, alignItems: 'start' }}>
        {mod.collections.map((col) => (
          <div
            key={col.id}
            style={{
              border: editingId === col.id ? '2px solid #4F46E5' : '1px solid #E5E7EB',
              borderRadius: 8,
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '16/9',
                background: col.coverUrl ? '#374151' : '#F3F4F6',
                backgroundImage: col.coverUrl ? `url(${col.coverUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setEditingId(editingId === col.id ? null : col.id)}
            >
              {!col.coverUrl && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ImageIcon size={20} color="#D1D5DB" />
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>No cover</span>
                </div>
              )}
              {/* Edit cover overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
              >
                <Button
                  size="small"
                  icon={<ImageIcon size={12} />}
                  style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 6, border: 'none', fontSize: 11 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    const url = window.prompt('Enter cover image URL:', col.coverUrl || '')
                    if (url !== null) updateCollection(col.id, { coverUrl: url })
                  }}
                >
                  Change Cover
                </Button>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {editingId === col.id ? (
                <Input
                  size="small"
                  value={col.name}
                  autoFocus
                  style={{ borderRadius: 4, fontWeight: 600 }}
                  onChange={(e) => updateCollection(col.id, { name: e.target.value })}
                  onBlur={() => setEditingId(null)}
                  onPressEnter={() => setEditingId(null)}
                />
              ) : (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  onClick={() => setEditingId(col.id)}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1 }}>{col.name}</span>
                  <Pencil size={10} color="#D1D5DB" />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <LinkIcon size={9} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <Input
                  size="small"
                  value={col.link}
                  placeholder="/collections/..."
                  style={{ borderRadius: 4, fontSize: 10, padding: '0 4px', height: 20 }}
                  onChange={(e) => updateCollection(col.id, { link: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                  {col.articlesCount} articles · {formatViews(col.viewsCount)} views
                </span>
                <Space size={0}>
                  <Tooltip title="Manage articles">
                    <Button
                      type="text"
                      size="small"
                      icon={<ExternalLink size={11} color="#4F46E5" />}
                      onClick={() => onEditCollection(col)}
                      style={{ padding: '0 3px', height: 20 }}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={`Remove "${col.name}"?`}
                    onConfirm={() =>
                      onChange({ ...mod, collections: mod.collections.filter((c) => c.id !== col.id) })
                    }
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" size="small" icon={<Trash2 size={11} color="#EF4444" />} style={{ padding: '0 3px', height: 20 }} />
                  </Popconfirm>
                </Space>
              </div>
            </div>
          </div>
        ))}

        {/* Add button as a grid cell */}
        <div
          onClick={() => {
            const newCol: CollectionEntry = {
              id: `cg-${Date.now()}`,
              name: 'New Collection',
              link: '',
              coverUrl: '',
              articlesCount: 0,
              viewsCount: 0,
            }
            onChange({ ...mod, collections: [...mod.collections, newCol] })
            setEditingId(newCol.id)
          }}
          style={{
            border: '2px dashed #E5E7EB',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            aspectRatio: '1/1',
            cursor: 'pointer',
            color: '#9CA3AF',
            fontSize: 12,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#4F46E5'
            ;(e.currentTarget as HTMLDivElement).style.color = '#4F46E5'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'
            ;(e.currentTarget as HTMLDivElement).style.color = '#9CA3AF'
          }}
        >
          <Plus size={20} />
          <span>Add Collection</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Post Grid Editor
// ─────────────────────────────────────────────
function PostGridEditor({ mod, onChange }: { mod: PostGridModule; onChange: (m: PostGridModule) => void }) {
  const layoutOptions: { value: PostGridLayout; label: string }[] = [
    { value: '2-per-row', label: '2 per row' },
    { value: '3-per-row', label: '3 per row' },
    { value: '6-per-row', label: '6 per row' },
  ]
  const cols = mod.layout === '6-per-row' ? 6 : mod.layout === '3-per-row' ? 3 : 2
  const previewCols = Math.min(cols, 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>LAYOUT</span>
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
          const newPost: PostEntry = { id: `pg-${Date.now()}`, title: 'New Post', thumbnailUrl: '', link: '' }
          onChange({ ...mod, posts: [...mod.posts, newPost] })
        }}
      >
        Add Post
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
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{mod.title}</div>
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
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{mod.title}</div>
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
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{mod.title}</div>
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
export default function TabEditPage() {
  const router = useRouter()
  const params = useParams()
  const tabId = params.id as string

  const tabInfo = initialTabRoutes.find((t) => t.id === tabId)
  const [modules, setModules] = useState<ContentModule[]>(tabId === '2' ? guidesModules : [])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor')
  const [messageApi, contextHolder] = message.useMessage()

  const dragItemId = useRef<string | null>(null)
  const dragOverId = useRef<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const toggleCollapse = useCallback((modId: string) => {
    setModules((prev) => prev.map((m) => m.id === modId ? { ...m, collapsed: !m.collapsed } : m))
  }, [])

  const updateModule = useCallback((updated: ContentModule) => {
    setModules((prev) => prev.map((m) => m.id === updated.id ? updated : m))
  }, [])

  const deleteModule = useCallback((modId: string) => {
    setModules((prev) => prev.filter((m) => m.id !== modId))
    messageApi.success('Module deleted')
  }, [messageApi])

  const handleDragStart = useCallback((id: string) => { dragItemId.current = id; setDraggingId(id) }, [])
  const handleDragOver = useCallback((e: React.DragEvent, id: string) => { e.preventDefault(); dragOverId.current = id }, [])
  const handleDragEnd = useCallback(() => {
    const fromId = dragItemId.current
    const toId = dragOverId.current
    setDraggingId(null)
    if (!fromId || !toId || fromId === toId) return
    setModules((prev) => {
      const items = [...prev]
      const fromIdx = items.findIndex((m) => m.id === fromId)
      const toIdx = items.findIndex((m) => m.id === toId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = items.splice(fromIdx, 1)
      items.splice(toIdx, 0, moved)
      return items.map((m, i) => ({ ...m, sortOrder: i + 1 }))
    })
    dragItemId.current = null
    dragOverId.current = null
  }, [])

  const addModule = useCallback((type: ContentModule['type']) => {
    const id = `mod-${Date.now()}`
    const base = { id, sortOrder: modules.length + 1, collapsed: false }
    let newMod: ContentModule
    if (type === 'collection-list') {
      newMod = { ...base, type, title: 'New Collection List', collections: [] }
    } else if (type === 'collection-grid') {
      newMod = { ...base, type, title: 'New Collection Grid', collections: [] }
    } else {
      newMod = { ...base, type, title: 'New Post Grid', layout: '2-per-row', posts: [] }
    }
    setModules((prev) => [...prev, newMod])
    setAddModalOpen(false)
    messageApi.success('Module added')
  }, [modules.length, messageApi])

  const handleEditCollection = useCallback((col: CollectionEntry) => {
    messageApi.info(`→ Level 3: Manage articles in "${col.name}" (coming soon)`)
  }, [messageApi])

  const getTypeIcon = (type: ContentModule['type']) => {
    if (type === 'collection-list') return <List size={14} />
    if (type === 'collection-grid') return <Grid2x2 size={14} />
    return <LayoutGrid size={14} />
  }

  const previewModule = selectedPreview ? modules.find((m) => m.id === selectedPreview) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {contextHolder}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Breadcrumb items={[
            { title: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Home size={14} /> Home</span> },
            { title: <a onClick={() => router.push('/tab-route')}>Tab Route</a> },
            { title: tabInfo?.name || 'Edit' },
          ]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => router.push('/tab-route')} style={{ padding: '4px 8px' }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{tabInfo?.name || 'Tab'}</h1>
            {tabInfo && (
              <Tag style={{ background: MODULE_TYPE_CONFIG['collection-grid'].bg, color: MODULE_TYPE_CONFIG['collection-grid'].color, border: 'none', borderRadius: 6, fontSize: 11 }}>
                {tabInfo.type}
              </Tag>
            )}
          </div>
        </div>
        <Space size={8}>
          <Segmented
            size="small"
            value={viewMode}
            onChange={(v) => setViewMode(v as 'editor' | 'preview')}
            options={[{ value: 'editor', label: 'Editor' }, { value: 'preview', label: 'Preview' }]}
          />
          {viewMode === 'editor' && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              size="small"
              onClick={() => setAddModalOpen(true)}
              style={{ background: '#4F46E5', borderRadius: 6, fontWeight: 500 }}
            >
              Add Module
            </Button>
          )}
        </Space>
      </div>

      {/* Body */}
      {viewMode === 'editor' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modules.map((mod) => {
            const cfg = MODULE_TYPE_CONFIG[mod.type]
            const isCollapsed = mod.collapsed
            return (
              <div
                key={mod.id}
                draggable
                onDragStart={() => handleDragStart(mod.id)}
                onDragOver={(e) => handleDragOver(e, mod.id)}
                onDragEnd={handleDragEnd}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  border: selectedPreview === mod.id ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                  overflow: 'hidden',
                  opacity: draggingId === mod.id ? 0.4 : 1,
                  transition: 'opacity 0.15s, border-color 0.15s',
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
                    cursor: 'grab',
                    borderBottom: isCollapsed ? 'none' : '1px solid #F3F4F6',
                  }}
                >
                  <GripVertical size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                  <Tag style={{ background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {cfg.label}
                  </Tag>
                  <Input
                    size="small"
                    value={mod.title}
                    variant="borderless"
                    style={{ fontWeight: 600, fontSize: 14, color: '#111827', flex: 1, padding: '0 4px' }}
                    onChange={(e) => updateModule({ ...mod, title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Space size={4}>
                    <Tooltip title="Preview">
                      <Button
                        type="text"
                        size="small"
                        icon={<Eye size={14} color={selectedPreview === mod.id ? '#4F46E5' : '#9CA3AF'} />}
                        onClick={() => setSelectedPreview(selectedPreview === mod.id ? null : mod.id)}
                      />
                    </Tooltip>
                    <Popconfirm title="Delete this module?" onConfirm={() => deleteModule(mod.id)} okText="Delete" okButtonProps={{ danger: true }}>
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
                      <CollectionListEditor mod={mod} onChange={(m) => updateModule(m)} onEditCollection={handleEditCollection} />
                    )}
                    {mod.type === 'collection-grid' && (
                      <CollectionGridEditor mod={mod} onChange={(m) => updateModule(m)} onEditCollection={handleEditCollection} />
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
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No modules yet</div>
              <div style={{ fontSize: 13 }}>Click &ldquo;Add Module&rdquo; to get started</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#111827', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>LIVE PREVIEW</span>
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
      <Modal title="Add Module" open={addModalOpen} onCancel={() => setAddModalOpen(false)} footer={null} width={520}>
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
    </div>
  )
}
