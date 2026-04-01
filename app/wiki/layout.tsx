import type { ReactNode } from 'react'
import { WikiFieldsRegistryProvider } from './config/WikiFieldsRegistry'
import { WikiRelationsRegistryProvider } from './config/WikiRelationsRegistry'

export default function WikiLayout({ children }: { children: ReactNode }) {
  return (
    <WikiFieldsRegistryProvider>
      <WikiRelationsRegistryProvider>{children}</WikiRelationsRegistryProvider>
    </WikiFieldsRegistryProvider>
  )
}
