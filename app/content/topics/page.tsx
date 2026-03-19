'use client'

import UnderDevelopment from '../../components/UnderDevelopment'

export default function ContentTopicsPage() {
  return (
    <UnderDevelopment
      title="话题"
      breadcrumbItems={[{ label: '内容管理', href: '/content' }, { label: '话题' }]}
    />
  )
}
