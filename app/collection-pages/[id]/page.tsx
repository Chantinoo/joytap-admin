'use client'

import React, { useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Breadcrumb, message, Tooltip, Modal, Input, Popconfirm, Space } from 'antd'
import { ArrowLeft, Home, Eye, Calendar, User, Pencil, Plus, Trash2, Link as LinkIcon, RefreshCw, Upload as UploadIcon, X, GripVertical } from 'lucide-react'
import { Article } from '../../types'
import ImageCropModal from '../../components/ImageCropModal'
import { useCollectionPages } from '../../context/CollectionPagesContext'

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=240&fit=crop&sat=-100'

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function CollectionPageDetail() {
  const router = useRouter()
  const params = useParams()
  const pageId = params.id as string
  const { pages, updateArticles } = useCollectionPages()
  const collectionPage = pages.find((p) => p.id === pageId)

  const [articles, setArticles] = useState<Article[]>(collectionPage?.articles ?? [])
  const [messageApi, contextHolder] = message.useMessage()

  // ── 拖拽排序状态 ──
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (index: number) => {
    const from = dragIndexRef.current
    if (from === null || from === index) { setDragOverIndex(null); return }
    const next = [...articles]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    setArticles(next)
    updateArticles(pageId, next)
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  // ── 新增 / 编辑弹窗状态 ──
  const [editModal, setEditModal] = useState<Article | 'new' | null>(null)
  const [draftLink, setDraftLink] = useState('')
  // coverMode: 'auto' | 'upload'
  const [coverMode, setCoverMode] = useState<'auto' | 'upload'>('auto')
  const [draftCoverUrl, setDraftCoverUrl] = useState('')
  // 上传的本地图片（dataURL 或 objectURL）
  const [uploadedSrc, setUploadedSrc] = useState<string>('')
  // 裁切后的最终封面 dataURL
  const [croppedCover, setCroppedCover] = useState<string>('')
  // 是否显示裁切器
  const [showCropper, setShowCropper] = useState(false)
  // 模拟"正在获取首图"
  const [fetching, setFetching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!collectionPage) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>找不到该集合页</div>
  }

  // 当前预览封面
  const previewCover =
    coverMode === 'auto' ? DEFAULT_COVER :
    (croppedCover || uploadedSrc || DEFAULT_COVER)

  const simulateFetch = () => {
    if (!draftLink) { messageApi.warning('请先输入帖子链接'); return }
    setFetching(true)
    setTimeout(() => { setFetching(false); messageApi.success('已自动获取帖子首图') }, 800)
  }

  // ── 文件选择 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { messageApi.error('请选择图片文件'); return }
    const url = URL.createObjectURL(file)
    setUploadedSrc(url)
    setCroppedCover('')
    setShowCropper(true)
    // 清空 input，允许再次选同一文件
    e.target.value = ''
  }

  // ── 裁切确认 ──
  const handleCropConfirm = (dataUrl: string) => {
    setCroppedCover(dataUrl)
    setShowCropper(false)
  }

  // ── 打开弹窗 ──
  const openCreate = () => {
    setDraftLink('')
    setCoverMode('auto')
    setDraftCoverUrl('')
    setUploadedSrc('')
    setCroppedCover('')
    setEditModal('new')
  }

  const openEdit = (article: Article) => {
    setDraftLink(article.link ?? '')
    const hasCustomCover = article.coverUrl && article.coverUrl !== DEFAULT_COVER
    setCoverMode(hasCustomCover ? 'upload' : 'auto')
    setDraftCoverUrl(hasCustomCover ? article.coverUrl : '')
    setUploadedSrc('')
    setCroppedCover('')
    setEditModal(article)
  }

  // ── 保存 ──
  const handleSave = () => {
    if (!draftLink.trim()) { messageApi.warning('请输入帖子链接'); return }
    let finalCover = DEFAULT_COVER
    if (coverMode === 'upload') finalCover = croppedCover || uploadedSrc || DEFAULT_COVER

    if (editModal === 'new') {
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: '新帖子',
        author: '',
        link: draftLink.trim(),
        coverUrl: finalCover,
        viewsCount: 0,
        publishedAt: new Date().toISOString().slice(0, 10),
      }
      const next = [...articles, newArticle]
      setArticles(next)
      updateArticles(pageId, next)
      messageApi.success('帖子已添加')
    } else if (editModal) {
      const next = articles.map((a) =>
        a.id === (editModal as Article).id
          ? { ...a, link: draftLink.trim(), coverUrl: finalCover }
          : a
      )
      setArticles(next)
      updateArticles(pageId, next)
      messageApi.success('帖子已更新')
    }
    setEditModal(null)
  }

  // ── 删除 ──
  const handleDelete = (id: string) => {
    const next = articles.filter((a) => a.id !== id)
    setArticles(next)
    updateArticles(pageId, next)
    messageApi.success('已删除')
  }

  const isNew = editModal === 'new'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      {/* 裁切器覆盖层 */}
      {showCropper && uploadedSrc && (
        <ImageCropModal
          src={uploadedSrc}
          aspectRatio={3 / 2}
          onConfirm={handleCropConfirm}
          onCancel={() => setShowCropper(false)}
        />
      )}

      {/* 隐藏文件选择 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* 页头 */}
      <div style={{ background: '#fff', borderRadius: 6, padding: '14px 20px', border: '1px solid #E5E7EB' }}>
        <Breadcrumb
          style={{ marginBottom: 10 }}
          items={[
            { title: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Home size={13} />首页</span> },
            { title: <a onClick={() => router.push('/collection-pages')}>集合页管理</a> },
            { title: collectionPage.name },
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => router.push('/collection-pages')} style={{ padding: '4px 8px' }} />
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: 0 }}>{collectionPage.name}</h1>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>共 {articles.length} 篇帖子</p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            style={{ borderRadius: 4, height: 32, fontSize: 13, fontWeight: 500 }}
            onClick={openCreate}
          >
            新增帖子
          </Button>
        </div>
      </div>

      {/* 帖子列表 */}
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 14, background: '#1677FF', borderRadius: 2, display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>帖子列表</span>
        </div>

        {articles.map((article, index) => (
          <div
            key={article.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 20px',
              borderBottom: index < articles.length - 1 ? '1px solid #F3F4F6' : 'none',
              transition: 'background 0.15s, box-shadow 0.15s',
              background: dragOverIndex === index ? '#EFF6FF' : 'transparent',
              boxShadow: dragOverIndex === index ? 'inset 0 2px 0 #1677FF' : 'none',
              cursor: 'grab',
            }}
            onMouseEnter={(e) => { if (dragIndexRef.current === null) (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
            onMouseLeave={(e) => { if (dragOverIndex !== index) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            {/* 拖拽把手 */}
            <div style={{ color: '#D1D5DB', flexShrink: 0, cursor: 'grab', display: 'flex', alignItems: 'center' }}>
              <GripVertical size={16} />
            </div>

            {/* 封面图 */}
            <Tooltip title="点击编辑链接与封面">
              <div
                onClick={() => openEdit(article)}
                style={{
                  position: 'relative',
                  width: 120,
                  height: 80,
                  borderRadius: 6,
                  overflow: 'hidden',
                  flexShrink: 0,
                  cursor: 'pointer',
                  background: '#374151',
                  backgroundImage: `url(${article.coverUrl || DEFAULT_COVER})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
                >
                  <Pencil size={14} color="#fff" />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>编辑</span>
                </div>
              </div>
            </Tooltip>

            {/* 帖子信息 */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {article.title}
              </span>
              {article.link && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <LinkIcon size={11} color="#9CA3AF" />
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 12, color: '#1677FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {article.link}
                  </a>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', fontSize: 12 }}>
                  <User size={12} /><span>@{article.author || '未知'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', fontSize: 12 }}>
                  <Eye size={12} /><span>{formatViews(article.viewsCount)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', fontSize: 12 }}>
                  <Calendar size={12} /><span>{article.publishedAt}</span>
                </div>
              </div>
            </div>

            {/* 操作 */}
            <Space size={8} style={{ flexShrink: 0 }}>
              <Button size="small" icon={<Pencil size={13} />} style={{ fontSize: 12 }} onClick={() => openEdit(article)}>
                编辑
              </Button>
              <Popconfirm
                title="确认删除该帖子？"
                onConfirm={() => handleDelete(article.id)}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" icon={<Trash2 size={13} color="#EF4444" />} style={{ fontSize: 12, color: '#EF4444' }} />
              </Popconfirm>
            </Space>
          </div>
        ))}

        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>暂无帖子，点击「新增帖子」添加</div>
        )}
      </div>

      {/* 新增 / 编辑弹窗 */}
      <Modal
        title={isNew ? '新增帖子' : '编辑帖子'}
        open={!!editModal}
        onCancel={() => setEditModal(null)}
        onOk={handleSave}
        okText={isNew ? '添加' : '保存'}
        cancelText="取消"
        width={520}
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>

          {/* 帖子链接 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              帖子链接 <span style={{ color: '#EF4444' }}>*</span>
            </div>
            <Input
              value={draftLink}
              placeholder="请输入帖子链接，例如 /posts/12345"
              prefix={<LinkIcon size={14} color="#9CA3AF" />}
              onChange={(e) => setDraftLink(e.target.value)}
              allowClear
            />
          </div>

          {/* 封面图 */}
          <div>
            {/* 模式切换 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>封面图</div>
              <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                {(['auto', 'upload'] as const).map((mode) => {
                  const labels = { auto: '自动取首图', upload: '本地上传' }
                  const active = coverMode === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => setCoverMode(mode)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        border: 'none',
                        borderRight: mode !== 'upload' ? '1px solid #E5E7EB' : 'none',
                        background: active ? '#1677FF' : '#fff',
                        color: active ? '#fff' : '#6B7280',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {labels[mode]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 封面预览 */}
            <div style={{
              width: '100%',
              height: 180,
              borderRadius: 8,
              background: '#374151',
              backgroundImage: `url(${previewCover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid #E5E7EB',
              marginBottom: 10,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* 自动模式提示条 */}
              {coverMode === 'auto' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '20px 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>自动取帖子首图 · 居中裁切</span>
                  <Button
                    size="small"
                    loading={fetching}
                    icon={!fetching ? <RefreshCw size={11} /> : undefined}
                    style={{ fontSize: 11, height: 22, padding: '0 8px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
                    onClick={simulateFetch}
                  >
                    {fetching ? '获取中...' : '重新获取'}
                  </Button>
                </div>
              )}
              {/* 上传模式：已裁切则显示重新裁切按钮 */}
              {coverMode === 'upload' && croppedCover && (
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <Button
                    size="small"
                    style={{ fontSize: 11, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: 4 }}
                    onClick={() => setShowCropper(true)}
                  >
                    重新裁切
                  </Button>
                  <Button
                    size="small"
                    icon={<X size={11} />}
                    style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: 4 }}
                    onClick={() => { setCroppedCover(''); setUploadedSrc('') }}
                  />
                </div>
              )}
            </div>

            {/* 各模式下方区域 */}
            {coverMode === 'auto' && (
              <div style={{ fontSize: 11, color: '#6B7280', background: '#F0F7FF', padding: '6px 10px', borderRadius: 4, border: '1px solid #BFDBFE' }}>
                系统将自动从帖子内容取第一张图作为封面，居中裁切为 3:2 比例。无图时展示默认占位图。
              </div>
            )}

            {coverMode === 'upload' && (
              <div>
                {!croppedCover && !uploadedSrc ? (
                  /* 上传区域 */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: 8,
                      padding: '20px 0',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1677FF'; (e.currentTarget as HTMLDivElement).style.background = '#F0F7FF' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    <UploadIcon size={24} color="#9CA3AF" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>点击上传图片</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>支持 JPG / PNG / WebP，上传后可裁切</div>
                  </div>
                ) : (
                  /* 已上传状态 */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                    <div style={{
                      width: 48, height: 32, borderRadius: 4, flexShrink: 0,
                      backgroundImage: `url(${croppedCover || uploadedSrc})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                    <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>
                      {croppedCover ? '已裁切封面图' : '未裁切（原图）'}
                    </span>
                    <Button size="small" style={{ fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>
                      重新选择
                    </Button>
                    {uploadedSrc && (
                      <Button size="small" type="primary" style={{ fontSize: 11 }} onClick={() => setShowCropper(true)}>
                        {croppedCover ? '重新裁切' : '裁切图片'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
