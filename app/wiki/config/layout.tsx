import type { ReactNode } from 'react'
import { WikiFieldsRegistryProvider } from './WikiFieldsRegistry'

export default function WikiConfigLayout({ children }: { children: ReactNode }) {
  return <WikiFieldsRegistryProvider>{children}</WikiFieldsRegistryProvider>
}
