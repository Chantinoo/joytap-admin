'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, Button, Switch, Popconfirm, message, Modal, Form, Input } from 'antd'
import { ExternalLink, Plus } from 'lucide-react'
import PageBreadcrumb from '../../../components/PageBreadcrumb'
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
  hidden: boolean
}

function buildLocalRows(wikiKey: string, wikiLabel: string): WikiDataRow[] {
  return BASE_MOCK_NAMES.map((name, i) => ({
    key: `${wikiKey}-${1001 + i}`,
    id: 1001 + i,
    name: wikiKey === 'items' ? name : `${wikiLabel} · ${name}`,
    hidden: false,
  }))
}

type ApiAdminItem = { id: number; name: string; hidden: boolean }

export default function WikiDataPageClient({ wikiKey }: { wikiKey: string }) {
  const [messageApi, contextHolder] = message.useMessage()
  const wikiLabel = WIKI_META[wikiKey]?.label ?? wikiKey
  const isItemsWiki = wikiKey === 'items'

  const [rows, setRows] = useState<WikiDataRow[]>(() => buildLocalRows(wikiKey, wikiLabel))
  const [loading, setLoading] = useState(isItemsWiki)
  /** 实际用于 API 与「前台查看」的前台基址（环境变量或 localStorage 覆盖） */
  const [communityOrigin, setCommunityOrigin] = useState(getRoCommunityOrigin)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RO_COMMUNITY_ORIGIN_STORAGE_KEY)
      const u = raw?.trim().replace(/\/$/, '')
      if (u) setCommunityOrigin(u)
    } catch {
      /* ignore */
    }
  }, [])

  const syncFromCommunity = useCallback(async () => {
    if (!isItemsWiki) return
    setLoading(true)
    const origin = communityOrigin
    try {
      const res = await fetch(`${origin}/api/wiki/items?admin=1`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      const list = (data.items ?? []) as ApiAdminItem[]
      if (Array.isArray(list) && list.length > 0) {
        setRows(
          list.map((it) => ({
            key: `items-${it.id}`,
            id: it.id,
            name: it.name,
            hidden: !!it.hidden,
          })),
        )
      } else {
        setRows(buildLocalRows(wikiKey, wikiLabel))
        messageApi.warning('前台暂无道具数据，已使用本地 MOCK')
      }
    } catch {
      setRows(buildLocalRows(wikiKey, wikiLabel))
      messageApi.warning(`无法连接前台 API（${origin}），已使用本地 MOCK。请配置 NEXT_PUBLIC_RO_COMMUNITY_URL 并启动 ro-community。`)
    } finally {
      setLoading(false)
    }
  }, [isItemsWiki, wikiKey, wikiLabel, messageApi, communityOrigin])

  useEffect(() => {
    syncFromCommunity()
  }, [syncFromCommunity])

  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addForm] = Form.useForm<{ name: string }>()

  const submitAdd = async () => {
    const values = await addForm.validateFields()
    const name = values.name?.trim()
    if (!name) {
      messageApi.error('请输入名称')
      return
    }
    if (isItemsWiki) {
      setAddSubmitting(true)
      try {
        const res = await fetch(`${communityOrigin}/api/wiki/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          messageApi.error(data.error === 'empty_name' ? '名称不能为空' : '前台新增失败')
          return
        }
        messageApi.success('已新增并同步到前台')
        setAddOpen(false)
        addForm.resetFields()
        await syncFromCommunity()
      } catch {
        messageApi.error('无法连接前台，请确认 ro-community 已启动')
      } finally {
        setAddSubmitting(false)
      }
      return
    }
    const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1
    setRows((prev) => [
      ...prev,
      { key: `${wikiKey}-${nextId}`, id: nextId, name: `${wikiLabel} · ${name}`, hidden: false },
    ])
    messageApi.success('已新增（仅本页 MOCK，非道具 Wiki 不同步前台）')
    setAddOpen(false)
    addForm.resetFields()
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

  const dataSource = useMemo(() => rows, [rows])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 72 },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    ...(isItemsWiki
      ? [
          {
            title: '前台查看',
            key: 'front',
            width: 100,
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
      width: 72,
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
      width: 88,
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
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{wikiLabel}</div>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            新增
          </Button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <Table<WikiDataRow>
            rowKey="key"
            size="small"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            loading={loading}
          />
        </div>
      </div>

      <Modal
        title="新增条目"
        open={addOpen}
        onOk={submitAdd}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        okText="确定"
        cancelText="取消"
        confirmLoading={addSubmitting}
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder={isItemsWiki ? '例如：红药水' : '条目显示名称'} allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
