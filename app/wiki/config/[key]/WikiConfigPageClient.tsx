'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Table, Button, Tag, Space, Input, Select, Modal, Form,
  Tooltip, Popconfirm, message, Checkbox, Drawer,
} from 'antd'
import { Plus, Edit2, Trash2, Languages, ChevronUp, ChevronDown, Table2, X } from 'lucide-react'
import PageBreadcrumb from '../../../components/PageBreadcrumb'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from '../../components/FieldI18nModal'
import FieldI18nEditor from '../../components/FieldI18nEditor'
import ListStylePreview, { LIST_STYLES, type ListStyle } from '../../components/ListStylePreview'
import DetailStylePreview, { DETAIL_STYLES, type DetailStyle, type RichTableSection, type LinkedTableSection, type DetailMiddleSection } from '../../components/DetailStylePreview'
import {
  normalizeLinkedTableColumnRefs,
  linkedSectionHasColumns,
  toggleLinkedLocalColumn,
  appendLinkedRemoteColumn,
  removeLinkedRemoteColumn,
  resolveLinkedColumnMeta,
} from '../../utils/linkedTableColumns'
import { useWikiDetailStyleDraft } from './WikiDetailStyleDraft'
import {
  type FieldType,
  type WikiField,
  type WikiSelectOption,
  DEFAULT_CARD_REF_LINKED_FIELDS,
  fieldTypeColors,
  fieldTypeLabels,
  WIKI_META,
  WIKI_RELATION_OPTIONS,
  isCardRefFieldType,
  filterRichTableFieldKeys,
} from '../wikiFieldSeed'
import { useWikiFieldsRegistry } from '../WikiFieldsRegistry'

function normalizeSelectOptions(raw: unknown): WikiSelectOption[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item, i) => {
    if (typeof item === 'string') {
      return { id: `opt_mig_${i}_${encodeURIComponent(item).replace(/%/g, '')}`, i18n: { zh: item } }
    }
    const o = item as WikiSelectOption
    if (o?.id && o.i18n && typeof o.i18n === 'object') return o
    return { id: `opt_mig_${i}_${String(item)}`, i18n: { zh: String(item) } }
  })
}

function selectOptionLabel(opt: WikiSelectOption): string {
  return opt.i18n.zh?.trim() || LANGUAGES.map(l => opt.i18n[l.code]).find(Boolean) || '（未命名）'
}

/** 避免 `?? []` 每次渲染新数组，导致依赖 `fields` 的 effect 死循环或卡死 */
const EMPTY_WIKI_FIELDS: WikiField[] = []

