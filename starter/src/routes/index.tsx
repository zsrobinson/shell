import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Page, PageHeader, PageTitle, PageMeta } from "@zsrobinson/shell"
import { ListRow } from "@zsrobinson/shell/blocks/list-row"
import { QueryError } from "@zsrobinson/shell/blocks/query-error"
import { getJson } from "@zsrobinson/shell/lib/api"
export const Route = createFileRoute("/")({ component: Items })
function Items() {
  const items = useQuery({
    queryKey: ["items"],
    queryFn: () => getJson<{ id: string; name: string }[]>("/api/items"),
  })
  return (
    <Page>
      <PageHeader>
        <PageTitle>Items</PageTitle>
        <PageMeta>{items.data?.length ?? 0} items</PageMeta>
      </PageHeader>
      {items.error ? (
        <QueryError
          title="Items failed to load"
          error={items.error}
          onRetry={() => void items.refetch()}
        />
      ) : (
        <div role="list">
          {items.data?.map((item) => (
            <ListRow key={item.id} name={item.name}>
              <Link to="/items/$id" params={{ id: item.id }}>
                Open
              </Link>
            </ListRow>
          ))}
        </div>
      )}
    </Page>
  )
}
