'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export type DetailStyle = 'detail-1' | 'detail-2'

export interface DetailStyleConfig {
  id: DetailStyle
  label: string
  description: string
  icon: string
}

export const DETAIL_STYLES: DetailStyleConfig[] = [
  {
    id: 'detail-1',
    label: '详情样式 1',
    description: '顶部图文主区域 + 多个富媒体表格区域 + 右侧属性侧边栏',
    icon: '📄',
  },
  {
    id: 'detail-2',
    label: '详情样式 2',
    description: '顶部大图标题 + 两列属性表格 + 右侧简洁侧边栏',
    icon: '📋',
  },
]

/** 富媒体表格区域配置 */
export interface RichTableSection {
  id: string
  title: string
  fieldKeys: string[]
}

/** 详情样式1的完整配置 */
export interface Detail1Config {
  mainTitle: string
  mainFieldKeys: string[]
  richTableSections: RichTableSection[]
  sideTitle: string
  sideFieldKeys: string[]
}

/** 详情样式2的完整配置 */
export interface Detail2Config {
  mainFieldKeys: string[]
  sideTitle: string
  sideFieldKeys: string[]
}

interface WikiField {
  key: string
  label: string
  type: string
}

interface Props {
  style: DetailStyle
  fields: WikiField[]
  detail1Config?: Detail1Config
  detail2Config?: Detail2Config
}

// Mock detail data
const MOCK_DETAIL: Record<string, unknown> = {
  icon: '🃏',
  name: '龙蝇卡片',
  subname: 'Dragon_Fly_Card',
  id: 4179,
  description: 'AGI+1',
  set_effect: '装备苍蝇卡片时，FLEE+19',
  type: '卡片',
  equip: '披肩',
  slots: 0,
  tradeable: true,
  storable: true,
  guild_storage: false,
  atk: '120~150',
  def: 45,
  element: '风',
  race: '昆虫',
  level: 47,
  drop_rate: '0.11%',
  job: '全职业',
}

const getValue = (key: string): string => {
  const v = MOCK_DETAIL[key]
  if (v === undefined) return '—'
  if (typeof v === 'boolean') return v ? '✓' : '✗'
  return String(v)
}

