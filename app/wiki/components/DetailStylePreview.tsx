'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { normalizeLinkedColumnKeys } from '../utils/linkedTableColumnOrder'

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
    description: '顶部图文主区域 + 富媒体/关联表格模块（可交叉排序）+ 右侧属性侧边栏',
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

/** 关联表格区域：列来自某「关联卡片」字段在「配置关联字段」中定义的子列 */
export interface LinkedTableSection {
  id: string
  title: string
  /** 父字段 WikiField.key（type 为 card-ref / card-ref-multi） */
  sourceFieldKey: string
  /** 选中的子列 fieldKey */
  columnKeys: string[]
}

/** 详情页主栏中部模块：富媒体表格与关联表格可任意交叉排序 */
export type DetailMiddleSection =
  | ({ kind: 'rich-table' } & RichTableSection)
  | ({ kind: 'linked-table' } & LinkedTableSection)

/** 详情样式1的完整配置 */
export interface Detail1Config {
  mainTitle: string
  mainFieldKeys: string[]
  /** 主区域与侧边栏之间的表格模块（富媒体 / 关联），顺序即前台展示顺序 */
  middleSections: DetailMiddleSection[]
  sideTitle: string
  sideFieldKeys: string[]
}

/** 兼容旧版 richTableSections + linkedTableSections（富媒体在前、关联在后） */
export function normalizeDetail1Config(
  config: Detail1Config & {
    richTableSections?: RichTableSection[]
    linkedTableSections?: LinkedTableSection[]
  },
): Detail1Config {
  const hasLegacy =
    (config.richTableSections && config.richTableSections.length > 0) ||
    (config.linkedTableSections && config.linkedTableSections.length > 0)
  if (config.middleSections && config.middleSections.length > 0) {
    const { richTableSections: _r, linkedTableSections: _l, ...rest } = config
    return { ...rest, middleSections: config.middleSections }
  }
  if (hasLegacy) {
    const rich = config.richTableSections ?? []
    const linked = config.linkedTableSections ?? []
    const middleSections: DetailMiddleSection[] = [
      ...rich.map((s) => ({ kind: 'rich-table' as const, ...s })),
      ...linked.map((s) => ({ kind: 'linked-table' as const, ...s })),
    ]
    const { richTableSections: _r, linkedTableSections: _l, ...rest } = config
    return { ...rest, middleSections }
  }
  return { ...config, middleSections: config.middleSections ?? [] }
}

/** 详情样式2的完整配置 */
export interface Detail2Config {
  mainFieldKeys: string[]
  sideTitle: string
  sideFieldKeys: string[]
}

interface CardRefCol {
  fieldKey: string
  label: string
  type: string
}

interface WikiField {
  key: string
  label: string
  type: string
  cardRefLinkedFields?: CardRefCol[]
}

/** 按用户勾选顺序（key 数组）排列字段，先勾选的列靠前 */
function wikiFieldsInKeyOrder(fields: WikiField[], keyOrder: string[]): WikiField[] {
  return keyOrder
    .map((k) => fields.find((f) => f.key === k))
    .filter((f): f is WikiField => f != null)
}

function cardRefColsInKeyOrder(linked: CardRefCol[], keyOrder: string[]): CardRefCol[] {
  return keyOrder
    .map((k) => linked.find((c) => c.fieldKey === k))
    .filter((c): c is CardRefCol => c != null)
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

/** 关联子表单元格 MOCK（按 fieldKey） */
const MOCK_LINKED_CELL: Record<string, string> = {
  id: '101',
  star_level: '5',
  star_cost: '同类卡×2',
  amount: '12',
  attr: '暴击 +3%',
  drop_item: '红色药水',
}
function mockLinkedCell(fieldKey: string): string {
  return MOCK_LINKED_CELL[fieldKey] ?? '—'
}

export default function DetailStylePreview({ style, fields, detail1Config, detail2Config }: Props) {
  // ── 详情样式 1 ──────────────────────────────────────────
  if (style === 'detail-1' && detail1Config) {
    const d1 = normalizeDetail1Config(detail1Config as Detail1Config & { richTableSections?: RichTableSection[]; linkedTableSections?: LinkedTableSection[] })
    const mainFields = wikiFieldsInKeyOrder(fields, d1.mainFieldKeys)
    const imageField = mainFields.find(f => f.type === 'single-image' || f.type === 'image-group')
    const textFields = mainFields.filter(f => f.type !== 'single-image' && f.type !== 'image-group')
    const sideFields = wikiFieldsInKeyOrder(fields, d1.sideFieldKeys)

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
                  {getValue('name') || d1.mainTitle}
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

          {/* 模块二：中部表格（富媒体 / 关联，顺序与配置一致） */}
          {d1.middleSections.map((section) => {
            if (section.kind === 'rich-table') {
              const sectionFields = wikiFieldsInKeyOrder(fields, section.fieldKeys)
              return (
                <div key={section.id} style={{
                  border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
                  background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    background: '#F3F4F6', padding: '8px 14px',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div style={{ width: 3, height: 14, background: '#D97706', borderRadius: 2 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{section.title}</span>
                  </div>
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
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${sectionFields.length}, 1fr)`,
                        padding: '0',
                      }}>
                        {sectionFields.map(f => (
                          <div key={f.key} style={{ padding: '8px 12px', fontSize: 12, color: '#374151' }}>
                            {f.type === 'single-image' || f.type === 'image-group' ? (
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
            }
            const parent = fields.find((f) => f.key === section.sourceFieldKey)
            const linked = parent?.cardRefLinkedFields ?? []
            const cols = cardRefColsInKeyOrder(linked, normalizeLinkedColumnKeys(section.columnKeys, linked))
            return (
              <div
                key={section.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    background: '#F3F4F6',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div style={{ width: 3, height: 14, background: '#D97706', borderRadius: 2 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{section.title}</span>
                </div>
                {cols.length > 0 ? (
                  <div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
                        borderBottom: '1px solid #E5E7EB',
                        background: '#FAFAFA',
                      }}
                    >
                      {cols.map((c) => (
                        <div
                          key={c.fieldKey}
                          style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280' }}
                        >
                          {c.label}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
                        padding: '0',
                      }}
                    >
                      {cols.map((c) => (
                        <div key={c.fieldKey} style={{ padding: '8px 12px', fontSize: 12, color: '#374151' }}>
                          {c.type === 'card-ref' ? (
                            <span style={{ color: '#1D4ED8', fontWeight: 500 }}>关联卡片</span>
                          ) : c.type === 'number' ? (
                            <span>{mockLinkedCell(c.fieldKey)}</span>
                          ) : (
                            <span>{mockLinkedCell(c.fieldKey)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: 12 }}>
                    {!section.sourceFieldKey
                      ? '请选择数据来源（关联卡片字段）'
                      : '暂无列配置，请在左侧勾选子列'}
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
                {d1.sideTitle || '道具信息'}
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
    const mainFields = wikiFieldsInKeyOrder(fields, detail2Config.mainFieldKeys)
    const imageField = mainFields.find(f => f.type === 'single-image' || f.type === 'image-group')
    const textFields = mainFields.filter(f => f.type !== 'single-image' && f.type !== 'image-group')
    const sideFields = wikiFieldsInKeyOrder(fields, detail2Config.sideFieldKeys)

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
