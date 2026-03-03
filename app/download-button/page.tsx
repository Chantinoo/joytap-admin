'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Input, message, Modal, Popconfirm, Select, Space, Table, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { Plus, Save, Trash2 } from 'lucide-react'
import PageBreadcrumb from '../components/PageBreadcrumb'
import GameFilter from '../components/GameFilter'
import { useLeaveGuard } from '../context/LeaveGuardContext'
import type { DownloadChannelConfig } from '../types'

// 渠道 Logo 前端写死：Google Play（本地图）、App Store、PC（Windows 本地图）与自定义渠道默认图
const CHANNEL_LOGO: Record<string, string> = {
  'google-play': '/google-play-logo.png',
  'app-store':
    'https://upload.wikimedia.org/wikipedia/commons/8/8a/App_Store_(iOS,_2024).svg',
  pc: '/windows-logo.png',
}

const DEFAULT_LOGO_PLACEHOLDER =
  'https://placehold.co/48x48/E5E7EB/6B7280?text=+'

/** 按钮类型固定选项，不可自定义输入 */
const BUTTON_NAME_OPTIONS = [
  { label: '下载', value: '下载' },
  { label: '预约', value: '预约' },
  { label: '获取', value: '获取' },
]

function getChannelLogoUrl(key: string): string {
  return CHANNEL_LOGO[key] ?? DEFAULT_LOGO_PLACEHOLDER
}

const MOCK_OPERATOR = '管理员'
const now = () => dayjs().format('YYYY-MM-DD HH:mm')

