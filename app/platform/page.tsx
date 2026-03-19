'use client'

import UnderDevelopment from '../components/UnderDevelopment'

export default function PlatformPage() {
  return (
    <UnderDevelopment
      title="应用"
      breadcrumbItems={[{ label: '平台', href: '/platform' }, { label: '应用' }]}
    />
  )
}
