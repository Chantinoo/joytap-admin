'use client'

import React, { useState } from 'react'
import { Select, Button } from 'antd'

interface Game {
  id: string
  name: string
  icon: string  // emoji 或图片 URL
}

const MOCK_GAMES: Game[] = [
  { id: 'g1', name: '仙境传说3', icon: '🎮' },
  { id: 'g2', name: '永劫无间', icon: '⚔️' },
  { id: 'g3', name: '原神', icon: '✨' },
  { id: 'g4', name: '王者荣耀', icon: '🏆' },
  { id: 'g5', name: '和平精英', icon: '🎯' },
]

interface Props {
  onQuery?: (gameId: string | undefined) => void
}

export default function GameFilter({ onQuery }: Props) {
  const [selectedGame, setSelectedGame] = useState<string | undefined>(undefined)
  const [queried, setQueried] = useState<string | undefined>(undefined)

  const handleReset = () => {
    setSelectedGame(undefined)
    setQueried(undefined)
    onQuery?.(undefined)
  }

  const handleQuery = () => {
    setQueried(selectedGame)
    onQuery?.(selectedGame)
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 6,
      border: '1px solid #E5E7EB',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* 左：游戏筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>论坛：</span>
        <Select
          value={selectedGame}
          onChange={setSelectedGame}
          style={{ width: 200 }}
          size="middle"
          allowClear
          placeholder="请选择论坛"
          optionLabelProp="label"
        >
          {MOCK_GAMES.map((g) => (
            <Select.Option
              key={g.id}
              value={g.id}
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, lineHeight: 1 }}>{g.icon}</span>
                  <span style={{ fontSize: 13 }}>{g.name}</span>
                </span>
              }
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{g.icon}</span>
                <span style={{ fontSize: 13 }}>{g.name}</span>
              </span>
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* 右：操作按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button style={{ fontSize: 13, borderRadius: 4 }} onClick={handleReset}>
          重置
        </Button>
        <Button
          type="primary"
          style={{ fontSize: 13, borderRadius: 4 }}
          onClick={handleQuery}
        >
          查询
        </Button>
      </div>
    </div>
  )
}
