'use client'

import UnderDevelopment from '../components/UnderDevelopment'

export default function ContentPage() {
  return (
    <UnderDevelopment
      title="内容管理"
      breadcrumbItems={[{ label: '内容', href: '/content' }, { label: '帖子' }]}
    />
  )
}
