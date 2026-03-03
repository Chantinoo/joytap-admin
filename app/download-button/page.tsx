'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, Button, DatePicker, Input, message, Modal, Popconfirm, Radio, Select, Space, Table, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { ClipboardPaste, Plus, Trash2 } from 'lucide-react'
import PageBreadcrumb from '../components/PageBreadcrumb'
import GameFilter from '../components/GameFilter'
import { useLeaveGuard } from '../context/LeaveGuardContext'
import type { DownloadChannelConfig, ReservedUserInfo } from '../types'

/** 渠道名称固定选项 */
const CHANNEL_NAME_OPTIONS = ['Google Play', 'App Store', '官方 PC 客户端', 'Steam', '华为应用市场']

/** 渠道名称 -> 类型 */
const CHANNEL_TYPE_MAP: Record<string, 'Android' | 'ios' | 'PC' | '鸿蒙'> = {
  'Google Play': 'Android',
  'App Store': 'ios',
  '官方 PC 客户端': 'PC',
  Steam: 'PC',
  '华为应用市场': '鸿蒙',
}
function getChannelType(channelName: string): 'Android' | 'ios' | 'PC' | '鸿蒙' {
  return CHANNEL_TYPE_MAP[channelName] ?? 'Android'
}

/** 状态固定选项：预约 / 获取 */
const BUTTON_NAME_OPTIONS = [
  { label: '预约', value: '预约' },
  { label: '获取', value: '获取' },
]

const MOCK_OPERATOR = '管理员'
const now = () => dayjs().format('YYYY-MM-DD HH:mm')

/** 群发通知默认标题与描述 */
const DEFAULT_NOTIFICATION_TITLE = '游戏已开放下载'
const DEFAULT_NOTIFICATION_DESCRIPTION = '点击链接即可获取。'

