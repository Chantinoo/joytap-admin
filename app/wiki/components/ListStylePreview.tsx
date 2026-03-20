'use client'

import React from 'react'
import { Tag } from 'antd'

export type ListStyle = 'card-list' | 'card-grid' | 'rich-table' | 'image-card'

export interface StyleConfig {
  id: ListStyle
  label: string
  description: string
  /** 最多可选字段总数（含图片字段） */
  maxFields: number
  allowedTypes: string[]
  icon: string
  /** 是否必须选一个 image 字段 */
  requireImage?: boolean
  /** 文本/数字字段最少数量 */
  minTextFields?: number
  /** 文本/数字字段最多数量 */
  maxTextFields?: number
}

export const LIST_STYLES: StyleConfig[] = [
  {
    id: 'card-list',
    label: '横向卡片列表',
    description: '图片必选 + 1~4 个文本/数值字段，适合道具、怪物等',
    maxFields: 5,
    allowedTypes: ['single-image', 'text', 'number', 'select'],
    icon: '📄',
    requireImage: true,
    minTextFields: 1,
    maxTextFields: 4,
  },
  {
    id: 'card-grid',
    label: '大图卡片宫格',
    description: '图片必选 + 最多 1 个文本/数值字段，适合卡片、宠物等',
    maxFields: 2,
    allowedTypes: ['single-image', 'text', 'number'],
    icon: '🃏',
    requireImage: true,
    maxTextFields: 1,
  },
  {
    id: 'rich-table',
    label: '富媒体表格',
    description: '图文混排表格，单元格支持多行内容，适合配方、套装等复杂数据',
    maxFields: 8,
    allowedTypes: ['text', 'rich-text', 'number', 'single-image', 'image-group', 'select', 'switch', 'card-ref', 'card-ref-multi'],
    icon: '📋',
  },
  {
    id: 'image-card',
    label: '图片卡片',
    description: '图片必选 + 最多 2 个文本/数值字段，适合地图、场景等以图为主的内容',
    maxFields: 3,
    allowedTypes: ['single-image', 'text', 'number'],
    icon: '🗺️',
    requireImage: true,
    maxTextFields: 2,
  },
]

interface WikiField {
  key: string
  label: string
  type: string
  listDisplay: boolean
}

interface MockItem {
  [key: string]: unknown
}

// rich-table 类型字段的值格式：{ label, items: [{icon, name}] }
export interface RichTableCell {
  label: string
  items: { icon: string; name: string }[]
}

const MOCK_DATA: MockItem[] = [
  {
    icon: '🧪', id: 501,  name: '红色药水', type: '消耗', weight: 30,  price: 50,
    description: '恢复 45~65 HP 的回复药水，由红色草药制成。', slots: 0, job: '全职业',
    set_parts: { label: '套装组成', items: [{ icon: '🃏', name: '龙蝇卡片' }, { icon: '🃏', name: '苍蝇卡片' }] },
  },
  {
    icon: '⚔️', id: 1201, name: '长剑',     type: '武器', weight: 80,  price: 500,
    description: '标准的单手长剑，剑士系职业常用武器。',         slots: 2, job: '剑士系',
    set_parts: { label: '套装组成', items: [{ icon: '🃏', name: '骑士卡片' }, { icon: '🃏', name: '守卫卡片' }, { icon: '🃏', name: '战士卡片' }] },
  },
  {
    icon: '🛡️', id: 2101, name: '皮甲',     type: '防具', weight: 100, price: 300,
    description: '由皮革制成的轻型护甲，适合初学者使用。',       slots: 1, job: '全职业',
    set_parts: { label: '套装组成', items: [{ icon: '🃏', name: '波利卡片' }] },
  },
  {
    icon: '🗡️', id: 1101, name: '匕首',     type: '武器', weight: 50,  price: 100,
    description: '小型匕首，攻击速度快，适合盗贼系职业。',       slots: 3, job: '全职业',
    set_parts: { label: '套装组成', items: [] },
  },
  {
    icon: '🏹', id: 1701, name: '弓',       type: '武器', weight: 60,  price: 200,
    description: '基础的远程武器，适合弓箭手系职业。',           slots: 1, job: '弓箭手系',
    set_parts: { label: '套装组成', items: [{ icon: '🃏', name: '猎人卡片' }] },
  },
  {
    icon: '📖', id: 1601, name: '魔法书',   type: '武器', weight: 40,  price: 350,
    description: '蕴含魔力的书籍，法师系职业的常用武器。',       slots: 2, job: '法师系',
    set_parts: { label: '套装组成', items: [{ icon: '🃏', name: '贤者卡片' }, { icon: '🃏', name: '巫师卡片' }] },
  },
]

interface Props {
  style: ListStyle
  fields: WikiField[]
  selectedFieldKeys: string[]
}

