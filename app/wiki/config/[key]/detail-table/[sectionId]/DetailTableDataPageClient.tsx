'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Alert, Button } from 'antd'
import PageBreadcrumb from '../../../../../components/PageBreadcrumb'
import RichTableMockRowsEditor from '../../../../components/RichTableMockRowsEditor'
import { useWikiDetailStyleDraft } from '../../WikiDetailStyleDraft'
import type { LinkedTableSection, RichTableSection } from '../../../../components/DetailStylePreview'
import { useWikiFieldsRegistry } from '../../../WikiFieldsRegistry'
import { useWikiRelationsRegistry } from '../../../WikiRelationsRegistry'
import { WIKI_META, filterRichTableFieldKeys } from '../../../wikiFieldSeed'
import type { RichTableMockRow } from '../../../../utils/richTableMockData'
import { buildInitialRichMockRows } from '../../../../utils/richTableMockData'
import {
  normalizeLinkedTableColumnRefs,
  resolveLinkedColumnMeta,
} from '../../../../utils/linkedTableColumns'
import { relationDisplayName } from '../../../wikiRelationDefinitions'

export default function DetailTableDataPageClient({
  wikiKey,
  sectionId,
}: {
  wikiKey: string
  sectionId: string
}) {
  const wikiLabel = WIKI_META[wikiKey]?.label ?? wikiKey
  const { detail1Config, setDetail1Config } = useWikiDetailStyleDraft()
  const { fieldsByWiki } = useWikiFieldsRegistry()
  const { getRelation } = useWikiRelationsRegistry()
  const sortedFields = useMemo(() => {
    const list = fieldsByWiki[wikiKey] ?? []
    return [...list].sort((a, b) => a.order - b.order)
  }, [fieldsByWiki, wikiKey])

  const section = useMemo(
    () => detail1Config.middleSections.find((s) => s.id === sectionId),
    [detail1Config.middleSections, sectionId],
  )

  const updateSection = (patch: Partial<RichTableSection> | Partial<LinkedTableSection>) => {
    setDetail1Config((prev) => ({
      ...prev,
      middleSections: prev.middleSections.map((s) =>
        s.id === sectionId ? ({ ...s, ...patch } as typeof s) : s,
      ),
    }))
  }

  if (!section) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
        <PageBreadcrumb
          items={[
            { label: 'Wiki 管理', href: '/wiki' },
            { label: `${wikiLabel} 配置`, href: `/wiki/config/${wikiKey}` },
            { label: '表格数据' },
          ]}
        />
        <Alert
          type="warning"
          showIcon
          title="未找到该表格模块"
          description="可能已被删除，或链接已过期。请返回配置页重新打开「管理数据」。"
        />
        <Link href={`/wiki/config/${wikiKey}`}>
          <Button type="primary">返回配置</Button>
        </Link>
      </div>
    )
  }

  const configHref = `/wiki/config/${wikiKey}`

  if (section.kind === 'rich-table' || section.kind === 'linked-table') {
    const linkedRefs = section.kind === 'linked-table' ? normalizeLinkedTableColumnRefs(section) : []
    const rel =
      section.kind === 'linked-table' && section.relationKey
        ? getRelation(section.relationKey)
        : undefined
    const fieldKeys =
      section.kind === 'rich-table'
        ? filterRichTableFieldKeys(section.fieldKeys, sortedFields)
        : linkedRefs.map((ref) => {
            const home = wikiKey
            const resolvedWiki = ref.wikiKey && ref.wikiKey !== home ? ref.wikiKey : home
            const useRelMeta =
              rel && resolvedWiki === rel.targetSchemaId && rel.fields?.length
            return resolveLinkedColumnMeta(home, ref, fieldsByWiki, {
              relationFields: useRelMeta ? rel.fields : undefined,
              targetWikiKey: useRelMeta ? rel.targetSchemaId : undefined,
              relationDisplayLabel: rel ? relationDisplayName(rel) : undefined,
            }).cellKey
          })
    const colFields =
      section.kind === 'rich-table'
        ? fieldKeys.map((k) => {
            const f = sortedFields.find((x) => x.key === k)
            return { key: k, label: f?.label ?? k, type: f?.type ?? 'text' }
          })
        : linkedRefs.map((ref) => {
            const home = wikiKey
            const resolvedWiki = ref.wikiKey && ref.wikiKey !== home ? ref.wikiKey : home
            const useRelMeta =
              rel && resolvedWiki === rel.targetSchemaId && rel.fields?.length
            const meta = resolveLinkedColumnMeta(home, ref, fieldsByWiki, {
              relationFields: useRelMeta ? rel.fields : undefined,
              targetWikiKey: useRelMeta ? rel.targetSchemaId : undefined,
              relationDisplayLabel: rel ? relationDisplayName(rel) : undefined,
            })
            return { key: meta.cellKey, label: meta.label, type: meta.type }
          })
    const rows = section.mockRichRows ?? (fieldKeys.length > 0 ? buildInitialRichMockRows(fieldKeys) : [])
    const isLinked = section.kind === 'linked-table'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 20px 32px' }}>
        <PageBreadcrumb
          items={[
            { label: 'Wiki 管理', href: '/wiki' },
            { label: `${wikiLabel} 配置`, href: configHref },
            { label: `${section.title} · ${isLinked ? '关联表格数据' : '表格数据'}` },
          ]}
        />
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', padding: 20 }}>
          <RichTableMockRowsEditor
            fieldKeys={fieldKeys}
            colFields={colFields}
            rows={rows}
            onChange={(next: RichTableMockRow[]) => updateSection({ mockRichRows: next })}
          />
        </div>
      </div>
    )
  }

  return null
}
