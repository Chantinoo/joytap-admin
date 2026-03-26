import WikiDataPageClient from './WikiDataPageClient'

export default async function WikiDataPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  return <WikiDataPageClient wikiKey={key} />
}
