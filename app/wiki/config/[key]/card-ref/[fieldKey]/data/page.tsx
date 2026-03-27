import CardRefLinkedDataPageClient from './CardRefLinkedDataPageClient'

export default async function CardRefLinkedDataPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string; fieldKey: string }>
  searchParams: Promise<{ label?: string }>
}) {
  const { key, fieldKey } = await params
  const { label } = await searchParams
  return (
    <CardRefLinkedDataPageClient
      key={`${key}-${fieldKey}`}
      wikiKey={key}
      fieldKey={fieldKey}
      fieldLabel={label?.trim() ? label : fieldKey}
    />
  )
}
