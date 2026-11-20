import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import { AppShell, type AppLink } from "@zsrobinson/shell"
import { ListIcon, ShapesIcon } from "lucide-react"
import {
  NotFound,
  RouteError,
  SignedOut,
} from "@zsrobinson/shell/blocks/page-states"
import { ApiError, getJson } from "@zsrobinson/shell/lib/api"
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: Root,
    notFoundComponent: () => <NotFound />,
    errorComponent: RouteError,
  }
)
function Root() {
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () =>
      getJson<{ email: string; services: AppLink[] }>("/api/session"),
    retry: false,
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
              },
              {
                id: "components",
                label: "Components",
                icon: <ShapesIcon />,
                render: <Link to="/components" />,
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