const DEFAULT_CHANNELS: DownloadChannelConfig[] = [
  {
    id: 'ch-google-play',
    key: 'google-play',
    channelName: 'Google Play',
    channelType: 'Android',
    buttonName: '获取',
    jumpLink: 'https://play.google.com/store/apps/details?id=xxx',
    scheduledTime: '2025-03-15 10:00',
    reservedUsers: [
      { id: 'user_001', nickname: '玩家小A', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_001' },
      { id: 'user_002', nickname: '游戏达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_002' },
      { id: 'user_003', nickname: '预约用户三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_003' },
      { id: 'user_004', nickname: '快乐玩家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_004' },
      { id: 'user_005', nickname: '新手小白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_005' },
      { id: 'user_006', nickname: '老司机', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_006' },
      { id: 'user_007', nickname: '攻略收藏家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_007' },
      { id: 'user_008', nickname: '夜猫子', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_008' },
      { id: 'user_009', nickname: '周末党', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_009' },
      { id: 'user_010', nickname: '佛系玩家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_010' },
      { id: 'user_011', nickname: '肝帝', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_011' },
      { id: 'user_012', nickname: '萌新求带', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_012' },
      { id: 'user_013', nickname: '成就党', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_013' },
      { id: 'user_014', nickname: '休闲玩家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_014' },
      { id: 'user_015', nickname: '氪金大佬', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_015' },
      { id: 'user_016', nickname: '零元党', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_016' },
      { id: 'user_017', nickname: '剧情党', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_017' },
      { id: 'user_018', nickname: 'PVP爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_018' },
      { id: 'user_019', nickname: '风景党', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_019' },
      { id: 'user_020', nickname: '开荒小队', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user_020' },
    ],
    notificationTitle: '游戏已开放下载',
    notificationMessage: '点击链接即可获取。',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
  {
    id: 'ch-app-store',
    key: 'app-store',
    channelName: 'App Store',
    channelType: 'ios',
    buttonName: '预约',
    jumpLink: '',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
  {
    id: 'ch-pc',
    key: 'pc',
    channelName: '官方 PC 客户端',
    channelType: 'PC',
    buttonName: '预约',
    jumpLink: '',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
  {
    id: 'ch-steam',
    key: 'steam',
    channelName: 'Steam',
    channelType: 'PC',
    buttonName: '预约',
    jumpLink: '',
    operator: MOCK_OPERATOR,
    updatedAt: '2025-02-28 10:00',
    isDefault: true,
  },
]

const initialChannels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS)) as DownloadChannelConfig[]

type ReservationConfigMode = 'unified' | 'per-channel'

function cardStyle() {
  return {
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
    overflow: 'hidden' as const,
  }
}

function cardHeaderStyle() {
  return {
    padding: '14px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}

function cardTitleStyle() {
  return {
    fontSize: 15,
    fontWeight: 600,
    color: '#1F2937',
    margin: 0,
  }
}

function cardDescStyle() {
  return { fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' as const }
}

/** 预览空状态时的示例文案（较长，用于展示标题一行、描述两行的省略效果） */
const PREVIEW_EXAMPLE_TITLE = '游戏已开放下载，点击即可获取。标题过长时仅显示一行，多余部分以省略号展示。'
const PREVIEW_EXAMPLE_MESSAGE =
  '这里是群发通知的描述内容。描述过长时仅显示两行，多余部分以省略号展示。您可以在此编辑实际发送给用户的文案，用户端将按标题一行、描述两行的方式展示。'

const titleStyle = {
  fontWeight: 600 as const,
  fontSize: 14,
  color: '#1F2937',
  marginBottom: 6,
  overflow: 'hidden' as const,
  textOverflow: 'ellipsis' as const,
  whiteSpace: 'nowrap' as const,
}
const descStyle = {
  fontSize: 13,
  color: '#374151',
  lineHeight: 1.5,
  overflow: 'hidden' as const,
  textOverflow: 'ellipsis' as const,
  display: '-webkit-box' as const,
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
}

/** 站内通知预览：参考站内通知样式，标题一行、描述两行，超出省略；无内容时显示默认示例 */
function NotificationPreview({ title, message }: { title: string; message: string }) {
  const hasContent = title.trim() || message.trim()
  const displayTitle = hasContent ? title.trim() : PREVIEW_EXAMPLE_TITLE
  const displayMessage = hasContent ? message.trim() : PREVIEW_EXAMPLE_MESSAGE
  return (
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6, display: 'block' }}>
        预览{!hasContent && '（示例：展示字数超出一行/两行时的省略效果）'}
      </span>
      <div
        style={{
          padding: 12,
          background: '#F5F5F0',
          borderRadius: 6,
          border: '1px solid #E8E8E4',
        }}
      >
        <div style={titleStyle}>{displayTitle}</div>
        <div style={descStyle}>{displayMessage}</div>
      </div>
    </div>
  )
}

export default function DownloadButtonPage() {
  const [channels, setChannels] = useState<DownloadChannelConfig[]>(initialChannels)
  const savedChannelsRef = useRef<string>(JSON.stringify(initialChannels))

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [reservationConfigMode, setReservationConfigMode] = useState<ReservationConfigMode>('unified')
  const [unifiedReservation, setUnifiedReservation] = useState({
    scheduledTime: '',
    notificationTitle: DEFAULT_NOTIFICATION_TITLE,
    notificationMessage: DEFAULT_NOTIFICATION_DESCRIPTION,
  })
  const [templateReservation, setTemplateReservation] = useState({
    scheduledTime: '',
    notificationTitle: DEFAULT_NOTIFICATION_TITLE,
    notificationMessage: DEFAULT_NOTIFICATION_DESCRIPTION,
  })
  const [pageOperator, setPageOperator] = useState(MOCK_OPERATOR)
  const [pageUpdatedAt, setPageUpdatedAt] = useState(initialChannels[0]?.updatedAt ?? now())
  const [reservedListChannelId, setReservedListChannelId] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const leaveGuard = useLeaveGuard()

  const reservationChannels = channels.filter((c) => c.buttonName === '预约')

  const effectiveChannels =
    reservationConfigMode === 'unified' && reservationChannels.length > 0
      ? channels.map((c) => {
          if (c.buttonName !== '预约') return c
          return {
            ...c,
            scheduledTime: unifiedReservation.scheduledTime.trim() || undefined,
            notificationTitle: unifiedReservation.notificationTitle.trim() || undefined,
            notificationMessage: unifiedReservation.notificationMessage.trim() || undefined,
          }
        })
      : channels

  const isDirty = JSON.stringify(effectiveChannels) !== savedChannelsRef.current

  const handleSave = useCallback(() => {
    const toSave =
      reservationConfigMode === 'unified' && reservationChannels.length > 0
        ? channels.map((c) => {
            if (c.buttonName !== '预约') return c
            return {
              ...c,
              scheduledTime: unifiedReservation.scheduledTime.trim() || undefined,
              notificationTitle: unifiedReservation.notificationTitle.trim() || undefined,
              notificationMessage: unifiedReservation.notificationMessage.trim() || undefined,
              operator: MOCK_OPERATOR,
              updatedAt: now(),
            }
          })
        : channels
    setChannels(toSave)
    savedChannelsRef.current = JSON.stringify(toSave)
    setPageOperator(MOCK_OPERATOR)
    setPageUpdatedAt(now())
    messageApi.success('保存成功，前台将按当前配置展示')
  }, [channels, reservationConfigMode, unifiedReservation, reservationChannels.length, messageApi])

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
    const withType =
      patch.channelName !== undefined
        ? { ...patch, channelType: getChannelType(patch.channelName) }
        : patch
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...withType, operator: MOCK_OPERATOR, updatedAt: now() } : c
      )
    )
  }

  const handleAddChannel = (values: {
    channelName: string
    buttonName: string
    jumpLink: string
    scheduledTime?: string
    notificationTitle?: string
    notificationMessage?: string
  }) => {
    const id = `ch-custom-${Date.now()}`
    const key = `custom-${Date.now()}`
    setChannels((prev) => [
      ...prev,
      {
        id,
        key,
        channelName: values.channelName,
        channelType: getChannelType(values.channelName),
        buttonName: values.buttonName,
        jumpLink: values.jumpLink,
        scheduledTime: values.buttonName === '预约' ? values.scheduledTime : undefined,
        reservedUsers: values.buttonName === '预约' ? [] : undefined,
        notificationTitle: values.buttonName === '预约' ? values.notificationTitle?.trim() || undefined : undefined,
        notificationMessage: values.buttonName === '预约' ? values.notificationMessage?.trim() || undefined : undefined,
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

  const handleEditChannelSave = (
    id: string,
    patch: { channelName: string; channelType?: 'Android' | 'ios' | 'PC' | '鸿蒙'; buttonName: string; jumpLink: string }
  ) => {
    updateChannel(id, patch)
    setEditingChannelId(null)
    messageApi.success('已保存')
  }

  // 初始化统一配置：从第一个预约渠道同步
  useEffect(() => {
    if (reservationConfigMode === 'unified' && reservationChannels.length > 0) {
      const first = reservationChannels[0]
      const hasTitle = (first.notificationTitle ?? '').trim()
      const hasMessage = (first.notificationMessage ?? '').trim()
      setUnifiedReservation((prev) => ({
        ...prev,
        scheduledTime: first.scheduledTime ?? '',
        notificationTitle: hasTitle ? first.notificationTitle! : DEFAULT_NOTIFICATION_TITLE,
        notificationMessage: hasMessage ? first.notificationMessage! : DEFAULT_NOTIFICATION_DESCRIPTION,
      }))
    }
  }, [reservationConfigMode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      <PageBreadcrumb
        items={[
          { label: '论坛管理', href: '/forum/list' },
          { label: '下载按钮' },
        ]}
      />

      {/* 1. 论坛查询 */}
      <GameFilter />

      {/* 2. 渠道与链接配置 */}
      <div style={cardStyle()}>
        <div style={cardHeaderStyle()}>
          <div>
            <h1 style={cardTitleStyle()}>渠道与链接配置</h1>
            <p style={cardDescStyle()}>展示渠道名、类型、状态与配置链接</p>
          </div>
          <Space size={8}>
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
        <div style={{ padding: '0 32px 20px' }}>
          <Table
            className="download-button-table download-button-table--channels"
            dataSource={channels}
            rowKey="id"
            pagination={false}
            size="middle"
            style={{ margin: 0 }}
            columns={[
              {
                title: '渠道',
                width: 140,
                dataIndex: 'channelName',
                render: (name: string) => name,
              },
              {
                title: '类型',
                width: 100,
                render: (_: unknown, record: DownloadChannelConfig) =>
                  record.channelType ?? getChannelType(record.channelName),
              },
              {
                title: '状态',
                width: 100,
                dataIndex: 'buttonName',
                render: (val: string) => val,
              },
              {
                title: '配置链接',
                dataIndex: 'jumpLink',
                ellipsis: true,
                render: (link: string) =>
                  link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                      {link}
                    </a>
                  ) : (
                    '—'
                  ),
              },
              {
                title: '操作',
                width: 120,
                align: 'left' as const,
                render: (_: unknown, record: DownloadChannelConfig) => (
                  <Space size={8}>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setEditingChannelId(record.id)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除该渠道？"
                      onConfirm={() => handleDeleteChannel(record.id)}
                    >
                      <Button type="link" danger size="small" icon={<Trash2 size={14} />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
        />
        </div>
      </div>

      {/* 3. 预约信息配置 */}
      <div style={cardStyle()}>
        <div style={cardHeaderStyle()}>
          <div>
            <h1 style={cardTitleStyle()}>预约信息配置</h1>
            <p style={cardDescStyle()}>填写预约定时与群发通知文案；可选择统一配置或按渠道分别配置</p>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#374151', marginRight: 12 }}>配置方式</span>
            <Radio.Group
              value={reservationConfigMode}
              onChange={(e) => setReservationConfigMode(e.target.value)}
            >
              <Radio value="unified">所有渠道统一配置</Radio>
              <Radio value="per-channel">各渠道单独配置</Radio>
            </Radio.Group>
          </div>

          {reservationConfigMode === 'unified' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={{ fontSize: 13, color: '#374151' }}>预约定时（转为「获取」时间）</span>
                <DatePicker
                  showTime
                  value={unifiedReservation.scheduledTime ? dayjs(unifiedReservation.scheduledTime) : null}
                  onChange={(date, dateStr) =>
                    setUnifiedReservation((p) => ({
                      ...p,
                      scheduledTime: date && dateStr ? String(dateStr) : '',
                    }))
                  }
                  placeholder="选填，到时自动开放链接并群发通知"
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%', marginTop: 6 }}
                />
              </div>
              <div>
                <span style={{ fontSize: 13, color: '#374151' }}>群发通知标题</span>
                <Input
                  value={unifiedReservation.notificationTitle}
                  onChange={(e) =>
                    setUnifiedReservation((p) => ({ ...p, notificationTitle: e.target.value }))
                  }
                  placeholder={DEFAULT_NOTIFICATION_TITLE}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <span style={{ fontSize: 13, color: '#374151' }}>群发通知描述</span>
                <Input.TextArea
                  value={unifiedReservation.notificationMessage}
                  onChange={(e) =>
                    setUnifiedReservation((p) => ({ ...p, notificationMessage: e.target.value }))
                  }
                  placeholder={DEFAULT_NOTIFICATION_DESCRIPTION}
                  rows={3}
                  style={{ marginTop: 6, resize: 'vertical' }}
                />
                <NotificationPreview
                  title={unifiedReservation.notificationTitle}
                  message={unifiedReservation.notificationMessage}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))',
                gap: 24,
              }}
            >
              {/* 模板：各渠道单独配置下始终存在 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  minWidth: 0,
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FAFAFA',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: '#1F2937',
                    fontWeight: 600,
                    padding: '8px 12px',
                    margin: '-16px -16px 0 -16px',
                    borderRadius: '8px 8px 0 0',
                    borderLeft: '4px solid #1677FF',
                    backgroundColor: '#F0F5FF',
                  }}
                >
                  模板
                </div>
                <div>
                  <span style={{ fontSize: 13, color: '#374151' }}>预约定时（转为「获取」时间）</span>
                  <DatePicker
                    showTime
                    value={templateReservation.scheduledTime ? dayjs(templateReservation.scheduledTime) : null}
                    onChange={(date, dateStr) =>
                      setTemplateReservation((p) => ({
                        ...p,
                        scheduledTime: date && dateStr ? String(dateStr) : '',
                      }))
                    }
                    placeholder="选填，到时自动开放链接并群发通知"
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%', marginTop: 6 }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 13, color: '#374151' }}>群发通知标题</span>
                  <Input
                    value={templateReservation.notificationTitle}
                    onChange={(e) =>
                      setTemplateReservation((p) => ({ ...p, notificationTitle: e.target.value }))
                    }
                    placeholder={DEFAULT_NOTIFICATION_TITLE}
                    style={{ marginTop: 6 }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 13, color: '#374151' }}>群发通知描述</span>
                  <Input.TextArea
                    value={templateReservation.notificationMessage}
                    onChange={(e) =>
                      setTemplateReservation((p) => ({ ...p, notificationMessage: e.target.value }))
                    }
                    placeholder={DEFAULT_NOTIFICATION_DESCRIPTION}
                    rows={3}
                    style={{ marginTop: 6, resize: 'vertical' }}
                  />
                  <NotificationPreview
                    title={templateReservation.notificationTitle}
                    message={templateReservation.notificationMessage}
                  />
                </div>
              </div>

              {reservationChannels.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13, gridColumn: '1 / -1', alignSelf: 'start' }}>
                  当前无「预约」类型渠道，可先编辑上方模板，待添加预约渠道后可应用模板
                </p>
              ) : (
                reservationChannels.map((ch) => {
                  const applyTemplate = () => {
                    updateChannel(ch.id, {
                      scheduledTime: templateReservation.scheduledTime.trim() || undefined,
                      notificationTitle: templateReservation.notificationTitle.trim() || undefined,
                      notificationMessage: templateReservation.notificationMessage.trim() || undefined,
                    })
                    message.success(`已应用模板到「${ch.channelName}」`)
                  }
                  return (
                    <div
                      key={ch.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        minWidth: 0,
                        padding: 16,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FAFAFA',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          fontSize: 14,
                          color: '#1F2937',
                          fontWeight: 600,
                          padding: '8px 12px',
                          margin: '-16px -16px 0 -16px',
                          borderRadius: '8px 8px 0 0',
                          borderLeft: '4px solid #1677FF',
                          backgroundColor: '#F0F5FF',
                        }}
                      >
                        <span>{ch.channelName}</span>
                        <Tooltip title="应用模板">
                          <Button
                            type="text"
                            size="small"
                            icon={<ClipboardPaste size={14} />}
                            onClick={applyTemplate}
                            style={{ padding: '2px 6px', color: '#1677FF' }}
                          />
                        </Tooltip>
                      </div>
                      <div>
                        <span style={{ fontSize: 13, color: '#374151' }}>预约定时（转为「获取」时间）</span>
                        <DatePicker
                          showTime
                          value={ch.scheduledTime ? dayjs(ch.scheduledTime) : null}
                          onChange={(date, dateStr) =>
                            updateChannel(ch.id, {
                              scheduledTime: date && dateStr ? String(dateStr) : undefined,
                            })
                          }
                          placeholder="选填，到时自动开放链接并群发通知"
                          format="YYYY-MM-DD HH:mm"
                          style={{ width: '100%', marginTop: 6 }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: 13, color: '#374151' }}>群发通知标题</span>
                        <Input
                          value={ch.notificationTitle ?? ''}
                          onChange={(e) =>
                            updateChannel(ch.id, {
                              notificationTitle: e.target.value.trim() || undefined,
                            })
                          }
                          placeholder={DEFAULT_NOTIFICATION_TITLE}
                          style={{ marginTop: 6 }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: 13, color: '#374151' }}>群发通知描述</span>
                        <Input.TextArea
                          value={ch.notificationMessage ?? ''}
                          onChange={(e) =>
                            updateChannel(ch.id, {
                              notificationMessage: e.target.value.trim() || undefined,
                            })
                          }
                          placeholder={DEFAULT_NOTIFICATION_DESCRIPTION}
                          rows={3}
                          style={{ marginTop: 6, resize: 'vertical' }}
                        />
                        <NotificationPreview
                          title={ch.notificationTitle ?? ''}
                          message={ch.notificationMessage ?? ''}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. 预约人数（常驻：所有渠道均展示，不随按钮状态变化） */}
      <div style={cardStyle()}>
        <div style={cardHeaderStyle()}>
          <div>
            <h1 style={cardTitleStyle()}>预约人数</h1>
            <p style={cardDescStyle()}>查看各渠道已预约用户数量，可点击查看详情</p>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {channels.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>暂无渠道</p>
          ) : (
            <Table
              dataSource={channels}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '渠道', dataIndex: 'channelName', width: 140 },
                {
                  title: '预约人数',
                  width: 100,
                  render: (_: unknown, record: DownloadChannelConfig) => (
                    <span>{(record.reservedUsers?.length ?? 0)} 人</span>
                  ),
                },
                {
                  title: '操作',
                  width: 100,
                  render: (_: unknown, record: DownloadChannelConfig) => (
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0 }}
                      onClick={() => setReservedListChannelId(record.id)}
                    >
                      查看
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* 5. 操作人、操作时间 */}
      <div style={cardStyle()}>
        <div style={cardHeaderStyle()}>
          <Space size={24}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              操作人：<span style={{ color: '#1F2937' }}>{pageOperator}</span>
            </span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              操作时间：<span style={{ color: '#1F2937' }}>{pageUpdatedAt}</span>
            </span>
          </Space>
        </div>
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
          key={channels.map((c) => c.channelName).join(',')}
          existingChannelNames={channels.map((c) => c.channelName)}
          onOk={handleAddChannel}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>

      <EditChannelModal
        record={channels.find((c) => c.id === editingChannelId) ?? null}
        channels={channels}
        open={!!editingChannelId}
        onSave={handleEditChannelSave}
        onCancel={() => setEditingChannelId(null)}
      />

      <ReservedUsersModal
        channel={channels.find((c) => c.id === reservedListChannelId)}
        open={!!reservedListChannelId}
        onClose={() => setReservedListChannelId(null)}
      />
    </div>
  )
}

function EditChannelModal({
  record,
  channels,
  open,
  onSave,
  onCancel,
}: {
  record: DownloadChannelConfig | null
  channels: DownloadChannelConfig[]
  open: boolean
  onSave: (id: string, patch: { channelName: string; channelType?: 'Android' | 'ios' | 'PC' | '鸿蒙' | '鸿蒙'; buttonName: string; jumpLink: string }) => void
  onCancel: () => void
}) {
  const [channelName, setChannelName] = useState(record?.channelName ?? '')
  const [buttonName, setButtonName] = useState<'预约' | '获取'>((record?.buttonName ?? '获取') as '预约' | '获取')
  const [jumpLink, setJumpLink] = useState(record?.jumpLink ?? '')

  useEffect(() => {
    if (record && open) {
      setChannelName(record.channelName)
      setButtonName(record.buttonName as '预约' | '获取')
      setJumpLink(record.jumpLink ?? '')
    }
  }, [record, open])

  const usedByOthers = channels.filter((c) => c.id !== record?.id).map((c) => c.channelName)
  const channelOptions = CHANNEL_NAME_OPTIONS.filter(
    (n) => n === record?.channelName || !usedByOthers.includes(n)
  ).map((n) => ({ label: n, value: n }))

  const submit = () => {
    if (!record) return
    const name = channelName.trim()
    if (!name) {
      message.error('请选择渠道')
      return
    }
    if (buttonName === '获取' && !jumpLink.trim()) {
      message.error('类型为「获取」时请填写跳转链接')
      return
    }
    onSave(record.id, {
      channelName: name,
      channelType: getChannelType(name),
      buttonName,
      jumpLink: jumpLink.trim(),
    })
  }

  if (!record) return null

  return (
    <Modal
      title="编辑渠道"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={400}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <span style={{ fontSize: 13, color: '#374151' }}>渠道</span>
          <Select
            value={channelName || undefined}
            onChange={(v) => setChannelName(v)}
            options={channelOptions}
            style={{ width: '100%', marginTop: 6 }}
            placeholder="请选择渠道"
          />
        </div>
        <div>
          <span style={{ fontSize: 13, color: '#374151' }}>类型</span>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
            {channelName ? (CHANNEL_TYPE_MAP[channelName] ?? 'Android') : '—'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: 13, color: '#374151' }}>状态</span>
          <Select
            value={buttonName}
            onChange={(v) => setButtonName(v)}
            options={BUTTON_NAME_OPTIONS}
            style={{ width: '100%', marginTop: 6 }}
          />
        </div>
        <div>
          <span style={{ fontSize: 13, color: '#374151' }}>
            配置链接{buttonName === '预约' && '（选填，定时到达后开放）'}
          </span>
          <Input
            value={jumpLink}
            onChange={(e) => setJumpLink(e.target.value)}
            placeholder={buttonName === '预约' ? '选填' : 'https://...'}
            style={{ marginTop: 6 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={submit}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const PAGE_SIZE = 10

type SearchBy = 'id' | 'nickname'

const SEARCH_BY_OPTIONS: { label: string; value: SearchBy }[] = [
  { label: '用户 ID', value: 'id' },
  { label: '昵称', value: 'nickname' },
]

function highlightMatch(text: string, keyword: string): React.ReactNode {
  if (!keyword || !text) return text
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark
            key={i}
            style={{
              backgroundColor: '#FEF08A',
              padding: '0 1px',
              borderRadius: 2,
              color: 'inherit',
            }}
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

function ReservedUsersModal({
  channel,
  open,
  onClose,
}: {
  channel: DownloadChannelConfig | undefined
  open: boolean
  onClose: () => void
}) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchBy, setSearchBy] = useState<SearchBy>('id')
  const list = channel?.reservedUsers ?? []
  const keyword = searchKeyword.trim().toLowerCase()
  const filtered = !keyword
    ? list
    : list.filter((u) => {
        if (searchBy === 'id') return u.id.toLowerCase().includes(keyword)
        return u.nickname?.toLowerCase().includes(keyword)
      })

  useEffect(() => {
    if (open) {
      setSearchKeyword('')
      setSearchBy('id')
    }
  }, [open])

  const columns = [
    {
      title: '头像',
      width: 72,
      dataIndex: 'avatar',
      render: (_: unknown, record: ReservedUserInfo) => (
        <Avatar
          src={record.avatar}
          size={36}
          style={{ backgroundColor: record.avatar ? 'transparent' : '#E5E7EB' }}
        >
          {!record.avatar && (record.nickname?.slice(0, 1) || record.id.slice(-1)).toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: '昵称',
      width: 140,
      dataIndex: 'nickname',
      render: (_: unknown, record: ReservedUserInfo) => (
        <span style={{ fontSize: 13 }}>
          {keyword ? highlightMatch(record.nickname || '—', keyword) : record.nickname || '—'}
        </span>
      ),
    },
    {
      title: '用户 ID',
      dataIndex: 'id',
      ellipsis: true,
      render: (id: string) => (
        <span style={{ color: '#6B7280', fontSize: 13 }}>
          {keyword ? highlightMatch(id, keyword) : id}
        </span>
      ),
    },
  ]

  return (
    <Modal
      title={channel ? `已预约用户 - ${channel.channelName}` : '已预约用户'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnHidden
    >
      <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 12 }}>
        定时转为「获取」后将向以下用户群发通知（由用户在前台点击预约时记录）
      </p>
      <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
        <Select
          value={searchBy}
          onChange={(v) => setSearchBy(v)}
          options={SEARCH_BY_OPTIONS}
          style={{ width: 120 }}
        />
        <Input.Search
          placeholder={searchBy === 'id' ? '输入用户 ID' : '输入昵称'}
          allowClear
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={() => {}}
          style={{ flex: 1 }}
        />
      </Space.Compact>
      {list.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>暂无预约用户</p>
      ) : (
        <>
          <Table<ReservedUserInfo>
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 360 }}
            locale={{ emptyText: keyword ? '无匹配用户' : '暂无预约用户' }}
          />
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              共 {filtered.length} 人{keyword ? '（当前筛选）' : ''}
            </span>
          </div>
        </>
      )}
    </Modal>
  )
}

function AddChannelForm({
  existingChannelNames,
  onOk,
  onCancel,
}: {
  existingChannelNames: string[]
  onOk: (v: {
    channelName: string
    buttonName: string
    jumpLink: string
    scheduledTime?: string
    notificationTitle?: string
    notificationMessage?: string
  }) => void
  onCancel: () => void
}) {
  const availableOptions = CHANNEL_NAME_OPTIONS.filter((n) => !existingChannelNames.includes(n))
  const [channelName, setChannelName] = useState(availableOptions[0] ?? '')
  const [buttonName, setButtonName] = useState<'预约' | '获取'>('获取')
  const [jumpLink, setJumpLink] = useState('')

  const submit = () => {
    const name = channelName.trim()
    if (!name) {
      message.error('请选择渠道')
      return
    }
    if (buttonName === '获取' && !jumpLink.trim()) {
      message.error('类型为「获取」时请填写跳转链接')
      return
    }
    onOk({
      channelName: name,
      buttonName,
      jumpLink: jumpLink.trim(),
      scheduledTime: undefined,
      notificationTitle: undefined,
      notificationMessage: undefined,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>渠道</span>
        {availableOptions.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>所有渠道已添加完毕</p>
        ) : (
          <Select
            value={channelName || undefined}
            onChange={(v) => setChannelName(v)}
            options={availableOptions.map((n) => ({ label: n, value: n }))}
            style={{ width: '100%', marginTop: 6 }}
            placeholder="请选择渠道"
          />
        )}
      </div>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>类型</span>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
          {channelName ? (CHANNEL_TYPE_MAP[channelName] ?? 'Android') : '—'}
        </div>
      </div>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>状态</span>
        <Select
          value={buttonName}
          onChange={(v) => setButtonName(v)}
          options={BUTTON_NAME_OPTIONS}
          style={{ width: '100%', marginTop: 6 }}
        />
      </div>
      <div>
        <span style={{ fontSize: 13, color: '#374151' }}>
          跳转链接{buttonName === '预约' && '（选填，定时到达后开放）'}
        </span>
        <Input
          value={jumpLink}
          onChange={(e) => setJumpLink(e.target.value)}
          placeholder={buttonName === '预约' ? '选填' : 'https://...'}
          style={{ marginTop: 6 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={submit} disabled={availableOptions.length === 0}>
          确定
        </Button>
      </div>
    </div>
  )
}
