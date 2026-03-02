'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export type BreadcrumbItem = { label: string; href?: string }

type Props = {
  items: BreadcrumbItem[]
}

export default function PageBreadcrumb({ items }: Props) {
  const router = useRouter()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 0',
        marginBottom: 4,
      }}
    >
      <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ margin: '0 6px', color: '#9CA3AF' }}>/</span>}
            {item.href ? (
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  router.push(item.href!)
                }}
                style={{ color: '#1677FF', textDecoration: 'none' }}
              >
                {item.label}
              </a>
            ) : (
              <span style={{ color: '#111827' }}>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    </div>
  )
}