const DEFAULT_CHANNELS: DownloadChannelConfig[] = [
  {
    id: 'ch-google-play',
    key: 'google-play',
    channelName: 'Google Play',
    buttonName: '下载',
    jumpLink: '',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
  {
    id: 'ch-app-store',
    key: 'app-store',
    channelName: 'App Store',
    buttonName: '下载',
    jumpLink: '',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
  {
    id: 'ch-pc',
    key: 'pc',
    channelName: 'PC',
    buttonName: '下载',
    jumpLink: '',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
]

const initialChannels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS)) as DownloadChannelConfig[]

export default function DownloadButtonPage() {
  const [channels, setChannels] = useState<DownloadChannelConfig[]>(initialChannels)
  const savedChannelsRef = useRef<string>(JSON.stringify(initialChannels))
  const isDirty = JSON.stringify(channels) !== savedChannelsRef.current

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const leaveGuard = useLeaveGuard()

  const handleSave = useCallback(() => {
    savedChannelsRef.current = JSON.stringify(channels)
    messageApi.success('保存成功，前台将按当前配置展示')
  }, [channels, messageApi])

  useEffect(() => {
    if (!leaveGuard) return
    leaveGuard.setGuard(() => isDirty, handleSave)
    return () => leaveGuard.clearGuard()
  }, [leaveGuard, isDirty, handleSave])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const updateChannel = (id: string, patch: Partial<DownloadChannelConfig>) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...patch, operator: MOCK_OPERATOR, updatedAt: now() }
          : c
      )
    )
  }

  const handleAddChannel = (values: {
    channelName: string
    buttonName: string
    jumpLink: string
  }) => {
    const id = `ch-custom-${Date.now()}`
    const key = `custom-${Date.now()}`
    setChannels((prev) => [
      ...prev,
      {
        id,
        key,
        channelName: values.channelName,
        buttonName: values.buttonName,
        jumpLink: values.jumpLink,
        operator: MOCK_OPERATOR,
        updatedAt: now(),
        isDefault: false,
      },
    ])
    setAddModalOpen(false)
    messageApi.success('已添加渠道')
  }

  const handleDeleteChannel = (id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id))
    messageApi.success('已删除渠道')
  }

  const columns = [
    {
      title: 'Logo',
      width: 80,
      render: (_: unknown, record: DownloadChannelConfig) => (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={getChannelLogoUrl(record.key)}
            alt=""
            style={{
              width: record.key === 'google-play' || record.key === 'app-store' ? 36 : '100%',
              height: record.key === 'google-play' || record.key === 'app-store' ? 36 : '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
    },
    {
      title: '渠道',
      width: 140,
      dataIndex: 'channelName',
      render: (name: string, record: DownloadChannelConfig) =>
        record.isDefault ? (
          name
        ) : (
          <Input
            value={name}
            onChange={(e) =>
              updateChannel(record.id, { channelName: e.target.value })
            }
            placeholder="渠道名称"
            style={{ width: 120 }}
            size="small"
          />
        ),
    },
    {
      title: '按钮类型',
      width: 120,
      dataIndex: 'buttonName',
      render: (val: string, record: DownloadChannelConfig) => (
        <Select
          value={val}
          onChange={(v) => updateChannel(record.id, { buttonName: v })}
          options={BUTTON_NAME_OPTIONS}
          style={{ width: 90 }}
          size="small"
        />
      ),
    },
    {
      title: '跳转链接',
      ellipsis: true,
      render: (_: unknown, record: DownloadChannelConfig) => (
        <Input
          value={record.jumpLink}
          onChange={(e) =>
            updateChannel(record.id, { jumpLink: e.target.value })
          }
          placeholder="https://..."
          size="small"
        />
      ),
    },
    {
      title: '操作人',
      width: 100,
      dataIndex: 'operator',
      render: (v: string | undefined) => v ?? '—',
    },
    {
      title: '操作时间',
      width: 160,
      dataIndex: 'updatedAt',
      render: (v: string | undefined) => v ?? '—',
    },
    {
      title: '操作',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: DownloadChannelConfig) =>
        record.isDefault ? (
          <Tooltip title="默认渠道不可删除">
            <span>
              <Button type="link" danger size="small" icon={<Trash2 size={14} />} disabled>
                删除
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Popconfirm
            title="确定删除该渠道？"
            onConfirm={() => handleDeleteChannel(record.id)}
          >
            <Button type="link" danger size="small" icon={<Trash2 size={14} />}>
              删除
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
          { label: '论坛管理', href: '/forum/list' },
          { label: '下载按钮' },
        ]}
      />
      <GameFilter />

      <div
        style={{
          background: '#fff',
          borderRadius: 6,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
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
            <h1
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#1F2937',
                margin: 0,
              }}
            >
              下载按钮配置
            </h1>
            <p
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                margin: '2px 0 0',
              }}
            >
              按渠道配置「下载」按钮的类型与跳转链接，Logo 由系统固定
            </p>
          </div>
          <Space size={8}>
            {isDirty && (
              <Button
                type="primary"
                icon={<Save size={14} />}
                size="small"
                onClick={handleSave}
                style={{ borderRadius: 6, fontWeight: 500 }}
              >
                保存
              </Button>
            )}
            <Button
              type="primary"
              icon={<Plus size={14} />}
              style={{ borderRadius: 4, height: 32, fontSize: 13, fontWeight: 500 }}
              onClick={() => setAddModalOpen(true)}
            >
              添加渠道
            </Button>
          </Space>
        </div>

        <Table
          dataSource={channels}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          style={{ margin: 0 }}
        />
      </div>

      <Modal
        title="添加渠道"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        destroyOnHidden
        footer={null}
        width={400}
      >
        <AddChannelForm
          onOk={handleAddChannel}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

function AddChannelForm({
  onOk,
  onCancel,
}: {
  onOk: (v: {
    channelName: string
    buttonName: string
    jumpLink: string
  }) => void
  onCancel: () => void
}) {
  const [channelName, setChannelName] = useState('')
  const [buttonName, setButtonName] = useState<'下载' | '预约' | '获取'>('下载')
  const [jumpLink, setJumpLink] = useState('')

  const submit = () => {
    const name = channelName.trim()
    if (!name) {
      message.error('请填写渠道名称')
      return
    }
    onOk({
      channelName: name,
      buttonName,
      jumpLink: jumpLink.trim(),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>渠道名称</span>
        <Input
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="如：华为应用市场"
          style={{ marginTop: 6 }}
        />
      </div>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>按钮类型</span>
        <Select
          value={buttonName}
          onChange={(v) => setButtonName(v)}
          options={BUTTON_NAME_OPTIONS}
          style={{ width: '100%', marginTop: 6 }}
        />
      </div>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>跳转链接</span>
        <Input
          value={jumpLink}
          onChange={(e) => setJumpLink(e.target.value)}
          placeholder="https://..."
          style={{ marginTop: 6 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={submit}>
          确定
        </Button>
      </div>
    </div>
  )
}
