import { createFileRoute } from "@tanstack/react-router"
import { Page, PageTitle } from "@zsrobinson/shell"
import { DetailList, DetailRow } from "@zsrobinson/shell/blocks/detail-list"
import { getJson } from "@zsrobinson/shell/lib/api"
export const Route = createFileRoute("/items/$id")({
  loader: ({ params }) =>
    getJson<{ id: string; name: string }>(
      `/api/items/${encodeURIComponent(params.id)}`
    ),
  component: Detail,
})
function Detail() {
  const item = Route.useLoaderData()
  return (
    <Page>
      <PageTitle>{item.name}</PageTitle>
      <DetailList>
        <DetailRow label="ID">
          <code className="font-mono text-code">{item.id}</code>
        </DetailRow>
      </DetailList>
    </Page>
  )
}
