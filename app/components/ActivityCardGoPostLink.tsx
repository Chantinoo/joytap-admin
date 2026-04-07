'use client'

import Link from 'next/link'

/** 活动卡片分区「去发帖」跳转：后台帖子管理入口（可按产品改为新建帖路由） */
export const ACTIVITY_CARD_POST_HREF = '/content'

type Props = {
  className?: string
  style?: React.CSSProperties
}

export default function ActivityCardGoPostLink({ className, style }: Props) {
  return (
    <Link
      href={ACTIVITY_CARD_POST_HREF}
      className={className}
      style={{
        fontSize: 12,
        color: '#1677FF',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      去发帖
    </Link>
  )
}