export default function WikiConfigPageClient({ wikiKey }: { wikiKey: string }) {
  const meta = WIKI_META[wikiKey]
  const wikiLabel = meta?.label ?? wikiKey

  const { fieldsByWiki, updateWiki, batchUpdate } = useWikiFieldsRegistry()
  const {
    selectedDetailStyle,
    setSelectedDetailStyle,
    detail1Config,
    setDetail1Config,
    detail2Config,
    setDetail2Config,
  } = useWikiDetailStyleDraft()
  const fields = useMemo(
    () => fieldsByWiki[wikiKey] ?? EMPTY_WIKI_FIELDS,
    [fieldsByWiki, wikiKey],
  )
  const setFields = (updater: React.SetStateAction<WikiField[]>) => {
    updateWiki(wikiKey, updater)
  }

  const [messageApi, contextHolder] = message.useMessage()
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)

  /** 普通表 / 主区域 / 侧边栏草稿里可能含关联字段 key：随字段定义同步剔除 */
  useEffect(() => {
    setDetail1Config((prev) => {
      const nextMain = filterRichTableFieldKeys(prev.mainFieldKeys, fields)
      const nextSide = filterRichTableFieldKeys(prev.sideFieldKeys, fields)
      const nextSections = prev.middleSections.map((s) => {
        if (s.kind !== 'rich-table') return s
        const fk = filterRichTableFieldKeys(s.fieldKeys, fields)
        if (fk.length === s.fieldKeys.length && fk.every((k, i) => k === s.fieldKeys[i])) return s
        return { ...s, fieldKeys: fk }
      })
      const mainSame =
        nextMain.length === prev.mainFieldKeys.length &&
        nextMain.every((k, i) => k === prev.mainFieldKeys[i])
      const sideSame =
        nextSide.length === prev.sideFieldKeys.length &&
        nextSide.every((k, i) => k === prev.sideFieldKeys[i])
      const sectionsSame = nextSections.every((s, i) => s === prev.middleSections[i])
      if (mainSame && sideSame && sectionsSame) return prev
      return {
        ...prev,
        mainFieldKeys: nextMain,
        sideFieldKeys: nextSide,
        middleSections: nextSections,
      }
    })
  }, [wikiKey, fields, setDetail1Config])

  useEffect(() => {
    setDetail2Config((prev) => {
      const nextMain = filterRichTableFieldKeys(prev.mainFieldKeys, fields)
      const nextSide = filterRichTableFieldKeys(prev.sideFieldKeys, fields)
      const mainSame =
        nextMain.length === prev.mainFieldKeys.length &&
        nextMain.every((k, i) => k === prev.mainFieldKeys[i])
      const sideSame =
        nextSide.length === prev.sideFieldKeys.length &&
        nextSide.every((k, i) => k === prev.sideFieldKeys[i])
      if (mainSame && sideSame) return prev
      return { ...prev, mainFieldKeys: nextMain, sideFieldKeys: nextSide }
    })
  }, [wikiKey, fields, setDetail2Config])

  const relationTargetOptions = useMemo(
    () => WIKI_RELATION_OPTIONS.filter((o) => o.value !== wikiKey),
    [wikiKey],
  )
  /** 关联目标下拉：默认排除当前 Wiki；种子中自环字段需带上当前 Wiki 选项 */
  const cardRefSelectOptions = useMemo(() => {
    const seen = new Set(relationTargetOptions.map((o) => o.value))
    const selfOpt = WIKI_RELATION_OPTIONS.find((o) => o.value === wikiKey)
    if (selfOpt && !seen.has(selfOpt.value)) {
      return [selfOpt, ...relationTargetOptions]
    }
    return relationTargetOptions
  }, [wikiKey, relationTargetOptions])

  /** 当前 Wiki 中「关联关系」字段所指向的目标 Wiki（用于关联表格里跨 Wiki 选列） */
  const cardRefTargetWikiKeys = useMemo(() => {
    const s = new Set<string>()
    for (const f of sortedFields) {
      if (!f.visible) continue
      if ((f.type === 'card-ref' || f.type === 'card-ref-multi') && f.cardRefWikiKey) {
        s.add(f.cardRefWikiKey)
      }
    }
    return [...s].sort()
  }, [sortedFields])

  const linkedWikiFieldSelectOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    for (const wk of cardRefTargetWikiKeys) {
      const rows = fieldsByWiki[wk] ?? []
      const vis = [...rows].filter((x) => x.visible).sort((a, b) => a.order - b.order)
      const wlabel = WIKI_META[wk]?.label ?? wk
      for (const f of vis) {
        opts.push({
          value: `${wk}::${f.key}`,
          label: `${wlabel} / ${f.label}`,
        })
      }
    }
    return opts
  }, [cardRefTargetWikiKeys, fieldsByWiki])

  // ── 字段弹窗 ──────────────────────────────────
  const [linkedRemotePickNonce, setLinkedRemotePickNonce] = useState<Record<string, number>>({})
  /** 关联表格「跨 Wiki 添加列」：多目标时先选 Wiki 分类，再选字段 */
  const [linkedPickTargetWiki, setLinkedPickTargetWiki] = useState<Record<string, string | undefined>>({})
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<WikiField | null>(null)
  const [fieldForm] = Form.useForm()
  const watchedType = Form.useWatch('type', fieldForm)
  const watchedCardRefWikiKey = Form.useWatch('cardRefWikiKey', fieldForm)
  const showMirrorBlock =
    !!fieldModalOpen &&
    (watchedType === 'card-ref' || watchedType === 'card-ref-multi') &&
    !!watchedCardRefWikiKey &&
    watchedCardRefWikiKey !== wikiKey &&
    !editingField?.relationManagedByPairId

  /** 弹窗打开后再写 Form，避免未挂载时 resetFields / 与 SSR 下 forceRender 水合不一致 */
  const fieldModalIntentRef = useRef<{ kind: 'add' } | { kind: 'edit'; record: WikiField } | null>(null)

  /** 字段弹窗内「显示名称」多语言草稿，保存字段时写入 WikiField.i18n */
  const [pendingFieldLabelI18n, setPendingFieldLabelI18n] = useState<I18nLabels>({})
  const [fieldFormLabelI18nModalOpen, setFieldFormLabelI18nModalOpen] = useState(false)
  // 单选选项列表（弹窗内独立管理，不走 Form）
  const [selectOptions, setSelectOptions] = useState<WikiSelectOption[]>([])
  const [optionInput, setOptionInput] = useState('')

  const closeFieldModal = () => {
    setFieldModalOpen(false)
    setPendingFieldLabelI18n({})
    setFieldFormLabelI18nModalOpen(false)
  }

  const openAddFieldModal = () => {
    setEditingField(null)
    fieldModalIntentRef.current = { kind: 'add' }
    setSelectOptions([])
    setOptionInput('')
    setPendingFieldLabelI18n({})
    setFieldFormLabelI18nModalOpen(false)
    setFieldModalOpen(true)
  }
  const openEditFieldModal = (record: WikiField) => {
    setEditingField(record)
    fieldModalIntentRef.current = { kind: 'edit', record }
    setPendingFieldLabelI18n({
      ...(record.i18n || {}),
      zh: record.i18n?.zh ?? record.label,
    })
    setFieldFormLabelI18nModalOpen(false)
    setSelectOptions(normalizeSelectOptions(record.selectOptions))
    setOptionInput('')
    setFieldModalOpen(true)
  }

  const handleFieldModalAfterOpenChange = (open: boolean) => {
    if (!open) {
      fieldModalIntentRef.current = null
      return
    }
    const intent = fieldModalIntentRef.current
    if (!intent) return

    if (intent.kind === 'add') {
      fieldForm.resetFields()
      fieldForm.setFieldsValue({ type: 'text' })
    } else {
      const { record } = intent
      const firstCrossTarget = relationTargetOptions[0]?.value
      if (record.relationManagedByPairId) {
        fieldForm.setFieldsValue({
          key: record.key,
          label: record.label,
          type: record.type,
          cardRefWikiKey: record.cardRefWikiKey,
        })
      } else {
        fieldForm.setFieldsValue({
          ...record,
          cardRefWikiKey:
            record.type === 'card-ref' || record.type === 'card-ref-multi'
              ? record.cardRefWikiKey ?? firstCrossTarget ?? 'items'
              : undefined,
          mirrorFieldKey: record.relationMirror?.mirrorFieldKey,
          mirrorLabel: record.relationMirror?.mirrorLabel,
        })
      }
    }
    fieldModalIntentRef.current = null
  }

  const openFieldFormLabelI18nModal = () => {
    const zh = (fieldForm.getFieldValue('label') as string | undefined)?.trim() ?? ''
    setPendingFieldLabelI18n((prev) => ({ ...prev, ...(zh ? { zh } : {}) }))
    setFieldFormLabelI18nModalOpen(true)
  }

  const handleFieldFormLabelI18nSave = (i18n: I18nLabels) => {
    const zh = (i18n.zh ?? '').trim()
    setPendingFieldLabelI18n(i18n)
    fieldForm.setFieldsValue({ label: zh || fieldForm.getFieldValue('label') })
    setFieldFormLabelI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  const handleFieldSave = () => {
    fieldForm.validateFields().then((raw) => {
      const values = { ...raw } as Record<string, unknown> & {
        key: string
        label: string
        type: FieldType
        cardRefWikiKey?: string
        mirrorFieldKey?: string
        mirrorLabel?: string
      }

      if (
        editingField?.relationManagedByPairId &&
        editingField.relationSourceWikiKey &&
        editingField.relationSourceFieldKey
      ) {
        const labelZh = String(values.label ?? '').trim()
        const nextI18n: I18nLabels = { ...pendingFieldLabelI18n, zh: labelZh }
        const pid = editingField.relationManagedByPairId
        const srcWiki = editingField.relationSourceWikiKey
        const srcFieldKey = editingField.relationSourceFieldKey
        batchUpdate((draft) => {
          draft[wikiKey] = (draft[wikiKey] ?? []).map((f) =>
            f.key === editingField.key ? { ...f, label: labelZh, i18n: nextI18n } : f,
          )
          draft[srcWiki] = (draft[srcWiki] ?? []).map((f) =>
            f.key === srcFieldKey && f.relationPairId === pid
              ? {
                  ...f,
                  relationMirror: f.relationMirror
                    ? { ...f.relationMirror, mirrorLabel: labelZh, mirrorI18n: nextI18n }
                    : {
                        mirrorFieldKey: editingField.key,
                        mirrorLabel: labelZh,
                        mirrorI18n: nextI18n,
                      },
                }
              : f,
          )
        })
        messageApi.success('字段已更新')
        closeFieldModal()
        return
      }

      if (values.type !== 'card-ref' && values.type !== 'card-ref-multi') {
        delete values.cardRefWikiKey
      }
      const labelZh = String(values.label ?? '').trim()
      const nextI18n: I18nLabels = { ...pendingFieldLabelI18n, zh: labelZh }
      const defaults = { visible: true, listDisplay: true, sortable: false, filterable: false }
      const isCardRef = values.type === 'card-ref' || values.type === 'card-ref-multi'
      const targetKey = values.cardRefWikiKey
      const crossWiki = !!(isCardRef && targetKey && targetKey !== wikiKey)

      if (crossWiki) {
        const mk = String(values.mirrorFieldKey ?? '').trim()
        const ml = String(values.mirrorLabel ?? '').trim()
        if (!mk || !ml) {
          messageApi.error('请填写对方 Wiki 上的字段 Key 与显示名称')
          return
        }
        const targetRows = fieldsByWiki[targetKey] ?? []
        const pairId = editingField?.relationPairId
        const keyConflict = targetRows.some((f) => {
          if (f.key !== mk) return false
          if (pairId && f.relationManagedByPairId === pairId) return false
          return true
        })
        if (keyConflict) {
          messageApi.error('对方 Wiki 已存在相同字段 Key')
          return
        }
      }

      if (!editingField && fields.some((f) => f.key === values.key)) {
        messageApi.error('字段 Key 已存在')
        return
      }

      const newPairId = crossWiki ? (editingField?.relationPairId ?? crypto.randomUUID()) : undefined
      const relationMirror =
        crossWiki && targetKey
          ? {
              mirrorFieldKey: String(values.mirrorFieldKey ?? '').trim(),
              mirrorLabel: String(values.mirrorLabel ?? '').trim(),
              mirrorI18n: { zh: String(values.mirrorLabel ?? '').trim() },
            }
          : undefined

      const oldPair = editingField?.relationPairId
      const oldTarget = editingField?.cardRefWikiKey

      const maxOrder = Math.max(0, ...fields.map((f) => f.order)) + 1

      batchUpdate((draft) => {
        if (oldPair && oldTarget && (!crossWiki || oldTarget !== targetKey)) {
          draft[oldTarget] = (draft[oldTarget] ?? []).filter(
            (f) => f.relationManagedByPairId !== oldPair,
          )
        }

        const cur = draft[wikiKey] ?? []
        const prevField = editingField

        const sourceRow: WikiField = {
          key: values.key,
          label: labelZh,
          i18n: nextI18n,
          type: values.type,
          visible: prevField?.visible ?? defaults.visible,
          listDisplay: prevField?.listDisplay ?? defaults.listDisplay,
          sortable: prevField?.sortable ?? defaults.sortable,
          filterable: prevField?.filterable ?? defaults.filterable,
          required: prevField?.required ?? false,
          order: prevField?.order ?? maxOrder,
          cardRefWikiKey: isCardRef ? targetKey : undefined,
          cardRefLinkedFields: isCardRef
            ? prevField &&
              prevField.key === values.key &&
              Array.isArray(prevField.cardRefLinkedFields) &&
              prevField.cardRefLinkedFields.length > 0
              ? prevField.cardRefLinkedFields
              : DEFAULT_CARD_REF_LINKED_FIELDS.map((r) => ({ ...r }))
            : undefined,
          selectOptions: values.type === 'select' ? selectOptions : undefined,
          relationPairId: newPairId,
          relationMirror: crossWiki ? relationMirror : undefined,
          relationManagedByPairId: undefined,
          relationSourceWikiKey: undefined,
          relationSourceFieldKey: undefined,
        }

        if (prevField) {
          draft[wikiKey] = cur.map((f) => (f.key === prevField.key ? sourceRow : f))
        } else {
          draft[wikiKey] = [...cur, sourceRow]
        }

        if (crossWiki && targetKey && newPairId && relationMirror) {
          const ml = relationMirror.mirrorLabel
          const mi18n = relationMirror.mirrorI18n ?? { zh: ml }
          const mirrorRow: WikiField = {
            key: relationMirror.mirrorFieldKey,
            label: ml,
            i18n: mi18n,
            type: values.type,
            visible: true,
            listDisplay: true,
            sortable: false,
            filterable: false,
            required: false,
            order: Math.max(0, ...(draft[targetKey] ?? []).map((f) => f.order)) + 1,
            cardRefWikiKey: wikiKey,
            cardRefLinkedFields: DEFAULT_CARD_REF_LINKED_FIELDS.map((r) => ({ ...r })),
            relationManagedByPairId: newPairId,
            relationSourceWikiKey: wikiKey,
            relationSourceFieldKey: values.key,
          }
          const trows = draft[targetKey] ?? []
          const idx = trows.findIndex((f) => f.relationManagedByPairId === newPairId)
          if (idx >= 0) {
            const next = [...trows]
            next[idx] = {
              ...mirrorRow,
              order: trows[idx]!.order,
              cardRefLinkedFields:
                trows[idx]!.cardRefLinkedFields?.length ? trows[idx]!.cardRefLinkedFields : mirrorRow.cardRefLinkedFields,
            }
            draft[targetKey] = next
          } else {
            draft[targetKey] = [...trows, mirrorRow]
          }
        }
      })

      messageApi.success(editingField ? '字段已更新' : '字段已新增')
      closeFieldModal()
    })
  }

  const addSelectOption = () => {
    const val = optionInput.trim()
    if (!val) return
    if (selectOptions.some(o => (o.i18n.zh || '').trim() === val)) { messageApi.warning('选项已存在'); return }
    const id = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    setSelectOptions(prev => [...prev, { id, i18n: { zh: val } }])
    setOptionInput('')
  }

  // ── 单选项多语言：侧滑抽屉编辑 ──
  const [optionDrawerId, setOptionDrawerId] = useState<string | null>(null)

  const patchSelectOptionI18n = (optionId: string, i18n: I18nLabels) => {
    setSelectOptions(prev => prev.map(o => (o.id === optionId ? { ...o, i18n } : o)))
  }

  const handleDeleteField = (key: string) => {
    const field = fields.find((f) => f.key === key)
    if (field?.relationPairId) {
      const tid = field.cardRefWikiKey
      if (tid) {
        batchUpdate((draft) => {
          draft[tid] = (draft[tid] ?? []).filter(
            (f) => f.relationManagedByPairId !== field.relationPairId,
          )
        })
      }
    }
    if (field?.relationManagedByPairId && field.relationSourceWikiKey && field.relationSourceFieldKey) {
      const srcWiki = field.relationSourceWikiKey
      const srcKey = field.relationSourceFieldKey
      const pid = field.relationManagedByPairId
      batchUpdate((draft) => {
        draft[srcWiki] = (draft[srcWiki] ?? []).map((f) =>
          f.key === srcKey && f.relationPairId === pid
            ? { ...f, relationPairId: undefined, relationMirror: undefined }
            : f,
        )
      })
    }
    setFields((prev) => prev.filter((f) => f.key !== key))
    setListFieldKeys((prev) => prev.filter((k) => k !== key))
    messageApi.success('字段已删除')
  }

  // ── 多语言弹窗 ────────────────────────────────
  const [i18nModalOpen, setI18nModalOpen] = useState(false)
  const [i18nTarget, setI18nTarget] = useState<WikiField | null>(null)
  const openI18nModal = (record: WikiField) => { setI18nTarget(record); setI18nModalOpen(true) }
  const handleI18nSave = (i18n: I18nLabels) => {
    if (!i18nTarget) return
    setFields(prev => prev.map(f => f.key === i18nTarget.key ? { ...f, i18n, label: i18n.zh || f.label } : f))
    setI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  // ── 拖拽排序 ──────────────────────────────────
  const fieldDragIndex = useRef<number | null>(null)
  const fieldDragOverIndex = useRef<number | null>(null)
  const handleFieldDragStart = (index: number) => { fieldDragIndex.current = index }
  const handleFieldDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); fieldDragOverIndex.current = index }
  const handleFieldDrop = () => {
    if (fieldDragIndex.current === null || fieldDragOverIndex.current === null || fieldDragIndex.current === fieldDragOverIndex.current) return
    const reordered = [...sortedFields]
    const [moved] = reordered.splice(fieldDragIndex.current, 1)
    reordered.splice(fieldDragOverIndex.current, 0, moved)
    setFields(() => reordered.map((f, i) => ({ ...f, order: i + 1 })))
    fieldDragIndex.current = null; fieldDragOverIndex.current = null
  }

  // ── 列表样式 ──────────────────────────────────
  const [selectedStyle, setSelectedStyle] = useState<ListStyle>('card-list')
  const [listFieldKeys, setListFieldKeys] = useState<string[]>([])
  const currentStyleConfig = LIST_STYLES.find((s) => s.id === selectedStyle) ?? LIST_STYLES[0]
  const allowedFieldKeys = sortedFields.filter(f => f.visible && currentStyleConfig.allowedTypes.includes(f.type)).map(f => f.key)
  const validListFieldKeys = listFieldKeys.filter(k => allowedFieldKeys.includes(k))

  /** 路由 [key] 切换时重置本页 UI 状态（字段列表来自 Registry；详情样式草稿由 WikiDetailStyleDraftProvider 重置） */
  useEffect(() => {
    setListFieldKeys([])
    setSelectedStyle('card-list')
    setFieldModalOpen(false)
    setEditingField(null)
    fieldModalIntentRef.current = null
    fieldForm.resetFields()
    setSelectOptions([])
    setOptionInput('')
    setOptionDrawerId(null)
    setI18nModalOpen(false)
    setI18nTarget(null)
    setPendingFieldLabelI18n({})
    setFieldFormLabelI18nModalOpen(false)
  }, [wikiKey])

  const addRichMiddleSection = () => {
    const next: DetailMiddleSection = {
      kind: 'rich-table',
      id: `section_${Date.now()}`,
      title: '新区域',
      fieldKeys: [],
    }
    setDetail1Config((prev) => ({ ...prev, middleSections: [...prev.middleSections, next] }))
  }

  const addLinkedMiddleSection = () => {
    const next: DetailMiddleSection = {
      kind: 'linked-table',
      id: `lkts_${Date.now()}`,
      title: '新关联表格',
      columnRefs: [],
    }
    setDetail1Config((prev) => ({ ...prev, middleSections: [...prev.middleSections, next] }))
  }

  const updateRichMiddleSection = (id: string, updates: Partial<RichTableSection>) => {
    const list = fieldsByWiki[wikiKey] ?? []
    setDetail1Config((prev) => ({
      ...prev,
      middleSections: prev.middleSections.map((s) => {
        if (s.kind !== 'rich-table' || s.id !== id) return s
        const merged = { ...s, ...updates }
        return { ...merged, fieldKeys: filterRichTableFieldKeys(merged.fieldKeys, list) }
      }),
    }))
  }

  const updateLinkedMiddleSection = (id: string, updates: Partial<LinkedTableSection>) => {
    setDetail1Config((prev) => ({
      ...prev,
      middleSections: prev.middleSections.map((s) => {
        if (s.kind !== 'linked-table' || s.id !== id) return s
        const cur = s as { kind: 'linked-table' } & LinkedTableSection & { columnKeys?: string[] }
        const { columnKeys: _drop, ...rest } = cur
        return { ...rest, ...updates, kind: 'linked-table' as const, columnKeys: undefined }
      }),
    }))
  }

  const removeMiddleSection = (id: string) => {
    setDetail1Config((prev) => ({
      ...prev,
      middleSections: prev.middleSections.filter((s) => s.id !== id),
    }))
  }

  const moveMiddleSection = (id: string, delta: -1 | 1) => {
    setDetail1Config((prev) => {
      const idx = prev.middleSections.findIndex((s) => s.id === id)
      if (idx < 0) return prev
      const j = idx + delta
      if (j < 0 || j >= prev.middleSections.length) return prev
      const next = [...prev.middleSections]
      const tmp = next[idx]!
      next[idx] = next[j]!
      next[j] = tmp
      return { ...prev, middleSections: next }
    })
  }

  // ── 字段表格列 ────────────────────────────────
  const fieldColumns = [
    {
      title: '字段 Key', dataIndex: 'key', key: 'key',
      render: (v: string) => <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#374151' }}>{v}</code>,
    },
    {
      title: '显示名称', dataIndex: 'label', key: 'label',
      render: (v: string, record: WikiField) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{v}</span>
          <Tooltip title="配置多语言">
            <Button size="small" type="text" icon={<Languages size={12} />} style={{ color: '#1677FF', padding: '0 4px', height: 20 }} onClick={() => openI18nModal(record)} />
          </Tooltip>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {LANGUAGES.filter(l => record.i18n?.[l.code]).map(l => (
              <Tooltip key={l.code} title={`${l.label}: ${record.i18n?.[l.code]}`}>
                <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, cursor: 'default', lineHeight: '18px' }}>{l.code}</span>
              </Tooltip>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: FieldType, record: WikiField) => (
        <div>
          <Tag color={fieldTypeColors[v]}>{fieldTypeLabels[v] ?? v}</Tag>
          {(v === 'card-ref' || v === 'card-ref-multi') && record.cardRefWikiKey && WIKI_META[record.cardRefWikiKey] ? (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              关联：{WIKI_META[record.cardRefWikiKey].label}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: WikiField) => (
        <Space size={4} wrap>
          {record.relationManagedByPairId ? (
            <Tooltip title="由对方 Wiki 关联配置自动生成，可改显示名称；删除将解除源字段上的双向关联">
              <Tag color="default" style={{ fontSize: 11, margin: 0 }}>同步字段</Tag>
            </Tooltip>
          ) : null}
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEditFieldModal(record)}>编辑</Button>
          <Popconfirm title="确认删除该字段？" description="删除后前台将不再展示此字段数据。"
            onConfirm={() => handleDeleteField(record.key)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" danger icon={<Trash2 size={13} />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb items={[{ label: 'Wiki 管理', href: '/wiki' }, { label: `${wikiLabel} 配置` }]} />

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 字段配置 ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>字段配置</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  配置前台页面展示的字段及其属性。点击名称旁的
                  <Languages size={13} style={{ color: '#1677FF', flexShrink: 0, verticalAlign: 'middle' }} />
                  图标可配置多语言，支持 AI 一键翻译。
                </p>
              </div>
              <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6, flexShrink: 0 }} onClick={openAddFieldModal}>
                新增字段
              </Button>
            </div>
            {sortedFields.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '32px 0', border: '1px dashed #E5E7EB', borderRadius: 8 }}>
                暂无字段配置，点击「新增字段」开始添加
              </div>
            ) : (
              <Table
                dataSource={sortedFields}
                columns={fieldColumns}
                rowKey="key"
                size="small"
                pagination={false}
                onRow={(_, index) => ({
                  draggable: true,
                  onDragStart: () => handleFieldDragStart(index!),
                  onDragOver: (e: React.DragEvent) => handleFieldDragOver(e, index!),
                  onDrop: handleFieldDrop,
                })}
              />
            )}
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB' }} />

          {/* ── 列表样式 ── */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>列表样式</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>选择前台列表页的展示样式，不同样式支持的字段数量和类型不同。</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {LIST_STYLES.map(s => (
                <div key={s.id} onClick={() => {
                  setSelectedStyle(s.id)
                  let valid = listFieldKeys.filter(k => { const f = fields.find(ff => ff.key === k); return f && s.allowedTypes.includes(f.type) }).slice(0, s.maxFields)
                  if (s.requireImage) {
                    const firstImg = sortedFields.find(f => f.visible && f.type === 'single-image')
                    if (firstImg && !valid.includes(firstImg.key)) valid = [firstImg.key, ...valid].slice(0, s.maxFields)
                  }
                  setListFieldKeys(valid)
                }} style={{ padding: '12px 14px', border: `2px solid ${selectedStyle === s.id ? '#1677FF' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: selectedStyle === s.id ? '#EFF6FF' : '#fff', transition: 'all 0.15s', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {s.requireImage ? `图片必选 + 最多 ${s.maxTextFields ?? (s.maxFields - 1)} 个文本/数字` : `最多 ${s.maxFields} 个字段`}
                  </div>
                  {selectedStyle === s.id && <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '0 4px' }}>已选</Tag>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 260, flexShrink: 0, border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                  选择展示字段 <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6 }}>({validListFieldKeys.length}/{currentStyleConfig.maxFields})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {sortedFields.filter(f => f.visible).map(f => {
                    const allowed = currentStyleConfig.allowedTypes.includes(f.type)
                    const checked = validListFieldKeys.includes(f.key)
                    const isImage = f.type === 'single-image'
                    const checkedImageKeys = validListFieldKeys.filter(k => { const ff = sortedFields.find(x => x.key === k); return ff?.type === 'single-image' })
                    const checkedTextKeys = validListFieldKeys.filter(k => { const ff = sortedFields.find(x => x.key === k); return ff && ff.type !== 'single-image' })
                    const firstImageField = sortedFields.find(ff => ff.visible && ff.type === 'single-image')
                    const isLockedImage = currentStyleConfig.requireImage && isImage && firstImageField?.key === f.key
                    let disabled = !allowed
                    if (isLockedImage) { disabled = true }
                    else if (!disabled && !checked) {
                      if (currentStyleConfig.requireImage) {
                        if (isImage && checkedImageKeys.length >= 1) disabled = true
                        if (!isImage && checkedTextKeys.length >= (currentStyleConfig.maxTextFields ?? (currentStyleConfig.maxFields - 1))) disabled = true
                      } else { if (validListFieldKeys.length >= currentStyleConfig.maxFields) disabled = true }
                    }
                    return (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox checked={checked} disabled={disabled} onChange={e => { if (e.target.checked) setListFieldKeys(prev => [...prev, f.key]); else setListFieldKeys(prev => prev.filter(k => k !== f.key)) }} />
                        <span style={{ fontSize: 13, color: allowed ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                        <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 11, padding: '0 4px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>前端预览 <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag></div>
                <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                  {validListFieldKeys.length === 0
                    ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>请在左侧勾选至少一个字段</div>
                    : <ListStylePreview style={selectedStyle} fields={sortedFields} selectedFieldKeys={validListFieldKeys} />}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB' }} />

          {/* ── 详情样式 ── */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>详情样式</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>选择前台详情页的展示样式，配置主区域与侧边栏显示的字段。</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {DETAIL_STYLES.map(s => (
                <div key={s.id} onClick={() => setSelectedDetailStyle(s.id)} style={{ padding: '12px 14px', border: `2px solid ${selectedDetailStyle === s.id ? '#1677FF' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: selectedDetailStyle === s.id ? '#EFF6FF' : '#fff', transition: 'all 0.15s', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
                    </div>
                  </div>
                  {selectedDetailStyle === s.id && <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '0 4px' }}>已选</Tag>}
                </div>
              ))}
            </div>

            {selectedDetailStyle === 'detail-1' ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>① 主区域字段</div>
                    <div style={{ marginBottom: 8, padding: '4px 8px', background: '#F3F4F6', borderRadius: 4, fontSize: 12, color: '#6B7280' }}>
                      <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 6 }}>标题</span><span style={{ color: '#374151', fontWeight: 500 }}>名称</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible && !isCardRefFieldType(f.type)).map(f => {
                        const checked = detail1Config.mainFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} onChange={e => setDetail1Config(prev => ({ ...prev, mainFieldKeys: e.target.checked ? [...prev.mainFieldKeys, f.key] : prev.mainFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>② 普通表格</span>
                        <Space size={6} wrap>
                          <Button size="small" type="dashed" icon={<Plus size={12} />} onClick={addRichMiddleSection}>普通表格</Button>
                          <Button size="small" type="dashed" icon={<Plus size={12} />} onClick={addLinkedMiddleSection}>
                            关联表格
                          </Button>
                        </Space>
                      </div>
                    </div>
                    {detail1Config.middleSections.length === 0 ? (
                      <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                        暂无模块，点击「普通表格」或「关联表格」
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {detail1Config.middleSections.map((section, index) => {
                          const total = detail1Config.middleSections.length
                          if (section.kind === 'rich-table') {
                            return (
                              <div key={section.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                    <Tag color="blue" style={{ margin: 0, fontSize: 11, flexShrink: 0 }}>普通表</Tag>
                                    <Input
                                      size="small"
                                      value={section.title}
                                      onChange={e => updateRichMiddleSection(section.id, { title: e.target.value })}
                                      style={{ flex: 1, minWidth: 0 }}
                                      prefix={<span style={{ color: '#9CA3AF', fontSize: 10 }}>标题</span>}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 0 }}>
                                    <Space size={0}>
                                      <Tooltip title="上移">
                                        <Button size="small" type="text" icon={<ChevronUp size={14} />} disabled={index === 0} onClick={() => moveMiddleSection(section.id, -1)} style={{ color: '#6B7280' }} />
                                      </Tooltip>
                                      <Tooltip title="下移">
                                        <Button size="small" type="text" icon={<ChevronDown size={14} />} disabled={index >= total - 1} onClick={() => moveMiddleSection(section.id, 1)} style={{ color: '#6B7280' }} />
                                      </Tooltip>
                                    </Space>
                                    <Button size="small" type="text" danger icon={<Trash2 size={12} />} onClick={() => removeMiddleSection(section.id)} />
                                  </div>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <Tooltip title={section.fieldKeys.length === 0 ? '请先勾选至少一列后再管理行数据' : '在独立页面编辑本表格 MOCK 行数据'}>
                                    <Link
                                      href={`/wiki/config/${wikiKey}/detail-table/${encodeURIComponent(section.id)}`}
                                      style={{ display: 'inline-flex' }}
                                      aria-disabled={section.fieldKeys.length === 0}
                                      onClick={(e) => {
                                        if (section.fieldKeys.length === 0) e.preventDefault()
                                      }}
                                    >
                                      <Button
                                        size="small"
                                        type="link"
                                        icon={<Table2 size={13} />}
                                        disabled={section.fieldKeys.length === 0}
                                        style={{ padding: '0' }}
                                      >
                                        管理数据
                                      </Button>
                                    </Link>
                                  </Tooltip>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {sortedFields.filter(f => f.visible && !isCardRefFieldType(f.type)).map(f => {
                                    const checked = section.fieldKeys.includes(f.key)
                                    return (
                                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Checkbox checked={checked} onChange={e => updateRichMiddleSection(section.id, { fieldKeys: e.target.checked ? [...section.fieldKeys, f.key] : section.fieldKeys.filter(k => k !== f.key) })} />
                                        <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                                        <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }
                          return (
                            <div key={section.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                  <Tag color="geekblue" style={{ margin: 0, fontSize: 11, flexShrink: 0 }}>关联</Tag>
                                  <Input
                                    size="small"
                                    value={section.title}
                                    onChange={(e) => updateLinkedMiddleSection(section.id, { title: e.target.value })}
                                    style={{ flex: 1, minWidth: 0 }}
                                    prefix={<span style={{ color: '#9CA3AF', fontSize: 10 }}>标题</span>}
                                  />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 0 }}>
                                  <Space size={0}>
                                    <Tooltip title="上移">
                                      <Button size="small" type="text" icon={<ChevronUp size={14} />} disabled={index === 0} onClick={() => moveMiddleSection(section.id, -1)} style={{ color: '#6B7280' }} />
                                    </Tooltip>
                                    <Tooltip title="下移">
                                      <Button size="small" type="text" icon={<ChevronDown size={14} />} disabled={index >= total - 1} onClick={() => moveMiddleSection(section.id, 1)} style={{ color: '#6B7280' }} />
                                    </Tooltip>
                                  </Space>
                                  <Button size="small" type="text" danger icon={<Trash2 size={12} />} onClick={() => removeMiddleSection(section.id)} />
                                </div>
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <Tooltip title={!linkedSectionHasColumns(section) ? '请先勾选至少一列或添加关联 Wiki 字段后再管理行数据' : '在独立页面编辑本表格 MOCK 行数据'}>
                                  <Link
                                    href={`/wiki/config/${wikiKey}/detail-table/${encodeURIComponent(section.id)}`}
                                    style={{ display: 'inline-flex' }}
                                    aria-disabled={!linkedSectionHasColumns(section)}
                                    onClick={(e) => {
                                      if (!linkedSectionHasColumns(section)) e.preventDefault()
                                    }}
                                  >
                                    <Button
                                      size="small"
                                      type="link"
                                      icon={<Table2 size={13} />}
                                      disabled={!linkedSectionHasColumns(section)}
                                      style={{ padding: '0' }}
                                    >
                                      管理数据
                                    </Button>
                                  </Link>
                                </Tooltip>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {sortedFields.filter(f => f.visible).map(f => {
                                  const refs = normalizeLinkedTableColumnRefs(section)
                                  const checked = refs.some((r) => !r.wikiKey && r.fieldKey === f.key)
                                  return (
                                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Checkbox
                                        checked={checked}
                                        onChange={(e) => {
                                          const next = toggleLinkedLocalColumn(refs, f.key, e.target.checked)
                                          updateLinkedMiddleSection(section.id, { columnRefs: next })
                                        }}
                                      />
                                      <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                                      <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                                    </div>
                                  )
                                })}
                              </div>
                              {(() => {
                                const refs = normalizeLinkedTableColumnRefs(section)
                                const remoteList = refs.filter((r) => r.wikiKey && r.wikiKey !== wikiKey)
                                return (
                                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #E5E7EB' }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>跨 Wiki 列</div>
                                    {remoteList.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                                        {remoteList.map((ref) => {
                                          const meta = resolveLinkedColumnMeta(wikiKey, ref, fieldsByWiki)
                                          return (
                                            <div
                                              key={`${ref.wikiKey}:${ref.fieldKey}`}
                                              style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', width: '100%' }}
                                            >
                                              <Checkbox
                                                checked
                                                onChange={(e) => {
                                                  if (e.target.checked) return
                                                  const r = normalizeLinkedTableColumnRefs(section)
                                                  const next = removeLinkedRemoteColumn(r, ref.wikiKey!, ref.fieldKey)
                                                  updateLinkedMiddleSection(section.id, { columnRefs: next })
                                                }}
                                              />
                                              <span style={{ fontSize: 12, color: '#374151', flex: 1, minWidth: 0 }}>{meta.label}</span>
                                              <Tag
                                                color={fieldTypeColors[meta.type as FieldType]}
                                                style={{ fontSize: 10, padding: '0 3px' }}
                                              >
                                                {fieldTypeLabels[meta.type as FieldType] ?? meta.type}
                                              </Tag>
                                              <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<X size={14} />}
                                                aria-label="移除此列"
                                                onClick={() => {
                                                  const r = normalizeLinkedTableColumnRefs(section)
                                                  const next = removeLinkedRemoteColumn(r, ref.wikiKey!, ref.fieldKey)
                                                  updateLinkedMiddleSection(section.id, { columnRefs: next })
                                                }}
                                                style={{ flexShrink: 0, marginLeft: 'auto' }}
                                              />
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>暂无；可从下方下拉添加。</div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {cardRefTargetWikiKeys.length > 1 ? (
                                        <Select
                                          showSearch
                                          allowClear
                                          placeholder="先筛选 Wiki 分类（可搜索名称或 key）"
                                          disabled={!cardRefTargetWikiKeys.length}
                                          style={{ width: '100%' }}
                                          value={linkedPickTargetWiki[section.id]}
                                          options={cardRefTargetWikiKeys.map((wk) => ({
                                            value: wk,
                                            label: `${WIKI_META[wk]?.label ?? wk}（${wk}）`,
                                          }))}
                                          filterOption={(input, option) =>
                                            String(option?.label ?? '')
                                              .toLowerCase()
                                              .includes(input.toLowerCase())
                                          }
                                          onChange={(v) => {
                                            setLinkedPickTargetWiki((p) => ({
                                              ...p,
                                              [section.id]: (v as string) || undefined,
                                            }))
                                          }}
                                        />
                                      ) : null}
                                      {(() => {
                                        const effectiveWiki =
                                          cardRefTargetWikiKeys.length === 1
                                            ? cardRefTargetWikiKeys[0]
                                            : linkedPickTargetWiki[section.id]
                                        const wikiPrefix = effectiveWiki ? `${effectiveWiki}::` : ''
                                        const fieldOpts = linkedWikiFieldSelectOptions.filter((opt) => {
                                          if (effectiveWiki && !opt.value.startsWith(wikiPrefix)) return false
                                          const i = opt.value.indexOf('::')
                                          if (i <= 0) return true
                                          const tw = opt.value.slice(0, i)
                                          const fk = opt.value.slice(i + 2)
                                          const resolvedWiki = (r: (typeof refs)[number]) => r.wikiKey ?? wikiKey
                                          const taken = refs.some(
                                            (r) => resolvedWiki(r) === tw && r.fieldKey === fk,
                                          )
                                          return !taken
                                        })
                                        const needPickWiki =
                                          cardRefTargetWikiKeys.length > 1 && !effectiveWiki
                                        return (
                                          <Select
                                            key={`linked-pick-${section.id}-${linkedRemotePickNonce[section.id] ?? 0}-${effectiveWiki ?? 'none'}`}
                                            showSearch
                                            allowClear
                                            placeholder={
                                              !cardRefTargetWikiKeys.length
                                                ? '请先在字段表中添加「关联关系」并指向目标 Wiki'
                                                : needPickWiki
                                                  ? '请先在上面的下拉中选择 Wiki 分类'
                                                  : '再搜索并选择要添加的字段…'
                                            }
                                            disabled={!cardRefTargetWikiKeys.length || needPickWiki}
                                            style={{ width: '100%' }}
                                            options={fieldOpts}
                                            filterOption={(input, option) =>
                                              String(option?.label ?? '')
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                            }
                                            onChange={(value) => {
                                              const raw =
                                                typeof value === 'string'
                                                  ? value
                                                  : value &&
                                                      typeof value === 'object' &&
                                                      value !== null &&
                                                      'value' in value
                                                    ? String((value as { value: unknown }).value)
                                                    : ''
                                              if (!raw) return
                                              const sep = '::'
                                              const i = raw.indexOf(sep)
                                              if (i <= 0) return
                                              const tw = raw.slice(0, i)
                                              const fk = raw.slice(i + sep.length)
                                              if (!fk) return
                                              const r = normalizeLinkedTableColumnRefs(section)
                                              const next = appendLinkedRemoteColumn(r, wikiKey, tw, fk)
                                              updateLinkedMiddleSection(section.id, { columnRefs: next })
                                              setLinkedRemotePickNonce((p) => ({
                                                ...p,
                                                [section.id]: (p[section.id] ?? 0) + 1,
                                              }))
                                            }}
                                          />
                                        )
                                      })()}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>③ 侧边栏字段</div>
                    <Input size="small" value={detail1Config.sideTitle} onChange={e => setDetail1Config(prev => ({ ...prev, sideTitle: e.target.value }))} placeholder="侧边栏标题" style={{ marginBottom: 8 }} prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible && !isCardRefFieldType(f.type)).map(f => {
                        const checked = detail1Config.sideFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} onChange={e => setDetail1Config(prev => ({ ...prev, sideFieldKeys: e.target.checked ? [...prev.sideFieldKeys, f.key] : prev.sideFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>前端预览 <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag></div>
                  <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                    {detail1Config.mainFieldKeys.length === 0
                      && detail1Config.sideFieldKeys.length === 0
                      && detail1Config.middleSections.length === 0
                      ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>请在左侧配置字段</div>
                      : (
                        <DetailStylePreview
                          style="detail-1"
                          fields={sortedFields}
                          detail1Config={detail1Config}
                          previewWikiKey={wikiKey}
                          previewFieldsByWiki={fieldsByWiki}
                        />
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>主区域字段</div>
                    <div style={{ marginBottom: 8, padding: '4px 8px', background: '#F3F4F6', borderRadius: 4, fontSize: 12, color: '#6B7280' }}>
                      <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 6 }}>标题</span><span style={{ color: '#374151', fontWeight: 500 }}>名称</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible && !isCardRefFieldType(f.type)).map(f => {
                        const checked = detail2Config.mainFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} onChange={e => setDetail2Config(prev => ({ ...prev, mainFieldKeys: e.target.checked ? [...prev.mainFieldKeys, f.key] : prev.mainFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>侧边栏字段</div>
                    <Input size="small" value={detail2Config.sideTitle} onChange={e => setDetail2Config(prev => ({ ...prev, sideTitle: e.target.value }))} placeholder="侧边栏标题" style={{ marginBottom: 8 }} prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible && !isCardRefFieldType(f.type)).map(f => {
                        const checked = detail2Config.sideFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} onChange={e => setDetail2Config(prev => ({ ...prev, sideFieldKeys: e.target.checked ? [...prev.sideFieldKeys, f.key] : prev.sideFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>前端预览 <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag></div>
                  <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                    {detail2Config.mainFieldKeys.length === 0 && detail2Config.sideFieldKeys.length === 0
                      ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>请在左侧配置字段</div>
                      : <DetailStylePreview style="detail-2" fields={sortedFields} detail2Config={detail2Config} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新增 / 编辑字段；forceRender：避免 destroyOnHidden 时 Form 卸载导致 useForm/useWatch 报警 */}
      <Modal
        title={editingField ? '编辑字段' : '新增字段'}
        open={fieldModalOpen}
        afterOpenChange={handleFieldModalAfterOpenChange}
        onCancel={closeFieldModal}
        width={640}
        forceRender
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeFieldModal}>取消</Button>
            <Button type="primary" onClick={() => handleFieldSave()}>保存</Button>
          </div>
        )}
      >
        <Form form={fieldForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="key" label="字段 Key" rules={[{ required: true, message: '请输入字段 Key' }, { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' }]}>
            <Input placeholder="如：attack_power" disabled={!!editingField} />
          </Form.Item>
          <Form.Item label="显示名称" required style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Form.Item name="label" noStyle rules={[{ required: true, message: '请输入显示名称' }]}>
                <Input
                  placeholder="如：攻击力（默认作为简体中文）"
                  style={{ flex: 1 }}
                  onChange={(e) => setPendingFieldLabelI18n((prev) => ({ ...prev, zh: e.target.value }))}
                />
              </Form.Item>
              <Tooltip title="配置多语言">
                <Button
                  type="text"
                  icon={<Languages size={16} />}
                  style={{ color: '#1677FF', flexShrink: 0, marginTop: 4 }}
                  onClick={openFieldFormLabelI18nModal}
                />
              </Tooltip>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9CA3AF' }}>
              与 Wiki 分类编辑一致：可点击图标打开多语言弹窗，支持 AI 一键翻译。
            </p>
          </Form.Item>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select
              disabled={!!editingField?.relationManagedByPairId}
              options={(Object.entries(fieldTypeLabels) as [FieldType, string][]).map(([value, label]) => ({
                value,
                label: `${label}（${value}）`,
              }))}
              onChange={(v: FieldType) => {
                if (v === 'card-ref' || v === 'card-ref-multi') {
                  const k = fieldForm.getFieldValue('cardRefWikiKey') as string | undefined
                  if (k == null || k === '' || k === wikiKey) {
                    const first = relationTargetOptions[0]?.value
                    if (first) fieldForm.setFieldValue('cardRefWikiKey', first)
                  }
                }
              }}
            />
          </Form.Item>

          {(watchedType === 'card-ref' || watchedType === 'card-ref-multi') && (
            <Form.Item
              name="cardRefWikiKey"
              label="关联目标"
              rules={[{ required: true, message: '请选择关联的 Wiki 分类' }]}
            >
              <Select
                placeholder="选择 Wiki 分类"
                options={cardRefSelectOptions}
                disabled={!!editingField?.relationManagedByPairId}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          )}

          {showMirrorBlock && (
            <div
              style={{
                marginTop: 8,
                padding: '12px 14px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                对方 Wiki（{WIKI_META[watchedCardRefWikiKey]?.label ?? watchedCardRefWikiKey}）上的反向字段
              </div>
              <Form.Item
                name="mirrorFieldKey"
                label="字段 Key"
                rules={[
                  { required: true, message: '请输入对方 Wiki 上的字段 Key' },
                  { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' },
                ]}
              >
                <Input placeholder="如：linked_items" />
              </Form.Item>
              <Form.Item
                name="mirrorLabel"
                label="显示名称"
                rules={[{ required: true, message: '请输入对方 Wiki 上的显示名称' }]}
              >
                <Input placeholder="如：关联道具" />
              </Form.Item>
              <Form.Item label="字段类型">
                <Input
                  readOnly
                  value={
                    watchedType === 'card-ref-multi'
                      ? `${fieldTypeLabels['card-ref-multi']}（card-ref-multi）`
                      : `${fieldTypeLabels['card-ref']}（card-ref）`
                  }
                />
              </Form.Item>
              <Form.Item label="关联目标">
                <Input readOnly value={`${WIKI_META[wikiKey]?.label ?? wikiKey}（${wikiKey}）`} />
              </Form.Item>
            </div>
          )}

          {/* 单选选项编辑区（仅 type === 'select' 时展示） */}
          {watchedType === 'select' && (
            <Form.Item label="选项列表" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* 已添加选项 */}
                {selectOptions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                    {selectOptions.map(opt => (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#374151', flex: '1 1 auto', minWidth: 48 }}>{selectOptionLabel(opt)}</span>
                        <Tooltip title="侧滑抽屉配置多语言">
                          <Button
                            size="small"
                            type="text"
                            icon={<Languages size={12} />}
                            style={{ color: '#1677FF', padding: '0 4px', height: 20, flexShrink: 0 }}
                            onClick={() => setOptionDrawerId(opt.id)}
                          />
                        </Tooltip>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: '0 1 auto' }}>
                          {LANGUAGES.filter(l => opt.i18n?.[l.code]?.trim()).map(l => (
                            <Tooltip key={l.code} title={`${l.label}: ${opt.i18n[l.code]}`}>
                              <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, cursor: 'default', lineHeight: '18px' }}>{l.code}</span>
                            </Tooltip>
                          ))}
                        </div>
                        <Button
                          type="text" size="small" danger
                          icon={<Trash2 size={13} />}
                          style={{ padding: '0 4px', flexShrink: 0, marginLeft: 'auto' }}
                          onClick={() => setSelectOptions(prev => prev.filter(o => o.id !== opt.id))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 输入新选项：Input + Button 同行，避免 Search 的 enterButton 图标换行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    value={optionInput}
                    onChange={e => setOptionInput(e.target.value)}
                    onPressEnter={addSelectOption}
                    placeholder="输入选项名称，按回车添加"
                    size="middle"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <Button
                    type="primary"
                    size="middle"
                    icon={<Plus size={14} />}
                    onClick={addSelectOption}
                    style={{ borderRadius: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    添加
                  </Button>
                </div>
                {selectOptions.length === 0 && (
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>暂无选项，输入后按回车或点击「添加」</div>
                )}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 单选项多语言：侧滑抽屉 */}
      {(() => {
        const opt = optionDrawerId ? selectOptions.find(o => o.id === optionDrawerId) : null
        if (!opt) return null
        return (
          <Drawer
            title={`选项多语言 · ${selectOptionLabel(opt)}`}
            open
            onClose={() => setOptionDrawerId(null)}
            width={400}
            destroyOnHidden
            styles={{ body: { paddingTop: 8 } }}
          >
            <FieldI18nEditor
              i18n={opt.i18n}
              fieldLabel={selectOptionLabel(opt)}
              onSave={(i) => { patchSelectOptionI18n(opt.id, i); setOptionDrawerId(null); messageApi.success('已保存') }}
              onCancel={() => setOptionDrawerId(null)}
            />
          </Drawer>
        )
      })()}

      {/* 多语言弹窗（字段） */}
      {i18nTarget && (
        <FieldI18nModal
          open={i18nModalOpen}
          fieldKey={i18nTarget.key}
          fieldLabel={i18nTarget.label}
          i18n={i18nTarget.i18n}
          onSave={handleI18nSave}
          onCancel={() => setI18nModalOpen(false)}
        />
      )}

      {/* 多语言弹窗（字段编辑弹窗内的显示名称） */}
      <FieldI18nModal
        open={fieldFormLabelI18nModalOpen}
        fieldKey={editingField?.key || fieldForm.getFieldValue('key') || 'name'}
        fieldLabel={(pendingFieldLabelI18n.zh ?? fieldForm.getFieldValue('label') ?? '').trim() || '显示名称'}
        i18n={pendingFieldLabelI18n}
        onSave={handleFieldFormLabelI18nSave}
        onCancel={() => setFieldFormLabelI18nModalOpen(false)}
      />

    </div>
  )
}
