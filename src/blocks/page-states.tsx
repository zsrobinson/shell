import { Page } from "../app/page"
import { QueryError } from "./query-error"
import { Button } from "../components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../components/ui/empty"
export function RouteError({
  error,
  reset,
}: {
  error: unknown
  reset: () => void
}) {
  return (
    <Page>
      <QueryError
        title="This page failed to load"
        error={error}
        onRetry={reset}
      />
    </Page>
  )
}

export function SignedOut() {
  return (
    <Page>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Signed out</EmptyTitle>
          <EmptyDescription>Your access session has ended.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => location.reload()}>Sign in again</Button>
        </EmptyContent>
      </Empty>
    </Page>
  )
}

export function NotFound({ homeLabel = "Go home" }: { homeLabel?: string }) {
  return (
    <Page>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Page not found</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<a href="/" />} nativeButton={false}>
            {homeLabel}
          </Button>
        </EmptyContent>
      </Empty>
    </Page>
  )
}
