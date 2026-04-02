'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Button, Tag, Input, Modal, Form, Popconfirm, message, Space, Popover, Tooltip, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileText, Languages, Plus, Search, Trash2 } from 'lucide-react'
import { CollectionPageData } from '../types'
import { useCollectionPages } from '../context/CollectionPagesContext'
import PageBreadcrumb from '../components/PageBreadcrumb'
import ForumSelectRequired from '../components/ForumSelectRequired'
import FieldI18nEditor from '../wiki/components/FieldI18nEditor'
import { LANGUAGES, type I18nLabels, type LangCode } from '../wiki/components/fieldI18nConstants'
import {
  localeArticleCounts,
  totalArticlesCount,
  hasOrphanLocaleArticles,
  getArticlesForLocale,
  localeHasDisplayName,
} from '../lib/collectionPageLocale'

function mergeNameI18n(record: CollectionPageData): I18nLabels {
  return {
    ...(record.nameI18n ?? {}),
    zh: record.nameI18n?.zh ?? record.name,
  }
}

function pickPrimaryDisplayName(i18n: I18nLabels, fallback: string): string {
  const order: LangCode[] = ['zh', 'zh-tw', 'en', 'ko', 'ja', 'es', 'pt']
  for (const k of order) {
    const v = i18n[k]?.trim()
    if (v) return v
  }
  const first = Object.values(i18n).find((v) => v?.trim())
  return (first?.trim() || fallback).trim() || fallback
}

function configuredI18nEntries(record: CollectionPageData): { code: string; label: string; text: string }[] {
  const merged = mergeNameI18n(record)
  const out: { code: string; label: string; text: string }[] = []
  for (const lang of LANGUAGES) {
    const text = merged[lang.code]?.trim()
    if (text) {
      out.push({ code: lang.code, label: lang.label, text })
    }
  }
  return out
}

