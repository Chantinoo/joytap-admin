import WikiConfigPageClient from './WikiConfigPageClient'

export default async function WikiConfigPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  return <WikiConfigPageClient wikiKey={key} />
}
