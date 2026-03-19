'use client'

import UnderDevelopment from '../components/UnderDevelopment'

export default function PermissionsPage() {
  return (
    <UnderDevelopment
      title="角色"
      breadcrumbItems={[{ label: '权限', href: '/permissions' }, { label: '角色' }]}
    />
  )
}
