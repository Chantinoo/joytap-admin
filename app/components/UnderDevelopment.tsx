'use client'

import React from 'react'
import { Construction } from 'lucide-react'
import type { BreadcrumbItem } from './PageBreadcrumb'
import PageBreadcrumb from './PageBreadcrumb'

type Props = {
  title: string
  breadcrumbItems?: BreadcrumbItem[]
}

export default function UnderDevelopment({ title, breadcrumbItems }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <PageBreadcrumb items={breadcrumbItems} />
      )}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          minHeight: 280,
        }}
      >
        <Construction size={48} color="#9CA3AF" />
        <span style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>
          {title}
        </span>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>
          该功能正在开发中，敬请期待
        </span>
      </div>
    </div>
  )
}
