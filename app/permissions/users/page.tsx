'use client'

import UnderDevelopment from '../../components/UnderDevelopment'

export default function PermissionsUsersPage() {
  return (
    <UnderDevelopment
      title="用户"
      breadcrumbItems={[{ label: '权限管理', href: '/permissions' }, { label: '用户' }]}
    />
  )
}
