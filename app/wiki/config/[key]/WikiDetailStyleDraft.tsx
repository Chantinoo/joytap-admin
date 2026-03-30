'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Detail1Config, Detail2Config, DetailStyle } from '../../components/DetailStylePreview'

const defaultDetail1 = (): Detail1Config => ({
  mainTitle: '基本信息',
  mainFieldKeys: [],
  middleSections: [],
  sideTitle: '道具信息',
  sideFieldKeys: [],
})

const defaultDetail2 = (): Detail2Config => ({
  mainFieldKeys: [],
  sideTitle: '道具信息',
  sideFieldKeys: [],
})

type WikiDetailStyleDraftContextValue = {
  wikiKey: string
  selectedDetailStyle: DetailStyle
  setSelectedDetailStyle: React.Dispatch<React.SetStateAction<DetailStyle>>
  detail1Config: Detail1Config
  setDetail1Config: React.Dispatch<React.SetStateAction<Detail1Config>>
  detail2Config: Detail2Config
  setDetail2Config: React.Dispatch<React.SetStateAction<Detail2Config>>
}

const WikiDetailStyleDraftContext = createContext<WikiDetailStyleDraftContextValue | null>(null)

export function WikiDetailStyleDraftProvider({
  wikiKey,
  children,
}: {
  wikiKey: string
  children: React.ReactNode
}) {
  const [selectedDetailStyle, setSelectedDetailStyle] = useState<DetailStyle>('detail-1')
  const [detail1Config, setDetail1Config] = useState<Detail1Config>(defaultDetail1)
  const [detail2Config, setDetail2Config] = useState<Detail2Config>(defaultDetail2)

  useEffect(() => {
    setSelectedDetailStyle('detail-1')
    setDetail1Config(defaultDetail1())
    setDetail2Config(defaultDetail2())
  }, [wikiKey])

  const value = useMemo(
    () => ({
      wikiKey,
      selectedDetailStyle,
      setSelectedDetailStyle,
      detail1Config,
      setDetail1Config,
      detail2Config,
      setDetail2Config,
    }),
    [wikiKey, selectedDetailStyle, detail1Config, detail2Config],
  )

  return (
    <WikiDetailStyleDraftContext.Provider value={value}>{children}</WikiDetailStyleDraftContext.Provider>
  )
}

export function useWikiDetailStyleDraft(): WikiDetailStyleDraftContextValue {
  const ctx = useContext(WikiDetailStyleDraftContext)
  if (!ctx) {
    throw new Error('useWikiDetailStyleDraft 须在 WikiDetailStyleDraftProvider 内使用')
  }
  return ctx
}
