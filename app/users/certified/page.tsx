'use client'

import React, { useState } from 'react'
import { Table, Input, Select, Button, Tag, message, Modal, Form } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Copy, RefreshCw, Settings, UserPlus, UserCircle } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'

// Mock 论坛列表
const MOCK_FORUMS = [
  { id: 'rox', name: '仙境传说3' },
  { id: 'yjyj', name: '永劫无间' },
  { id: 'ys', name: '原神' },
  { id: 'wzry', name: '王者荣耀' },
  { id: 'hpjy', name: '和平精英' },
  { id: 'bhxq', name: '崩坏：星穹铁道' },
]

// 认证类型选项
const CERT_TYPE_OPTIONS = [
  { label: '创作者', value: 'creator' },
  { label: '官方', value: 'official' },
]

// Mock 认证账号数据（含官方 + 创作者，分布在不同论坛；同一创作者可关联多个论坛）
const MOCK_CERTIFIED = [
  // 仙境传说3
  { id: '1153171', nickname: 'Kafra Ops Cat', certType: 'official' as const, forumId: 'rox', forumName: '仙境传说3', fans: 0, likes: 0, posts: 0 },
  { id: '1153170', nickname: 'RO3_YU', certType: 'official' as const, forumId: 'rox', forumName: '仙境传说3', fans: 0, likes: 0, posts: 0 },
  { id: '1153168', nickname: 'Ragnarok Online 3', certType: 'official' as const, forumId: 'rox', forumName: '仙境传说3', fans: 5, likes: 9, posts: 0 },
  { id: '1153165', nickname: '仙境传说官方', certType: 'official' as const, forumId: 'rox', forumName: '仙境传说3', fans: 120, likes: 56, posts: 12 },
  { id: '1153160', nickname: 'ROX 运营组', certType: 'official' as const, forumId: 'rox', forumName: '仙境传说3', fans: 89, likes: 34, posts: 8 },
  { id: '1153155', nickname: '攻略达人小明', certType: 'creator' as const, forumId: 'rox', forumName: '仙境传说3', fans: 1250, likes: 320, posts: 42 },
  { id: '1153205', nickname: '攻略达人小明', certType: 'creator' as const, forumId: 'yjyj', forumName: '永劫无间', fans: 1250, likes: 320, posts: 42 },
  { id: '1153152', nickname: '游戏解说阿杰', certType: 'creator' as const, forumId: 'rox', forumName: '仙境传说3', fans: 890, likes: 180, posts: 28 },
  { id: '1153148', nickname: 'ROX 攻略组', certType: 'creator' as const, forumId: 'rox', forumName: '仙境传说3', fans: 2100, likes: 560, posts: 68 },
  // 永劫无间
  { id: '1153201', nickname: '永劫无间官方', certType: 'official' as const, forumId: 'yjyj', forumName: '永劫无间', fans: 230, likes: 89, posts: 15 },
  { id: '1153202', nickname: 'YJ 运营', certType: 'official' as const, forumId: 'yjyj', forumName: '永劫无间', fans: 56, likes: 12, posts: 3 },
  { id: '1153203', nickname: '永劫攻略君', certType: 'creator' as const, forumId: 'yjyj', forumName: '永劫无间', fans: 3400, likes: 890, posts: 125 },
  { id: '1153204', nickname: '刀法教学', certType: 'creator' as const, forumId: 'yjyj', forumName: '永劫无间', fans: 2100, likes: 456, posts: 68 },
  // 原神
  { id: '1153301', nickname: '原神官方', certType: 'official' as const, forumId: 'ys', forumName: '原神', fans: 5200, likes: 1200, posts: 89 },
  { id: '1153302', nickname: '提瓦特小助手', certType: 'official' as const, forumId: 'ys', forumName: '原神', fans: 890, likes: 234, posts: 22 },
  { id: '1153303', nickname: '原神攻略组', certType: 'creator' as const, forumId: 'ys', forumName: '原神', fans: 6800, likes: 2100, posts: 256 },
  { id: '1153304', nickname: '抽卡玄学', certType: 'creator' as const, forumId: 'ys', forumName: '原神', fans: 4200, likes: 980, posts: 89 },
  // 王者荣耀
  { id: '1153401', nickname: '王者荣耀官方', certType: 'official' as const, forumId: 'wzry', forumName: '王者荣耀', fans: 12000, likes: 3500, posts: 156 },
  { id: '1153402', nickname: '峡谷小助手', certType: 'official' as const, forumId: 'wzry', forumName: '王者荣耀', fans: 2300, likes: 567, posts: 45 },
  { id: '1153403', nickname: '上分攻略王', certType: 'creator' as const, forumId: 'wzry', forumName: '王者荣耀', fans: 5600, likes: 1200, posts: 189 },
  { id: '1153404', nickname: '英雄解析', certType: 'creator' as const, forumId: 'wzry', forumName: '王者荣耀', fans: 4100, likes: 890, posts: 112 },
  // 和平精英
  { id: '1153501', nickname: '和平精英官方', certType: 'official' as const, forumId: 'hpjy', forumName: '和平精英', fans: 8900, likes: 2100, posts: 98 },
  { id: '1153502', nickname: '吃鸡小课堂', certType: 'creator' as const, forumId: 'hpjy', forumName: '和平精英', fans: 3200, likes: 756, posts: 78 },
  { id: '1153503', nickname: '战术大师', certType: 'creator' as const, forumId: 'hpjy', forumName: '和平精英', fans: 2800, likes: 634, posts: 56 },
  // 崩坏：星穹铁道
  { id: '1153601', nickname: '星穹铁道官方', certType: 'official' as const, forumId: 'bhxq', forumName: '崩坏：星穹铁道', fans: 4500, likes: 1100, posts: 67 },
  { id: '1153602', nickname: '开拓者指南', certType: 'creator' as const, forumId: 'bhxq', forumName: '崩坏：星穹铁道', fans: 3900, likes: 890, posts: 134 },
  { id: '1153603', nickname: '角色攻略组', certType: 'creator' as const, forumId: 'bhxq', forumName: '崩坏：星穹铁道', fans: 2700, likes: 567, posts: 89 },
]

