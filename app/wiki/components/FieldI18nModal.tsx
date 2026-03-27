'use client'

import React, { useState } from 'react'
import { Modal, Tag } from 'antd'
import { Languages } from 'lucide-react'
import FieldI18nEditor from './FieldI18nEditor'
import { type I18nLabels } from './fieldI18nConstants'

export type { LangCode, I18nLabels } from './fieldI18nConstants'
export { LANGUAGES, mockTranslateFieldI18n } from './fieldI18nConstants'

interface Props {
  open: boolean
  fieldKey: string
  fieldLabel: string
  i18n: I18nLabels
  onSave: (i18n: I18nLabels) => void
  onCancel: () => void
}

export default function FieldI18nModal({ open, fieldKey, fieldLabel, i18n, onSave, onCancel }: Props) {
  const [version, setVersion] = useState(0)
  React.useEffect(() => {
    if (open) setVersion(v => v + 1)
  }, [open, i18n])

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Languages size={16} style={{ color: '#1677FF' }} />
          <span>多语言配置</span>
          <Tag style={{ marginLeft: 4, fontSize: 12 }}>{fieldKey}</Tag>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={520}
      destroyOnHidden
    >
      <FieldI18nEditor key={version} i18n={i18n} fieldLabel={fieldLabel} onSave={onSave} onCancel={onCancel} />
    </Modal>
  )
}
