'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, Button, Switch, Popconfirm, message, Modal, Form, Input, Tooltip, Spin } from 'antd'
import { ExternalLink, Languages, Plus, Search } from 'lucide-react'
import PageBreadcrumb from '../../../components/PageBreadcrumb'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from '../../components/FieldI18nModal'
import {
  getRoCommunityOrigin,
  buildWikiItemDetailUrl,
  RO_COMMUNITY_ORIGIN_STORAGE_KEY,
} from '@/lib/roCommunity'

const WIKI_META: Record<string, { label: string }> = {
  items: { label: '道具' },
  monsters: { label: '怪物' },
  cards: { label: '卡片' },
  pets: { label: '宠物' },
  boxes: { label: '箱子' },
  arrows: { label: '箭矢制作' },
  sets: { label: '套装' },
  skills: { label: '技能模拟' },
  npcs: { label: 'NPC' },
  maps: { label: '地图' },
}

const BASE_MOCK_NAMES = [
  '铜币',
  'Zeny',
  '喵喵果实',
  '金币',
  '波利币',
  '赛鹿币',
  "赛鹿币'24",
  'BASE经验',
  'JOB经验',
  '大量BASE经验',
  '大量JOB经验',
  '魔物研究进度点',
  '魔物驱逐时间',
  '周年抽奖券',
  '「波」卡',
]

export interface WikiDataRow {
  key: string
  id: number
  name: string
  nameEn?: string
  nameI18n?: I18nLabels
  hidden: boolean
  category?: string
  quality?: string
  levelReq?: string
  job?: string
  stack?: string
  icon?: string
}

const MOCK_QUALITIES = ['C', 'B', 'A', 'S'] as const

function mockItemCardFields(i: number): Pick<WikiDataRow, 'category' | 'quality' | 'levelReq' | 'job' | 'stack' | 'icon'> {
  return {
    category: i < 2 ? '背包外货币' : '其他',
    quality: MOCK_QUALITIES[i % 4],
    levelReq: '全等级可用',
    job: '-',
    stack: '-',
    icon: i % 3 === 0 ? '/avatar-poring.png' : '/logo.png',
  }
}

function buildLocalRows(wikiKey: string, wikiLabel: string): WikiDataRow[] {
  return BASE_MOCK_NAMES.map((name, i) => ({
    key: `${wikiKey}-${1001 + i}`,
    id: 1001 + i,
    name: wikiKey === 'items' ? name : `${wikiLabel} · ${name}`,
    hidden: false,
    ...(wikiKey === 'items' ? mockItemCardFields(i) : {}),
  }))
}

type ApiAdminItem = {
  id: number
  name: string
  hidden: boolean
  nameEn?: string
  nameI18n?: I18nLabels
  category?: string
  quality?: string
  levelReq?: string
  job?: string
  stack?: string
  icon?: string
}

