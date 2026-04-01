'use client'

import React, { useState } from 'react'
import { Button, Drawer, Input, Tooltip, message } from 'antd'
import { Languages, Plus, Trash2 } from 'lucide-react'
import FieldI18nEditor from './FieldI18nEditor'
import { LANGUAGES, type I18nLabels } from './fieldI18nConstants'
import { relationSelectOptionDisplayLabel, type WikiRelationSelectOption } from '../config/wikiRelationDefinitions'

function optionRowLabel(opt: WikiRelationSelectOption): string {
  return relationSelectOptionDisplayLabel(opt)
}

export default function RelationFieldSelectOptionsEditor({
  value = [],
  onChange,
}: {
  value?: WikiRelationSelectOption[]
  onChange?: (next: WikiRelationSelectOption[]) => void
}) {
  const [messageApi, contextHolder] = message.useMessage()
  const list = Array.isArray(value) ? value : []
  const [optionInput, setOptionInput] = useState('')
  const [drawerIndex, setDrawerIndex] = useState<number | null>(null)
  const [drawerValueStr, setDrawerValueStr] = useState('')

  const patch = (next: WikiRelationSelectOption[]) => {
    onChange?.(next)
  }

  const addOption = () => {
    const val = optionInput.trim()
    if (!val) return
    if (list.some((o) => (o.labelI18n?.zh ?? o.label ?? '').trim() === val)) {
      messageApi.warning('选项已存在')
      return
    }
    const autoValue = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    patch([...list, { value: autoValue, label: val, labelI18n: { zh: val } }])
    setOptionInput('')
  }

  const openDrawer = (index: number) => {
    const o = list[index]
    if (!o) return
    setDrawerIndex(index)
    setDrawerValueStr(o.value)
  }

  const closeDrawer = () => {
    setDrawerIndex(null)
    setDrawerValueStr('')
  }

  const drawerOpt = drawerIndex != null && drawerIndex >= 0 ? list[drawerIndex] : null

  const handleDrawerI18nSave = (i18n: I18nLabels) => {
    if (drawerIndex == null) return
    const newVal = drawerValueStr.trim()
    if (!newVal) {
      messageApi.warning('请填写技术值（实例中存储的值）')
      return
    }
    if (list.some((o, i) => i !== drawerIndex && o.value === newVal)) {
      messageApi.warning('技术值不能与已有选项重复')
      return
    }
    const zh = (i18n.zh ?? '').trim()
    const next = [...list]
    next[drawerIndex] = {
      value: newVal,
      label: zh || newVal,
      labelI18n: i18n,
    }
    patch(next)
    messageApi.success('已保存')
    closeDrawer()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {contextHolder}
      {list.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 10,
            background: '#EEF2F7',
            border: '1px solid #DDE3EC',
            borderRadius: 8,
          }}
        >
          {list.map((opt, idx) => (
            <div
              key={`${opt.value}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                padding: '10px 12px',
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
              }}
            >
              <span
                style={{
                  position: 'relative',
                  paddingLeft: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#1F2937',
                  flex: '1 1 auto',
                  minWidth: 48,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background: '#1677FF',
                    opacity: 0.85,
                  }}
                />
                {optionRowLabel(opt)}
              </span>
              <Tooltip title="侧滑抽屉配置多语言与技术值">
                <Button
                  size="small"
                  type="text"
                  icon={<Languages size={12} />}
                  style={{ color: '#1677FF', padding: '0 4px', height: 20, flexShrink: 0 }}
                  onClick={() => openDrawer(idx)}
                />
              </Tooltip>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: '0 1 auto' }}>
                {LANGUAGES.filter((l) => {
                  const t =
                    l.code === 'zh'
                      ? opt.labelI18n?.zh?.trim() || opt.label?.trim()
                      : opt.labelI18n?.[l.code]?.trim()
                  return !!t
                }).map((l) => {
                  const text =
                    l.code === 'zh'
                      ? opt.labelI18n?.zh?.trim() || opt.label?.trim() || ''
                      : opt.labelI18n?.[l.code]?.trim() || ''
                  return (
                    <Tooltip key={l.code} title={`${l.label}: ${text}`}>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#6B7280',
                          background: '#F3F4F6',
                          padding: '1px 5px',
                          borderRadius: 3,
                          cursor: 'default',
                          lineHeight: '18px',
                        }}
                      >
                        {l.code}
                      </span>
                    </Tooltip>
                  )
                })}
              </div>
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={13} />}
                style={{ padding: '0 4px', flexShrink: 0, marginLeft: 'auto' }}
                onClick={() => {
                  patch(list.filter((_, i) => i !== idx))
                  if (drawerIndex === idx) closeDrawer()
                  else if (drawerIndex != null && drawerIndex > idx) setDrawerIndex(drawerIndex - 1)
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Input
          value={optionInput}
          onChange={(e) => setOptionInput(e.target.value)}
          onPressEnter={addOption}
          placeholder="输入选项名称，按回车添加"
          size="middle"
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button
          type="primary"
          size="middle"
          icon={<Plus size={14} />}
          onClick={addOption}
          style={{ borderRadius: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          添加
        </Button>
      </div>
      {list.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF' }}>暂无选项，输入后按回车或点击「添加」</div>}

      {drawerOpt && drawerIndex != null && (
        <Drawer
          title={`选项多语言 · ${optionRowLabel(drawerOpt)}`}
          open
          onClose={closeDrawer}
          size={400}
          destroyOnHidden
          styles={{ body: { paddingTop: 8 } }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>技术值（实例存储）</div>
            <Input
              value={drawerValueStr}
              onChange={(e) => setDrawerValueStr(e.target.value)}
              placeholder="如 true、normal、opt_xxx"
            />
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>与「关联数据」里该字段保存的值一致，勿与已有选项重复。</div>
          </div>
          <FieldI18nEditor
            key={drawerIndex}
            i18n={{
              ...(drawerOpt.labelI18n || {}),
              zh: drawerOpt.labelI18n?.zh ?? drawerOpt.label,
            }}
            fieldLabel={optionRowLabel(drawerOpt)}
            onSave={handleDrawerI18nSave}
            onCancel={closeDrawer}
          />
        </Drawer>
      )}
    </div>
  )
}
