'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type AdminRole = 'platform' | 'vendor'

type RoleContextValue = {
  role: AdminRole
  setRole: (role: AdminRole) => void
  isVendor: boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

/** 厂商身份下不开放的菜单 key（显示划掉但不隐藏） */
export const VENDOR_RESTRICTED_KEYS = new Set([
  '/users',             // 用户列表
  '/users/sockpuppet',  // 马甲号
  '/platform',          // 应用
  '/permissions',       // 角色
  '/permissions/users', // 用户
])

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<AdminRole>('platform')

  const setRole = useCallback((r: AdminRole) => {
    setRoleState(r)
  }, [])

  const value: RoleContextValue = {
    role,
    setRole,
    isVendor: role === 'vendor',
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): RoleContextValue | null {
  return useContext(RoleContext)
}