/** 拉取道具 Wiki 列表；失败或空列表时回落为本地 MOCK */
async function pullItemsRowsFromApi(
  origin: string,
  wikiLabel: string,
): Promise<{ rows: WikiDataRow[]; warn?: 'empty' | 'error' }> {
  try {
    const res = await fetch(`${origin}/api/wiki/items?admin=1`, { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    const list = (data.items ?? []) as ApiAdminItem[]
    if (Array.isArray(list) && list.length > 0) {
      return {
        rows: list.map((it, idx) => {
          const fallback = mockItemCardFields(idx)
          return {
            key: `items-${it.id}`,
            id: it.id,
            name: it.name,
            hidden: !!it.hidden,
            ...(it.nameEn ? { nameEn: it.nameEn } : {}),
            ...(it.nameI18n && Object.keys(it.nameI18n).length > 0 ? { nameI18n: it.nameI18n } : {}),
            category: it.category ?? fallback.category,
            quality: it.quality ?? fallback.quality,
            levelReq: it.levelReq ?? fallback.levelReq,
            job: it.job ?? fallback.job,
            stack: it.stack ?? fallback.stack,
            icon: it.icon ?? fallback.icon,
          }
        }),
      }
    }
    return { rows: buildLocalRows('items', wikiLabel), warn: 'empty' }
  } catch {
    return { rows: buildLocalRows('items', wikiLabel), warn: 'error' }
  }
}

export default function WikiDataPageClient({ wikiKey }: { wikiKey: string }) {
  const [messageApi, contextHolder] = message.useMessage()
  const wikiLabel = WIKI_META[wikiKey]?.label ?? wikiKey
  const isItemsWiki = wikiKey === 'items'

  const [rows, setRows] = useState<WikiDataRow[]>(() => buildLocalRows(wikiKey, wikiLabel))
  const [loading, setLoading] = useState(isItemsWiki)
  /** 实际用于 API 与「前台查看」的前台基址（环境变量或 localStorage 覆盖） */
  const [communityOrigin, setCommunityOrigin] = useState(getRoCommunityOrigin)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RO_COMMUNITY_ORIGIN_STORAGE_KEY)
      const u = raw?.trim().replace(/\/$/, '')
      if (u) setCommunityOrigin(u)
    } catch {
      /* ignore */
    }
  }, [])

  /** 仅道具 Wiki：新增后静默刷新列表 */
  const syncFromCommunity = useCallback(async () => {
    if (!isItemsWiki) return
    setLoading(true)
    try {
      const { rows: next } = await pullItemsRowsFromApi(communityOrigin, wikiLabel)
      setRows(next)
    } finally {
      setLoading(false)
    }
  }, [isItemsWiki, communityOrigin, wikiLabel])

  /**
   * 切换 Wiki 分类或前台地址时同步数据。
   * 非道具：本地 MOCK（不走 API）；道具：拉前台，并在卸载/切换时忽略过期请求，避免盖住其他页。
   */
  useEffect(() => {
    setSearchKeyword('')

    if (!isItemsWiki) {
      setLoading(false)
      setRows(buildLocalRows(wikiKey, wikiLabel))
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { rows: next, warn } = await pullItemsRowsFromApi(communityOrigin, wikiLabel)
        if (cancelled) return
        setRows(next)
        if (warn === 'empty') messageApi.warning('前台暂无道具数据，已使用本地 MOCK')
        if (warn === 'error') {
          messageApi.warning(
            `无法连接前台 API（${communityOrigin}），已使用本地 MOCK。请配置 NEXT_PUBLIC_RO_COMMUNITY_URL 并启动 ro-community。`,
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [wikiKey, wikiLabel, isItemsWiki, communityOrigin, messageApi])

  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addForm] = Form.useForm<{ nameZh: string }>()
  const [addNameI18nModalOpen, setAddNameI18nModalOpen] = useState(false)
  const [pendingAddNameI18n, setPendingAddNameI18n] = useState<I18nLabels>({})

  const openAddNameI18nModal = () => {
    const zh = (addForm.getFieldValue('nameZh') as string | undefined)?.trim() ?? ''
    setPendingAddNameI18n((prev) => ({ ...prev, ...(zh ? { zh } : {}) }))
    setAddNameI18nModalOpen(true)
  }

  const handleAddNameI18nSave = (i18n: I18nLabels) => {
    const zh = (i18n.zh ?? '').trim()
    setPendingAddNameI18n(i18n)
    if (zh) addForm.setFieldsValue({ nameZh: zh })
    setAddNameI18nModalOpen(false)
    messageApi.success('多语言已保存')
  }

  const submitAdd = async () => {
    const values = await addForm.validateFields()
    const zh = (pendingAddNameI18n.zh ?? values.nameZh ?? '').trim()
    if (!zh) {
      messageApi.error('请填写名称（简体），或通过「多语言配置」填写简体中文。')
      return
    }
    const mergedI18n: I18nLabels = { ...pendingAddNameI18n, zh }
    const en = mergedI18n.en?.trim()
    if (isItemsWiki) {
      setAddSubmitting(true)
      try {
        const res = await fetch(`${communityOrigin}/api/wiki/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: zh,
            ...(en ? { nameEn: en } : {}),
            nameI18n: mergedI18n,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          messageApi.error(data.error === 'empty_name' ? '名称不能为空' : '前台新增失败')
          return
        }
        messageApi.success('已新增并同步到前台')
        setAddOpen(false)
        addForm.resetFields()
        setPendingAddNameI18n({})
        await syncFromCommunity()
      } catch {
        messageApi.error('无法连接前台，请确认 ro-community 已启动')
      } finally {
        setAddSubmitting(false)
      }
      return
    }
    const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1
    const label =
      en ? `${wikiLabel} · ${zh} / ${en}` : `${wikiLabel} · ${zh}`
    setRows((prev) => [
      ...prev,
      {
        key: `${wikiKey}-${nextId}`,
        id: nextId,
        name: label,
        ...(en ? { nameEn: en } : {}),
        ...(Object.keys(mergedI18n).length > 0 ? { nameI18n: mergedI18n } : {}),
        hidden: false,
      },
    ])
    messageApi.success('已新增（仅本页 MOCK，非道具 Wiki 不同步前台）')
    setAddOpen(false)
    addForm.resetFields()
    setPendingAddNameI18n({})
  }

  const patchHidden = async (id: number, hidden: boolean) => {
    if (!isItemsWiki) return
    const origin = communityOrigin
    try {
      const res = await fetch(`${origin}/api/wiki/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hidden }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      messageApi.error('同步前台失败，请确认 ro-community 已启动且地址正确')
      throw new Error('sync')
    }
  }

  const deleteRemote = async (id: number) => {
    if (!isItemsWiki) return
    const origin = communityOrigin
    try {
      const res = await fetch(`${origin}/api/wiki/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      messageApi.error('同步前台删除失败')
      throw new Error('sync')
    }
  }

  const dataSource = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      if (String(r.id).includes(q)) return true
      if (r.name.toLowerCase().includes(q)) return true
      if ((r.nameEn ?? '').toLowerCase().includes(q)) return true
      for (const v of Object.values(r.nameI18n ?? {})) {
        if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [rows, searchKeyword])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: WikiDataRow) =>
        record.nameEn ? (
          <span>
            <span>{text}</span>
            <span style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {record.nameEn}
            </span>
          </span>
        ) : (
          text
        ),
    },
    ...(isItemsWiki
      ? [
          {
            title: '前台查看',
            key: 'front',
            width: 120,
            render: (_: unknown, record: WikiDataRow) => (
              <Button
                size="small"
                type="link"
                icon={<ExternalLink size={13} />}
                onClick={() =>
                  window.open(
                    buildWikiItemDetailUrl(communityOrigin, record.id),
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                前台查看
              </Button>
            ),
          },
        ]
      : []),
    {
      title: '隐藏',
      key: 'hidden',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: WikiDataRow) => (
        <Switch
          checked={record.hidden}
          onChange={async (checked) => {
            if (isItemsWiki) {
              try {
                await patchHidden(record.id, checked)
              } catch {
                return
              }
            }
            setRows((prev) =>
              prev.map((r) => (r.key === record.key ? { ...r, hidden: checked } : r)),
            )
            messageApi.success(checked ? '已标记为隐藏' : '已取消隐藏')
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: WikiDataRow) => (
        <Popconfirm
          title="确认删除该卡片？"
          description={
            isItemsWiki
              ? '将从后台列表移除，并同步在前台道具 Wiki 中删除该卡片。'
              : '删除后仅影响当前页 MOCK。'
          }
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={async () => {
            if (isItemsWiki) {
              try {
                await deleteRemote(record.id)
              } catch {
                return
              }
            }
            setRows((prev) => prev.filter((r) => r.key !== record.key))
            messageApi.success('已删除卡片')
          }}
        >
          <Button size="small" danger type="link">
            删除卡片
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb
        items={[
          { label: 'Wiki 管理', href: '/wiki' },
          { label: `${wikiLabel} · 数据` },
        ]}
      />

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', flexShrink: 0 }}>{wikiLabel}</div>
          <Input
            allowClear
            placeholder={`搜索${wikiLabel}名称或 ID`}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            prefix={<Search size={16} style={{ color: '#9ca3af' }} />}
            style={{ flex: '1 1 220px', maxWidth: 420, minWidth: 180 }}
          />
          {!isItemsWiki ? (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setPendingAddNameI18n({})
                addForm.resetFields()
                setAddOpen(true)
              }}
              style={{ flexShrink: 0, marginLeft: 'auto' }}
            >
              新增
            </Button>
          ) : (
            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280' }}>共 {dataSource.length} 条</div>
          )}
        </div>

        <div style={{ padding: '16px 20px' }}>
          {isItemsWiki ? (
            <Spin spinning={loading}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
              {dataSource.map((row) => {
                const title = (row.nameI18n?.zh ?? row.name).trim() || row.name
                const iconPath = row.icon?.trim() || '/logo.png'
                const iconSrc = iconPath.startsWith('http')
                  ? iconPath
                  : `${communityOrigin.replace(/\/$/, '')}${iconPath.startsWith('/') ? iconPath : `/${iconPath}`}`
                return (
                  <div
                    key={row.key}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      gap: 10,
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      minHeight: 132,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        flexShrink: 0,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={iconSrc} alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', lineHeight: 1.3 }}>{title}</div>
                      {row.nameEn ? (
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: -2 }}>{row.nameEn}</div>
                      ) : null}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr',
                          columnGap: 10,
                          rowGap: 4,
                          fontSize: 12,
                          color: '#6B7280',
                        }}
                      >
                        <span>分类</span>
                        <span style={{ color: '#111827' }}>{row.category ?? '—'}</span>
                        <span>品质</span>
                        <span style={{ color: '#111827' }}>{row.quality ?? '—'}</span>
                        <span>等级限制</span>
                        <span style={{ color: '#111827' }}>{row.levelReq ?? '—'}</span>
                        <span>职业</span>
                        <span style={{ color: '#111827' }}>{row.job ?? '—'}</span>
                        <span>堆叠</span>
                        <span style={{ color: '#111827' }}>{row.stack ?? '—'}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 'auto', paddingTop: 6 }}>
                        {LANGUAGES.filter((l) => row.nameI18n?.[l.code]?.trim()).map((l) => (
                          <Tooltip key={l.code} title={`${l.label}: ${row.nameI18n?.[l.code]}`}>
                            <span
                              style={{
                                fontSize: 10,
                                color: '#6B7280',
                                background: '#F3F4F6',
                                padding: '1px 5px',
                                borderRadius: 3,
                                lineHeight: '16px',
                              }}
                            >
                              {l.code}
                            </span>
                          </Tooltip>
                        ))}
                        <Switch
                          size="small"
                          checked={row.hidden}
                          onChange={async (checked) => {
                            if (isItemsWiki) {
                              try {
                                await patchHidden(row.id, checked)
                              } catch {
                                return
                              }
                            }
                            setRows((prev) =>
                              prev.map((r) => (r.key === row.key ? { ...r, hidden: checked } : r)),
                            )
                            messageApi.success(checked ? '已标记为隐藏' : '已取消隐藏')
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>隐藏</span>
                        <Button
                          size="small"
                          type="link"
                          icon={<ExternalLink size={13} />}
                          style={{ padding: '0 4px', height: 22, fontSize: 12 }}
                          onClick={() =>
                            window.open(buildWikiItemDetailUrl(communityOrigin, row.id), '_blank', 'noopener,noreferrer')
                          }
                        >
                          前台查看
                        </Button>
                        <Popconfirm
                          title="确认删除该卡片？"
                          description="将从后台列表移除，并同步在前台道具 Wiki 中删除该卡片。"
                          okText="删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                          onConfirm={async () => {
                            try {
                              await deleteRemote(row.id)
                            } catch {
                              return
                            }
                            setRows((prev) => prev.filter((r) => r.key !== row.key))
                            messageApi.success('已删除卡片')
                          }}
                        >
                          <Button size="small" danger type="link" style={{ padding: '0 4px', height: 22, fontSize: 12 }}>
                            删除
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setPendingAddNameI18n({})
                  addForm.resetFields()
                  setAddOpen(true)
                }}
                style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: 10,
                  minHeight: 132,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FAFAFA',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: 42,
                  fontWeight: 300,
                  lineHeight: 1,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1677FF'
                  e.currentTarget.style.color = '#1677FF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.color = '#9CA3AF'
                }}
                aria-label="新增道具"
              >
                +
              </button>
            </div>
            </Spin>
          ) : (
            <Table<WikiDataRow>
              rowKey="key"
              size="small"
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              loading={loading}
            />
          )}
        </div>
      </div>

      <Modal
        title={isItemsWiki ? '新增道具' : '新增条目'}
        open={addOpen}
        forceRender
        onOk={submitAdd}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
          setPendingAddNameI18n({})
          setAddNameI18nModalOpen(false)
        }}
        okText="确定"
        cancelText="取消"
        confirmLoading={addSubmitting}
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 12 }} initialValues={{ nameZh: '' }}>
          <Form.Item
            name="nameZh"
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontWeight: 500 }}>
                名称（默认简体中文）
                <Tooltip title="多语言配置">
                  <Button
                    type="text"
                    htmlType="button"
                    size="small"
                    icon={<Languages size={16} style={{ color: '#1677ff' }} />}
                    style={{ padding: '0 4px', height: 28 }}
                    onClick={openAddNameI18nModal}
                    aria-label="多语言配置"
                  />
                </Tooltip>
              </span>
            }
            rules={[{ required: false }]}
          >
            <Input
              allowClear
              placeholder={isItemsWiki ? '例如：红药水（可与多语言中的简体同步）' : '中文或主显示名称'}
              onChange={(e) => {
                const v = e.target.value
                setPendingAddNameI18n((prev) => ({ ...prev, zh: v }))
              }}
            />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            仅需定义名称：可在上方输入简体，或点击语言图标配置全部语种（须包含简体中文）。道具将同步至前台 JSON。
          </div>
        </Form>
      </Modal>

      <FieldI18nModal
        open={addNameI18nModalOpen}
        fieldKey="wiki_item_name"
        fieldLabel={(pendingAddNameI18n.zh ?? addForm.getFieldValue('nameZh') ?? '').trim() || '道具名称'}
        i18n={pendingAddNameI18n}
        onSave={handleAddNameI18nSave}
        onCancel={() => setAddNameI18nModalOpen(false)}
      />
    </div>
  )
}
