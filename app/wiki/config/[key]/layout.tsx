import type { ReactNode } from 'react'
import { WikiDetailStyleDraftProvider } from './WikiDetailStyleDraft'

export default async function WikiKeyLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  return <WikiDetailStyleDraftProvider wikiKey={key}>{children}</WikiDetailStyleDraftProvider>
}
