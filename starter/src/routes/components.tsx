import { ChartGallery } from "../chart-gallery"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@zsrobinson/shell/ui/select"
import { useLayoutEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Page,
  PageHeader,
  PageTitle,
  PageActions,
  AppIcon,
  toast,
} from "@zsrobinson/shell"
import { Alert, AlertTitle, AlertDescription } from "@zsrobinson/shell/ui/alert"
import { Badge } from "@zsrobinson/shell/ui/badge"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@zsrobinson/shell/ui/breadcrumb"
import { Button } from "@zsrobinson/shell/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
  CardAction,
} from "@zsrobinson/shell/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@zsrobinson/shell/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@zsrobinson/shell/ui/dropdown-menu"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@zsrobinson/shell/ui/empty"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldSeparator,
} from "@zsrobinson/shell/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from "@zsrobinson/shell/ui/input-group"
import { Input } from "@zsrobinson/shell/ui/input"
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
} from "@zsrobinson/shell/ui/item"
import { Kbd, KbdGroup } from "@zsrobinson/shell/ui/kbd"
import { Label } from "@zsrobinson/shell/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@zsrobinson/shell/ui/native-select"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@zsrobinson/shell/ui/progress"
import { Separator } from "@zsrobinson/shell/ui/separator"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@zsrobinson/shell/ui/sheet"
import { Skeleton } from "@zsrobinson/shell/ui/skeleton"
import { Spinner } from "@zsrobinson/shell/ui/spinner"
import { Switch } from "@zsrobinson/shell/ui/switch"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
  TableFooter,
} from "@zsrobinson/shell/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@zsrobinson/shell/ui/tabs"
import { Textarea } from "@zsrobinson/shell/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@zsrobinson/shell/ui/toggle-group"
import { Toggle } from "@zsrobinson/shell/ui/toggle"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@zsrobinson/shell/ui/tooltip"
import { ConfirmAction } from "@zsrobinson/shell/blocks/confirm-action"
import { CopyButton } from "@zsrobinson/shell/blocks/copy-button"
import {
  DetailList,
  DetailRow,
  Unavailable,
} from "@zsrobinson/shell/blocks/detail-list"
import { ListRow, EmptyList } from "@zsrobinson/shell/blocks/list-row"
import { QueryError } from "@zsrobinson/shell/blocks/query-error"
import { FileDrop } from "@zsrobinson/shell/blocks/file-drop"
import { UploadProgress } from "@zsrobinson/shell/blocks/upload-progress"
import {
  SignedOut,
  NotFound,
  RouteError,
} from "@zsrobinson/shell/blocks/page-states"
export const Route = createFileRoute("/components")({ component: Components })
function Components() {
  const theme = new URLSearchParams(window.location.search).get("theme")
  const isolated = theme === "light" || theme === "dark"
  useLayoutEffect(() => {
    if (isolated) document.documentElement.className = theme
  }, [isolated, theme])
  if (isolated)
    return (
      <div className="bg-background p-4 text-foreground">
        <Gallery />
        <ChartGallery />
      </div>
    )
  return (
    <Page>
      <PageHeader>
        <PageTitle>Components</PageTitle>
        <PageActions>
          <Button onClick={() => toast.success("Saved")}>Toast</Button>
        </PageActions>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <section key={theme}>
            <h2 className="mb-4 text-lg font-medium">{theme}</h2>
            <iframe
              title={`${theme} components`}
              src={`/components?theme=${theme}`}
              className="h-[3500px] w-full rounded-2xl border"
            />
          </section>
        ))}
      </div>
    </Page>
  )
}
function Gallery() {
  const [file, setFile] = useState<File | null>(null)
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Buttons and status</CardTitle>
            <CardDescription>Variants</CardDescription>
            <CardAction>
              <Badge>Ready</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            {(
              [
                "default",
                "secondary",
                "outline",
                "ghost",
                "destructive",
                "link",
              ] as const
            ).map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Spinner />
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Failed</Badge>
            <Toggle aria-label="Bold">B</Toggle>
            <ToggleGroup multiple defaultValue={["left"]}>
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
          <CardFooter>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </CardFooter>
        </Card>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Items</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Example</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Alert>
          <AlertTitle>Ready</AlertTitle>
          <AlertDescription>Changes saved.</AlertDescription>
        </Alert>
        <QueryError
          title="Load failed"
          error={new Error("Request unavailable")}
          onRetry={() => toast("Retry requested")}
        />
        <FieldSet>
          <FieldLegend>Fields</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="gallery-name">Name</FieldLabel>
              <Input id="gallery-name" placeholder="Example" />
              <FieldDescription>Display name</FieldDescription>
            </Field>
            <FieldSeparator />
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea placeholder="Notes" />
            </Field>
            <Field data-invalid>
              <FieldLabel>Invalid</FieldLabel>
              <Input aria-invalid defaultValue="Invalid value" />
              <FieldError>Choose a different value.</FieldError>
            </Field>
            <Label className="flex items-center gap-2">
              <Switch defaultChecked />
              Enabled
            </Label>
            <NativeSelect aria-label="Group">
              <NativeSelectOptGroup label="Groups">
                <NativeSelectOption>Default</NativeSelectOption>
                <NativeSelectOption>Other</NativeSelectOption>
              </NativeSelectOptGroup>
            </NativeSelect>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="example.test" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton>Open</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </FieldGroup>
        </FieldSet>
        <Select defaultValue="example">
          <SelectTrigger aria-label="Select example">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="example">Example</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Separator />
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <DetailList>
              <DetailRow label="Size">1.0 MiB</DetailRow>
              <DetailRow label="Address">
                <span className="font-mono text-xs">example.test</span>
                <CopyButton value="example.test" label="Copy address" />
              </DetailRow>
              <DetailRow label="Updated">
                <Unavailable />
              </DetailRow>
            </DetailList>
          </TabsContent>
          <TabsContent value="history">
            <EmptyList>No history</EmptyList>
          </TabsContent>
        </Tabs>
        <ItemGroup>
          <Item>
            <ItemMedia>
              <AppIcon name="Example" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Item</ItemTitle>
              <ItemDescription>Details</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="xs">Open</Button>
            </ItemActions>
          </Item>
          <ItemSeparator />
          <ListRow name="List row" detail="Details">
            <Button size="xs" variant="outline">
              Open
            </Button>
          </ListRow>
        </ItemGroup>
        <Table>
          <TableCaption>Items</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Example</TableCell>
              <TableCell>Ready</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>1 item</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <Progress value={40}>
          <ProgressLabel>Progress</ProgressLabel>
          <ProgressValue />
        </Progress>
        <Skeleton className="h-8 w-full" />
        <FileDrop
          accept="*"
          file={file}
          onFile={setFile}
          label="Choose a file"
        />
        <UploadProgress fraction={0.65} label="Uploading" />
        <div className="flex flex-wrap gap-2">
          <ConfirmAction
            title="Confirm action"
            confirmLabel="Confirm"
            trigger={<Button variant="outline">Confirm</Button>}
            onConfirm={async () => {
              toast.success("Confirmed")
            }}
          >
            Continue with this action?
          </ConfirmAction>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm</DialogTitle>
                <DialogDescription>Continue?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button />}>Done</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              Sheet
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Example links</SheetDescription>
              </SheetHeader>
              <a href="/">Items</a>
              <SheetFooter>
                <SheetClose render={<Button />}>Close</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Menu
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast("Opened")}>
                Open
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>
              Tooltip
            </TooltipTrigger>
            <TooltipContent>Helpful label</TooltipContent>
          </Tooltip>
        </div>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <AppIcon name="Example" />
            </EmptyMedia>
            <EmptyTitle>No items</EmptyTitle>
            <EmptyDescription>0 items</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Add item</Button>
          </EmptyContent>
        </Empty>
        <SignedOut />
        <NotFound />
        <RouteError
          error={new Error("Request failed")}
          reset={() => toast("Retry requested")}
        />
      </div>
    </TooltipProvider>
  )
}
