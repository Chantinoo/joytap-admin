import TabEditPageClient from './TabEditPageClient'

export default async function TabEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TabEditPageClient tabId={id} />
}