function NameCell({ record }: { record: CollectionPageData }) {
  const entries = useMemo(() => configuredI18nEntries(record), [record])
  const popoverContent =
    entries.length === 0 ? (
      <span style={{ fontSize: 13, color: '#6B7280' }}>暂无多语言文案，请点击「编辑」配置</span>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
        {entries.map(({ code, text }) => (
          <div key={code} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <Tag color="processing" style={{ margin: 0, fontFamily: 'monospace', fontSize: 11 }}>
              {code}
            </Tag>
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
      <span style={{ fontWeight: 500, fontSize: 13, color: record.hidden ? '#9CA3AF' : '#1F2937' }}>{record.name}</span>
      {record.hidden ? (
        <Tag style={{ margin: 0, fontSize: 11, lineHeight: '18px' }} color="default">
          已隐藏
        </Tag>
      ) : null}
      {hasOrphanLocaleArticles(record) ? (
        <Tooltip title="部分语种下已有帖子，但未填写该语种的展示名称">
          <Tag style={{ margin: 0, fontSize: 11, lineHeight: '18px' }} color="warning">
            有未命名语种
          </Tag>
        </Tooltip>
      ) : null}
      <Popover title="多语言名称" content={popoverContent} trigger="click" placement="bottomLeft">
        <button
          type="button"
          title="查看已配置语言"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 4,
            color: '#1677FF',
          }}
        >
          <Languages size={15} strokeWidth={2} />
        </button>
      </Popover>
    </div>
  )
}

export default function CollectionPagesPage() {
  const router = useRouter()
  const { pages, addPage, deletePage, updatePageMeta } = useCollectionPages()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<CollectionPageData | null>(null)
  const [searchName, setSearchName] = useState('')
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const filteredPages = useMemo(() => {
    const q = searchName.trim().toLowerCase()
    if (!q) return pages
    return pages.filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true
      const merged = mergeNameI18n(p)
      return Object.values(merged).some((v) => (v ?? '').toLowerCase().includes(q))
    })
  }, [pages, searchName])

  const genLink = () => {
    const maxN = pages.reduce((max, p) => {
      const m = p.link.match(/^\/collection\/(\d+)$/)
      return m ? Math.max(max, parseInt(m[1], 10)) : max
    }, 0)
    return `/collection/${maxN + 1}`
  }

  const handleCreate = async () => {
    const values = await form.validateFields()
    const id = `cp-${Date.now()}`
    const name = values.name as string
    addPage({
      id,
      name,
      nameI18n: { zh: name },
      link: genLink(),
      articlesByLocale: { zh: [] },
    })
    messageApi.success('集合页已创建')
    setCreateOpen(false)
    form.resetFields()
  }

  const handleSaveEditI18n = (next: I18nLabels) => {
    if (!editRecord) return
    const pruned: I18nLabels = {}
    for (const l of LANGUAGES) {
      const t = next[l.code]?.trim()
      if (t) pruned[l.code] = t
    }
    const primary = pickPrimaryDisplayName(pruned, editRecord.name)
    const newPage: CollectionPageData = {
      ...editRecord,
      name: primary,
      nameI18n: Object.keys(pruned).length > 0 ? pruned : undefined,
    }
    const removedLabels: string[] = []
    for (const l of LANGUAGES) {
      if (getArticlesForLocale(editRecord, l.code).length === 0) continue
      if (localeHasDisplayName(editRecord, l.code) && !localeHasDisplayName(newPage, l.code)) {
        removedLabels.push(l.label)
      }
    }
    updatePageMeta(editRecord.id, {
      name: primary,
      nameI18n: Object.keys(pruned).length > 0 ? pruned : undefined,
    })
    if (removedLabels.length > 0) {
      messageApi.success(
        `已保存。已移除 ${removedLabels.join('、')} 的展示名称，该语种帖子仍保留，可在「管理帖子」中查看。`,
      )
    } else {
      messageApi.success('已保存')
    }
    setEditRecord(null)
  }

  const columns: ColumnsType<CollectionPageData> = [
    {
      title: '集合页名称',
      key: 'name',
      width: 260,
      onCell: () => ({ style: { paddingLeft: 20 } }),
      onHeaderCell: () => ({ style: { paddingLeft: 20 } }),
      render: (_, record) => <NameCell record={record} />,
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      width: 260,
      render: (link: string) =>
        link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: '#1677FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            {link}
          </a>
        ) : (
          <span style={{ fontSize: 12, color: '#C0C8D0' }}>未设置</span>
        ),
    },
    {
      title: '隐藏',
      key: 'hidden',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Tooltip title={record.hidden ? '已隐藏：前台不展示该集合页' : '未隐藏：前台可展示该集合页'}>
            <Switch
              size="small"
              checked={!!record.hidden}
              onChange={(checked) => {
                updatePageMeta(record.id, { hidden: checked })
                messageApi.success(checked ? '已设为隐藏' : '已取消隐藏')
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '帖子数',
      key: 'articles',
      width: 120,
      render: (_, record) => {
        const total = totalArticlesCount(record)
        const byLoc = localeArticleCounts(record)
        const lines = LANGUAGES.map((l) => {
          const n = byLoc[l.code]
          return n ? `${l.code}：${n}` : null
        }).filter(Boolean) as string[]
        const tip = lines.length ? lines.join('\n') : '暂无帖子'
        return (
          <Tooltip title={<pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{tip}</pre>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'default' }}>
              <FileText size={13} color="#9CA3AF" />
              <span style={{ fontSize: 13, color: '#374151' }}>{total}</span>
              {lines.length > 1 ? (
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>（多语种）</span>
              ) : null}
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      align: 'left',
      render: (_, record) => (
        <Space size={12}>
          <Button
            type="link"
            size="small"
            style={{ fontSize: 12, padding: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/collection-pages/${record.id}`)
            }}
          >
            管理帖子
          </Button>
          <Button
            type="link"
            size="small"
            style={{ fontSize: 12, padding: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              setEditRecord(record)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确认删除「${record.name}」？`}
            description="删除后数据不可恢复"
            onConfirm={() => {
              deletePage(record.id)
              messageApi.success('已删除')
            }}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={13} color="#EF4444" />}
              onClick={(e) => e.stopPropagation()}
              style={{ padding: '0 4px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      <PageBreadcrumb items={[{ label: '论坛管理', href: '/forum/list' }, { label: '集合页管理' }]} />

      <ForumSelectRequired>
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: 0 }}>集合页管理</h1>
                <Tag
                  style={{
                    background: '#E6F4FF',
                    color: '#1677FF',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                >
                  {pages.length} 个
                </Tag>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>管理各集合页内的帖子及封面图</p>
            </div>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              style={{ borderRadius: 4, height: 32, fontSize: 13, fontWeight: 500 }}
              onClick={() => setCreateOpen(true)}
            >
              新建集合页
            </Button>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <Input
              placeholder="搜索集合页名称"
              prefix={<Search size={14} color="#9CA3AF" />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              allowClear
              style={{ width: 240, borderRadius: 6 }}
            />
          </div>

          <Table
            dataSource={filteredPages}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 个`, showSizeChanger: true }}
            size="middle"
          />
        </div>

        <Modal
          title="新建集合页"
          open={createOpen}
          onCancel={() => {
            setCreateOpen(false)
            form.resetFields()
          }}
          onOk={handleCreate}
          okText="创建"
          cancelText="取消"
          width={440}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="name" label="集合页名称" rules={[{ required: true, message: '请输入集合页名称' }]}>
              <Input placeholder="例如：武器攻略" autoFocus />
            </Form.Item>
            <div
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                background: '#F9FAFB',
                borderRadius: 6,
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
              }}
            >
              链接将自动生成（格式：/collection/N），创建后在列表中可查看；多语言名称可在列表中点击「编辑」配置
            </div>
          </Form>
        </Modal>

        <Modal
          title="编辑集合页"
          open={!!editRecord}
          onCancel={() => setEditRecord(null)}
          footer={null}
          width={560}
          destroyOnHidden
        >
          {editRecord && (
            <FieldI18nEditor
              key={editRecord.id}
              i18n={mergeNameI18n(editRecord)}
              fieldLabel="集合页名称"
              onSave={handleSaveEditI18n}
              onCancel={() => setEditRecord(null)}
            />
          )}
        </Modal>
      </ForumSelectRequired>
    </div>
  )
}
