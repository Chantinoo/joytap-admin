'use client'

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Button, message, Tooltip, Modal, Input, Popconfirm, Space, Segmented, Alert, Tag } from 'antd'
import { Eye, Calendar, User, Pencil, Plus, Trash2, Link as LinkIcon, RefreshCw, Upload as UploadIcon, X } from 'lucide-react'
import { Article } from '../../types'
import ImageCropModal from '../../components/ImageCropModal'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import ForumSelectRequired from '../../components/ForumSelectRequired'
import { useCollectionPages } from '../../context/CollectionPagesContext'
import {
  getArticlesForLocale,
  selectableLocalesForCollection,
  collectionDisplayNameForLocale,
  isLocaleUnnamedWithPosts,
  localeHasDisplayName,
} from '../../lib/collectionPageLocale'
import { LANGUAGES, type LangCode } from '../../wiki/components/fieldI18nConstants'

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=240&fit=crop&sat=-100'

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function CollectionPageDetailClient({ pageId }: { pageId: string }) {
  const { pages, updateArticles } = useCollectionPages()
  const collectionPage = pages.find((p) => p.id === pageId)

  const selectableLocales = useMemo(
    () => (collectionPage ? selectableLocalesForCollection(collectionPage) : (['zh'] as LangCode[])),
    [collectionPage],
  )

  const [activeLocale, setActiveLocale] = useState<LangCode>('zh')
  const [articles, setArticles] = useState<Article[]>([])
  const savedArticlesRef = useRef<string>('[]')

  const titleForLocale = useMemo(() => {
    if (!collectionPage) return '集合页'
    if (!localeHasDisplayName(collectionPage, activeLocale)) return '未命名'
    return collectionDisplayNameForLocale(collectionPage, activeLocale)
  }, [collectionPage, activeLocale])

  const showUnnamedLocaleHint = useMemo(
    () => (collectionPage ? isLocaleUnnamedWithPosts(collectionPage, activeLocale) : false),
    [collectionPage, activeLocale],
  )

  useEffect(() => {
    if (!collectionPage) return
    const opts = selectableLocalesForCollection(collectionPage)
    const locale = opts.includes(activeLocale) ? activeLocale : opts[0]
    if (locale !== activeLocale) {
      setActiveLocale(locale)
      return
    }
    const next = getArticlesForLocale(collectionPage, locale)
    setArticles(next)
    savedArticlesRef.current = JSON.stringify(next)
  }, [collectionPage, activeLocale])

  const isDirty = JSON.stringify(articles) !== savedArticlesRef.current

  const [messageApi, contextHolder] = message.useMessage()

  /** 帖子增删改后立即写入全局并提示（无需再点「保存」） */
  const commitArticles = useCallback(
    (next: Article[], successMsg: string) => {
      updateArticles(pageId, activeLocale, next)
      savedArticlesRef.current = JSON.stringify(next)
      setArticles(next)
      messageApi.success(successMsg)
    },
    [pageId, activeLocale, updateArticles, messageApi],
  )

  const requestLocaleChange = useCallback(
    (next: LangCode) => {
      if (next === activeLocale) return
      if (isDirty) {
        Modal.confirm({
          title: '未保存的修改',
          content: '切换语种将丢弃当前语种的未保存修改，是否继续？',
          okText: '丢弃并切换',
          cancelText: '取消',
          onOk: () => setActiveLocale(next),
        })
        return
      }
      setActiveLocale(next)
    },
    [activeLocale, isDirty],
  )

  // ── 排序：热门（浏览量降序）/ 最新（发布日期降序） ──
  type SortMode = 'hot' | 'latest'
  const [sortMode, setSortMode] = useState<SortMode>('latest')
  const displayedArticles = useMemo(() => {
    const list = [...articles]
    if (sortMode === 'hot') {
      list.sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0))
    } else {
      list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    }
    return list
  }, [articles, sortMode])

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
      commitArticles([...articles, newArticle], '添加成功')
    } else if (editModal) {
      const next = articles.map((a) =>
        a.id === (editModal as Article).id
          ? { ...a, link: draftLink.trim(), coverUrl: finalCover }
          : a
      )
      commitArticles(next, '保存成功')
    }
    setEditModal(null)
  }

  // ── 删除 ──
  const handleDelete = (id: string) => {
    commitArticles(
      articles.filter((a) => a.id !== id),
      '删除成功',
    )
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

      {/* 面包屑：独立于页头 */}
      <PageBreadcrumb
        items={[
          { label: '论坛管理', href: '/forum/list' },
          { label: '集合页管理', href: '/collection-pages' },
          { label: titleForLocale },
        ]}
      />

      <ForumSelectRequired>
      {!collectionPage ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>找不到该集合页</div>
      ) : (
        <>
      {/* 页头：标题 + 新增帖子 */}
      <div style={{ background: '#fff', borderRadius: 6, padding: '14px 20px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                color: titleForLocale === '未命名' ? '#D97706' : '#1F2937',
              }}
            >
              {titleForLocale}
            </h1>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>
              当前语种 {LANGUAGES.find((l) => l.code === activeLocale)?.label ?? activeLocale} · 共 {articles.length}{' '}
              篇帖子
            </p>
            <div style={{ marginTop: 10 }}>
              <Segmented
                size="small"
                value={activeLocale}
                onChange={(v) => requestLocaleChange(v as LangCode)}
                options={selectableLocales.map((code) => {
                  const langLabel = LANGUAGES.find((l) => l.code === code)?.label ?? code
                  const unnamed =
                    collectionPage &&
                    isLocaleUnnamedWithPosts(collectionPage, code)
                  return {
                    value: code,
                    label: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ opacity: unnamed ? 0.75 : 1 }}>{langLabel}</span>
                        {unnamed ? (
                          <Tag color="warning" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px' }}>
                            未命名
                          </Tag>
                        ) : null}
                      </span>
                    ),
                  }
                })}
              />
            </div>
            {showUnnamedLocaleHint && collectionPage ? (
              <Alert
                type="warning"
                showIcon
                closable
                style={{ marginTop: 12, fontSize: 13 }}
                message="该语种未填写展示名称，前台将不会展示本语种集合页"
              />
            ) : null}
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
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 3, height: 14, background: '#1677FF', borderRadius: 2, display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>帖子列表</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#F3F4F6', borderRadius: 6, padding: 2 }}>
            <button
              type="button"
              onClick={() => setSortMode('hot')}
              style={{
                border: 'none',
                borderRadius: 4,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 500,
                color: sortMode === 'hot' ? '#111827' : '#6B7280',
                background: sortMode === 'hot' ? '#fff' : 'transparent',
                boxShadow: sortMode === 'hot' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
              }}
            >
              热门
            </button>
            <button
              type="button"
              onClick={() => setSortMode('latest')}
              style={{
                border: 'none',
                borderRadius: 4,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 500,
                color: sortMode === 'latest' ? '#111827' : '#6B7280',
                background: sortMode === 'latest' ? '#fff' : 'transparent',
                boxShadow: sortMode === 'latest' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
              }}
            >
              最新
            </button>
          </div>
        </div>

        {displayedArticles.map((article, index) => (
          <div
            key={article.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 20px',
              borderBottom: index < displayedArticles.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
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
        </>
      )}
      </ForumSelectRequired>
    </div>
  )
}
