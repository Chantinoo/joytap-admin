import React, { Suspense } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { CollectionPagesProvider } from './context/CollectionPagesContext'
import { LeaveGuardProvider } from './context/LeaveGuardContext'
import { ForumFilterProvider } from './context/ForumFilterContext'
import { RoleProvider } from './context/RoleContext'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <LeaveGuardProvider>
          <ForumFilterProvider>
          <RoleProvider>
          <CollectionPagesProvider>
            <div style={{ display: 'flex', height: '100vh', background: '#F5F7FA' }}>
              <Suspense fallback={<div style={{ width: 200, background: '#fff', borderRight: '1px solid #E5E7EB' }} />}>
                <Sidebar />
              </Suspense>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header />
                <main style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                  {children}
                </main>
              </div>
            </div>
          </CollectionPagesProvider>
          </RoleProvider>
          </ForumFilterProvider>
          </LeaveGuardProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
