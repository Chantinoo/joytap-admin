import { Suspense } from 'react'
import WikiRelationsPageClient from './WikiRelationsPageClient'

export default function WikiRelationsPage() {
  return (
    <Suspense fallback={null}>
      <WikiRelationsPageClient />
    </Suspense>
  )
}
