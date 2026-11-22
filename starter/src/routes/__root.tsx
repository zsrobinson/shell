import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router"
import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import { AppShell, type AppLink } from "@zsrobinson/shell"
import { ListIcon, ReceiptIcon, ShapesIcon } from "lucide-react"
import {
  NotFound,
  RouteError,
  SignedOut,
} from "@zsrobinson/shell/blocks/page-states"
import { ApiError, getJson } from "@zsrobinson/shell/lib/api"
// Invented records standing in for an app's search endpoint.
const records = [
  { id: "corner-market", name: "Corner Market", detail: "$64.20" },
  { id: "bean-there", name: "Bean There", detail: "$5.75" },
  { id: "city-power", name: "City Power", detail: "$88.10" },
  { id: "metro-card", name: "Metro card reload", detail: "$40.00" },
  { id: "paper-moon", name: "Paper Moon Books", detail: "$23.40" },
]
const searchRecords = (query: string) =>
  new Promise<typeof records>((resolve) =>
    setTimeout(() => {
      const q = query.trim().toLowerCase()
      resolve(
        records.filter(
          (r) => r.name.toLowerCase().includes(q) || r.detail.includes(q)
        )
      )
    }, 350)
  )
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: Root,
    notFoundComponent: () => <NotFound />,
    errorComponent: RouteError,
  }
)
function Root() {
  const navigate = useNavigate()
  const pathname = useLocation({ select: (l) => l.pathname })
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () =>
      getJson<{ email: string; services: AppLink[] }>("/api/session"),
    retry: false,
  })
  const [query, setQuery] = useState("")
  const found = useQuery({
    queryKey: ["search", query.trim()],
    queryFn: () => searchRecords(query),
    enabled: query.trim().length > 1,
    placeholderData: keepPreviousData,
  })
  if (
    ["light", "dark"].includes(
      new URLSearchParams(window.location.search).get("theme") || ""
    )
  )
    return <Outlet />
  return (
    <div data-hue="bl">
      <AppShell
        name="Example"
        email={session.data?.email}
        searchPlaceholder="Jump to a page or find a record…"
        search={{
          onQueryChange: setQuery,
          loading: found.isFetching,
          groups:
            query.trim().length > 1 && found.data
              ? [
                  {
                    id: "records",
                    label: "Records",
                    items: found.data.map((r) => ({
                      id: r.id,
                      label: r.name,
                      icon: <ReceiptIcon />,
                      badge: r.detail,
                      render: <Link to="/items/$id" params={{ id: r.id }} />,
                      onSelect: () =>
                        void navigate({
                          to: "/items/$id",
                          params: { id: r.id },
                        }),
                    })),
                  },
                ]
              : [],
        }}
        apps={session.data?.services}
        navGroups={[
          {
            id: "main",
            items: [
              {
                id: "items",
                label: "Items",
                icon: <ListIcon />,
                render: <Link to="/" />,
                onSelect: () => void navigate({ to: "/" }),
                active: pathname === "/",
              },
              {
                id: "components",
                label: "Components",
                icon: <ShapesIcon />,
                render: <Link to="/components" />,
                onSelect: () => void navigate({ to: "/components" }),
                active: pathname === "/components",
              },
            ],
          },
        ]}
      >
        {session.error instanceof ApiError && session.error.status === 401 ? (
          <SignedOut />
        ) : (
          <Outlet />
        )}
      </AppShell>
    </div>
  )
}
