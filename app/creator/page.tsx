'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatorIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/creator/creators')
  }, [router])
  return null
}