export default function DetailStylePreview({ style, fields, detail1Config, detail2Config }: Props) {
  // ── 详情样式 1 ──────────────────────────────────────────
  if (style === 'detail-1' && detail1Config) {
    const mainFields = fields.filter(f => detail1Config.mainFieldKeys.includes(f.key))
    const imageField = mainFields.find(f => f.type === 'image')
    const textFields = mainFields.filter(f => f.type !== 'image')
    const sideFields = fields.filter(f => detail1Config.sideFieldKeys.includes(f.key))

    return (
      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        {/* 左侧主区域 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 模块一：主区域 */}
          <div style={{
            border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {imageField && (
                <div style={{
                  width: 72, height: 72, flexShrink: 0,
                  background: '#F3F4F6', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                  border: '1px solid #E5E7EB',
                }}>
                  {getValue(imageField.key)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>
                  {getValue('name') || detail1Config.mainTitle}
                </div>
                {textFields.map(f => (
                  <div key={f.key} style={{ display: 'flex', gap: 8, lineHeight: 1.8, fontSize: 12 }}>
                    <span style={{ color: '#9CA3AF', minWidth: 48, flexShrink: 0 }}>{f.label}</span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{getValue(f.key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 模块二：富媒体表格区域 */}
          {detail1Config.richTableSections.map(section => {
            const sectionFields = fields.filter(f => section.fieldKeys.includes(f.key))
            return (
              <div key={section.id} style={{
                border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                {/* 区域标题 */}
                <div style={{
                  background: '#F3F4F6', padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 3, height: 14, background: '#D97706', borderRadius: 2 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{section.title}</span>
                </div>
                {/* 表格表头 */}
                {sectionFields.length > 0 ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${sectionFields.length}, 1fr)`,
                      borderBottom: '1px solid #E5E7EB',
                      background: '#FAFAFA',
                    }}>
                      {sectionFields.map(f => (
                        <div key={f.key} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
                          {f.label}
                        </div>
                      ))}
                    </div>
                    {/* 表格数据行（mock） */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${sectionFields.length}, 1fr)`,
                      padding: '0',
                    }}>
                      {sectionFields.map(f => (
                        <div key={f.key} style={{ padding: '8px 12px', fontSize: 12, color: '#374151' }}>
                          {f.type === 'image' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 16 }}>📦</span>
                              <span>神秘箱子</span>
                            </span>
                          ) : f.type === 'number' ? (
                            <span>{f.key === 'drop_rate' ? <span style={{ color: '#DC2626', fontWeight: 500 }}>0.11%</span> : '47'}</span>
                          ) : (
                            <span>{getValue(f.key) || '—'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: 12 }}>
                    暂无字段配置
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 右侧侧边栏 */}
        {sideFields.length > 0 && (
          <div style={{ width: 150, flexShrink: 0 }}>
            <div style={{
              border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
              background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                {detail1Config.sideTitle || '道具信息'}
              </div>
              {sideFields.map((f, i) => {
                const raw = MOCK_DETAIL[f.key]
                const isBool = typeof raw === 'boolean'
                return (
                  <div key={f.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 12px',
                    borderBottom: i < sideFields.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    <span style={{ color: '#6B7280', fontSize: 12 }}>{f.label}</span>
                    {isBool
                      ? (raw
                        ? <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                        : <XCircle size={14} style={{ color: '#EF4444' }} />)
                      : <span style={{ color: '#1F2937', fontWeight: 500, fontSize: 12 }}>{getValue(f.key)}</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── 详情样式 2 ──────────────────────────────────────────
  if (style === 'detail-2' && detail2Config) {
    const mainFields = fields.filter(f => detail2Config.mainFieldKeys.includes(f.key))
    const imageField = mainFields.find(f => f.type === 'image')
    const textFields = mainFields.filter(f => f.type !== 'image')
    const sideFields = fields.filter(f => detail2Config.sideFieldKeys.includes(f.key))

    const colFields = textFields.slice(0, 8)
    const leftFields = colFields.filter((_, i) => i % 2 === 0)
    const rightFields = colFields.filter((_, i) => i % 2 === 1)

    return (
      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        {/* 左侧主区域 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 顶部大图标题 */}
          <div style={{
            border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
          }}>
            {imageField && (
              <div style={{
                width: 52, height: 52, flexShrink: 0,
                background: '#F3F4F6', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>
                {getValue(imageField.key)}
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
              {getValue('name') || '—'}
            </div>
          </div>

          {/* 两列属性表格 */}
          {colFields.length > 0 && (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              {Array.from({ length: Math.max(leftFields.length, rightFields.length) }).map((_, rowIdx) => {
                const lf = leftFields[rowIdx]
                const rf = rightFields[rowIdx]
                const isLastOdd = lf && !rf
                const rowCount = Math.max(leftFields.length, rightFields.length)
                return (
                  <div key={rowIdx} style={{
                    display: 'grid',
                    gridTemplateColumns: isLastOdd ? '1fr' : '1fr 1fr',
                    borderBottom: rowIdx < rowCount - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    {isLastOdd ? (
                      <div style={{ display: 'flex', gap: 8, padding: '7px 12px' }}>
                        <span style={{ color: '#9CA3AF', minWidth: 48 }}>{lf.label}</span>
                        <span style={{ color: '#1F2937', fontWeight: 600 }}>{getValue(lf.key)}</span>
                      </div>
                    ) : (
                      [lf, rf].map((f, colIdx) => (
                        <div key={colIdx} style={{
                          display: 'flex', gap: 8, padding: '7px 12px',
                          borderRight: colIdx === 0 ? '1px solid #F3F4F6' : 'none',
                        }}>
                          {f ? (
                            <>
                              <span style={{ color: '#9CA3AF', minWidth: 48 }}>{f.label}</span>
                              <span style={{ color: '#1F2937', fontWeight: 600 }}>{getValue(f.key)}</span>
                            </>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 右侧侧边栏 */}
        {sideFields.length > 0 && (
          <div style={{ width: 130, flexShrink: 0 }}>
            <div style={{
              border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#fff',
            }}>
              <div style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                {detail2Config.sideTitle || '道具信息'}
              </div>
              {sideFields.map((f, i) => {
                const raw = MOCK_DETAIL[f.key]
                const isBool = typeof raw === 'boolean'
                return (
                  <div key={f.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 10px',
                    borderBottom: i < sideFields.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    <span style={{ color: '#6B7280', fontSize: 11 }}>{f.label}</span>
                    {isBool
                      ? (raw
                        ? <CheckCircle2 size={12} style={{ color: '#10B981' }} />
                        : <XCircle size={12} style={{ color: '#EF4444' }} />)
                      : <span style={{ color: '#1F2937', fontWeight: 600, fontSize: 11 }}>{getValue(f.key)}</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
