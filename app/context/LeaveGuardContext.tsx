'use client'

import React, { createContext, useCallback, useRef, useState } from 'react'
import { Modal } from 'antd'

type Guard = {
  getDirty: () => boolean
  onSave: () => void
}

type ContextValue = {
  setGuard: (getDirty: () => boolean, onSave: () => void) => void
  clearGuard: () => void
  checkBeforeLeave: (next: () => void) => void
}

const LeaveGuardContext = createContext<ContextValue | null>(null)

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const guardRef = useRef<Guard | null>(null)
  const [modal, contextHolder] = Modal.useModal()

  const setGuard = useCallback((getDirty: () => boolean, onSave: () => void) => {
    guardRef.current = { getDirty, onSave }
  }, [])

  const clearGuard = useCallback(() => {
    guardRef.current = null
  }, [])

  const checkBeforeLeave = useCallback((next: () => void) => {
    const guard = guardRef.current
    if (!guard?.getDirty() || !guard.getDirty()) {
      next()
      return
    }
    modal.confirm({
      title: '未保存的修改',
      content: '当前有未保存的修改，是否保存后再离开？',
      okText: '保存并离开',
      cancelText: '取消',
      onOk: () => {
        guard.onSave()
        next()
      },
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <CancelBtn />
          <button
            type="button"
            className="ant-btn ant-btn-default"
            onClick={() => {
              modal.destroyAll()
              next()
            }}
            style={{ marginLeft: 8 }}
          >
            不保存离开
          </button>
          <OkBtn />
        </>
      ),
    })
  }, [modal])

  const value: ContextValue = { setGuard, clearGuard, checkBeforeLeave }

  return (
    <LeaveGuardContext.Provider value={value}>
      {contextHolder}
      {children}
    </LeaveGuardContext.Provider>
  )
}

export function useLeaveGuard() {
  return React.useContext(LeaveGuardContext)
}
