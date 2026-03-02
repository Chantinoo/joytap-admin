'use client'

import React from 'react'
import { Tooltip } from 'antd'
import { Languages } from 'lucide-react'

export default function Header() {
  return (
    <header style={{
      height: 48,
      background: '#fff',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* 语言切换 */}
      <Tooltip title="切换语言">
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          borderRadius: 6,
          color: '#6B7280',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
        >
          <Languages size={18} />
        </button>
      </Tooltip>

      {/* 用户头像 + 名称 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 6,
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          管
        </div>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>User1153159</span>
      </div>
    </header>
  )
}