export default function ListStylePreview({ style, fields, selectedFieldKeys }: Props) {
  const displayFields = fields.filter(f => selectedFieldKeys.includes(f.key))

  // ── 1. 横向卡片列表（card-list）────────────────────────────
  // 一行四个卡片，图片在左，右侧每个字段独占一行
  if (style === 'card-list') {
    const imageField = displayFields.find(f => f.type === 'single-image' || f.type === 'image-group')
    const textFields = displayFields.filter(f => f.type !== 'image').slice(0, 4)
    // 第一个文本字段作为主标题，其余作为属性行
    const [titleField, ...attrFields] = textFields

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {MOCK_DATA.slice(0, 4).map((row, i) => (
          <div key={i} style={{
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            {/* 左侧图片 */}
            {imageField ? (
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                background: '#F3F4F6', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {row[imageField.key] as string}
              </div>
            ) : (
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                background: '#F3F4F6', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#D1D5DB',
              }}>
                📷
              </div>
            )}
            {/* 右侧内容：每个字段独占一行 */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {titleField && (
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#1F2937',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {String(row[titleField.key] ?? '—')}
                </div>
              )}
              {attrFields.map(f => (
                <div key={f.key} style={{
                  fontSize: 12, color: '#6B7280',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {String(row[f.key] ?? '—')}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── 2. 大图卡片宫格（card-grid）────────────────────────────
  // 参考截图2：全图占满卡片主体，底部名称
  if (style === 'card-grid') {
    const iconField = displayFields.find(f => f.type === 'single-image' || f.type === 'image-group')
    const nameField = displayFields.find(f => f.key === 'name')

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {MOCK_DATA.slice(0, 6).map((row, i) => (
          <div key={i} style={{
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {/* 大图区域 */}
            <div style={{
              height: 100,
              background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48,
              borderBottom: '1px solid #F3F4F6',
            }}>
              {iconField ? (row[iconField.key] as string) : '🖼️'}
            </div>
            {/* 名称 */}
            <div style={{ padding: '8px 10px' }}>
              {nameField && (
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'center' }}>
                  {row[nameField.key] as string}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── 3. 富媒体表格（rich-table）─────────────────────────────
  // 参考截图3：标准表格但单元格内可图文混排、支持多行
  if (style === 'rich-table') {
    // 找出图片类字段和非图片字段
    const colFields = displayFields.slice(0, 6)

    return (
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', fontSize: 12 }}>
        {/* 表头 */}
        <div style={{
          background: '#F3F4F6',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
        }}>
          {colFields.map(f => (
            <div key={f.key} style={{
              flex: f.key === 'name' || f.key === 'description' ? 2 : 1,
              padding: '8px 10px',
              fontWeight: 600,
              color: '#6B7280',
              fontSize: 12,
              minWidth: 0,
            }}>
              {f.label}
            </div>
          ))}
        </div>
        {/* 数据行 */}
        {MOCK_DATA.slice(0, 3).map((row, i) => (
          <div key={i} style={{
            display: 'flex',
            borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none',
            background: '#fff',
            alignItems: 'flex-start',
          }}>
            {colFields.map(f => (
              <div key={f.key} style={{
                flex: f.key === 'name' || f.key === 'description' ? 2 : 1,
                padding: '8px 10px',
                color: '#374151',
                minWidth: 0,
                wordBreak: 'break-word',
                whiteSpace: f.key === 'description' ? 'normal' : 'nowrap',
                overflow: f.key === 'description' ? 'visible' : 'hidden',
                textOverflow: f.key === 'description' ? 'unset' : 'ellipsis',
              }}>
                {f.type === 'card-ref' || f.type === 'card-ref-multi' ? (
                  (() => {
                    const cell = row[f.key] as RichTableCell | undefined
                    if (!cell || cell.items.length === 0) return <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {cell.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 15 }}>{item.icon}</span>
                            <span style={{ fontSize: 12, color: '#374151' }}>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()
                ) : f.type === 'single-image' || f.type === 'image-group' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{row[f.key] as string}</span>
                  </div>
                ) : f.type === 'select' || f.type === 'switch' ? (
                  <Tag style={{ fontSize: 11, padding: '0 4px' }}>{row[f.key] as string}</Tag>
                ) : (
                  <span style={{ fontSize: 12 }}>{String(row[f.key] ?? '—')}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── 4. 图片卡片（image-card）───────────────────────────────
  // 图片必选（主体），下方最多 2 个文本/数字字段
  if (style === 'image-card') {
    const imageField = displayFields.find(f => f.type === 'single-image' || f.type === 'image-group')
    const textFields = displayFields.filter(f => f.type !== 'image').slice(0, 2)
    const [titleField, subField] = textFields

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {MOCK_DATA.slice(0, 5).map((row, i) => (
          <div key={i} style={{
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {/* 图片主体 */}
            <div style={{
              height: 80,
              background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
            }}>
              {imageField ? (row[imageField.key] as string) : '🗺️'}
            </div>
            {/* 下方文字 */}
            {(titleField || subField) && (
              <div style={{ padding: '6px 8px 8px' }}>
                {titleField && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', lineHeight: 1.3 }}>
                    {String(row[titleField.key] ?? '—')}
                  </div>
                )}
                {subField && (
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {subField.label}: {String(row[subField.key] ?? '—')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return null
}
