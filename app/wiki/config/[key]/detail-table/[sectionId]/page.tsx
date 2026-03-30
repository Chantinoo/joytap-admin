import DetailTableDataPageClient from './DetailTableDataPageClient'

function safeDecodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export default async function DetailTableDataPage({
  params,
}: {
  params: Promise<{ key: string; sectionId: string }>
}) {
  const { key, sectionId } = await params
  return (
    <DetailTableDataPageClient wikiKey={key} sectionId={safeDecodePathSegment(sectionId)} />
  )
}
