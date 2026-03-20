import CollectionPageDetailClient from './CollectionPageDetailClient'

export default async function CollectionPageDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CollectionPageDetailClient pageId={id} />
}
