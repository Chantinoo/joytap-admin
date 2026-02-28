'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutGrid, BarChart2, Users, Settings } from 'lucide-react'
import './globals.css'

const menuItems = [
  { key: '/tab-route', label: 'Content Management', icon: <LayoutGrid size={18} /> },
  { key: '/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { key: '/users', label: 'User Management', icon: <Users size={18} /> },
  { key: '/settings', label: 'Settings', icon: <Settings size={18} /> },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', height: '100vh', background: '#F8F9FB' }}>
          <aside
            style={{
              width: 240,
              background: '#fff',
              borderRight: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#4F46E5',
                }}
              />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Joytap</span>
            </div>

            <div style={{ height: 1, background: '#E5E7EB' }} />

            <nav style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#9CA3AF',
                  padding: '4px 8px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Content
              </div>
              {menuItems.map((item) => {
                const isActive = pathname?.startsWith(item.key)
                return (
                  <div
                    key={item.key}
                    onClick={() => router.push(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '0 12px',
                      height: 40,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isActive ? '#EEF2FF' : 'transparent',
                      color: isActive ? '#4F46E5' : '#6B7280',
                      fontWeight: isActive ? 500 : 400,
                      fontSize: 14,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    {item.label}
                  </div>
                )
              })}
            </nav>
          </aside>

          <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