export default function CertifiedAccountsPage() {
  const [forumId, setForumId] = useState<string | undefined>(undefined)
  const [userId, setUserId] = useState('')
  const [certModalOpen, setCertModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const certType = Form.useWatch('certType', form)

  const handleCertConfirm = () => {
    form.validateFields().then((values) => {
      const msg = values.certType === 'creator'
        ? `已提交认证：用户 ${values.certUserId}，类型 创作者，论坛 ${MOCK_FORUMS.find((f) => f.id === values.certForumId)?.name ?? values.certForumId}`
        : `已提交认证：用户 ${values.certUserId}，类型 官方`
      messageApi.success(msg)
      setCertModalOpen(false)
      form.resetFields()
    })
  }

  const handleCertTypeChange = (val: string) => {
    if (val === 'creator') {
      form.setFieldValue('certForumId', forumId ?? MOCK_FORUMS[0]?.id)
    } else {
      form.setFieldValue('certForumId', undefined)
    }
  }

  const handleReset = () => {
    setForumId(undefined)
    setUserId('')
  }

  const handleQuery = () => {
    messageApi.info('查询功能开发中')
  }

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id)
    messageApi.success('已复制用户ID')
  }

  const filtered = MOCK_CERTIFIED.filter((c) => {
    if (forumId && c.forumId !== forumId) return false
    if (userId.trim() && !c.id.includes(userId.trim())) return false
    return true
  })

  const columns: ColumnsType<(typeof MOCK_CERTIFIED)[0]> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (v: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {v}
          <button
            type="button"
            onClick={() => copyUserId(v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF', display: 'flex' }}
            title="复制"
          >
            <Copy size={14} />
          </button>
        </span>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 180,
      render: (v: string, record) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
              flexShrink: 0,
            }}
          />
          {v}
        </span>
      ),
    },
    {
      title: '认证类型',
      dataIndex: 'certType',
      key: 'certType',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'official' ? 'orange' : 'blue'}>{v === 'official' ? '官方' : '创作者'}</Tag>
      ),
    },
    { title: '关联论坛', dataIndex: 'forumName', key: 'forumName', width: 110 },
    { title: '粉丝数', dataIndex: 'fans', key: 'fans', width: 90 },
    { title: '获赞数', dataIndex: 'likes', key: 'likes', width: 90 },
    { title: '帖子数', dataIndex: 'posts', key: 'posts', width: 90 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => {
        const isCreator = record.certType === 'creator'
        const disabledStyle = { fontSize: 13, color: '#9CA3AF', cursor: 'not-allowed' }
        const enabledStyle = { fontSize: 13, color: '#1677FF' }
        return (
          <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isCreator ? (
              <>
                <span style={disabledStyle}>编辑</span>
                <span style={disabledStyle}>快速发帖</span>
                <span style={disabledStyle}>快捷登录</span>
              </>
            ) : (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); messageApi.info('编辑') }} style={enabledStyle}>编辑</a>
                <a href="#" onClick={(e) => { e.preventDefault(); messageApi.info('快速发帖') }} style={enabledStyle}>快速发帖</a>
                <a href="#" onClick={(e) => { e.preventDefault(); messageApi.info('快捷登录') }} style={enabledStyle}>快捷登录</a>
              </>
            )}
            <a href="#" onClick={(e) => { e.preventDefault(); messageApi.info('移除认证') }} style={{ fontSize: 13, color: '#EF4444' }}>移除认证</a>
          </span>
        )
      },
    },
  ]

  return (
    <>
      {contextHolder}
      <PageBreadcrumb items={[{ label: '用户管理', href: '/users' }, { label: '认证账号' }]} />

      {/* 筛选区域 - 浅灰背景 */}
      <div
        style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>论坛：</span>
          <Select
            value={forumId}
            onChange={setForumId}
            style={{ width: 180 }}
            placeholder="请选择论坛"
            allowClear
            options={MOCK_FORUMS.map((f) => ({ label: f.name, value: f.id }))}
          />
          <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>用户ID：</span>
          <Input
            placeholder="请输入用户ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: 160 }}
            allowClear
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" onClick={handleQuery}>查询</Button>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>认证账号</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button type="primary" icon={<UserPlus size={14} />} onClick={() => setCertModalOpen(true)}>
              认证用户
            </Button>
            <Button type="primary" icon={<UserCircle size={14} />} onClick={() => messageApi.info('新增官方账号功能开发中')}>
              新增官方账号
            </Button>
            <Button type="text" icon={<RefreshCw size={14} />} onClick={() => messageApi.info('刷新')} />
            <Button type="text" icon={<Settings size={14} />} onClick={() => messageApi.info('设置')} />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `第1-${Math.min(10, t)}条/总共${t}条`,
          }}
        />
      </div>

      <Modal
        title="认证用户"
        open={certModalOpen}
        onCancel={() => { setCertModalOpen(false); form.resetFields() }}
        onOk={handleCertConfirm}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="certUserId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户ID" />
          </Form.Item>
          <Form.Item
            name="certType"
            label="认证类型"
            rules={[{ required: true, message: '请选择认证类型' }]}
          >
            <Select placeholder="请选择认证类型" options={CERT_TYPE_OPTIONS} onChange={handleCertTypeChange} />
          </Form.Item>
          {certType === 'creator' && (
            <Form.Item
              name="certForumId"
              label="关联论坛"
              rules={[{ required: true, message: '请选择关联论坛' }]}
            >
              <Select
                placeholder="请选择关联论坛"
                options={MOCK_FORUMS.map((f) => ({ label: f.name, value: f.id }))}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}
