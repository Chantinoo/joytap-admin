import WikiRelationDataPageClient from './WikiRelationDataPageClient'

export default async function WikiRelationDataPage({
  params,
}: {
  params: Promise<{ relationKey: string }>
}) {
  const { relationKey: raw } = await params
  const relationKey = decodeURIComponent(raw)
  return <WikiRelationDataPageClient relationKey={relationKey} />
}
