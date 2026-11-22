import { useState } from "react"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSelectTrigger,
  ComboboxValue,
} from "@zsrobinson/shell/ui/combobox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zsrobinson/shell/ui/card"
import { Field, FieldLabel } from "@zsrobinson/shell/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zsrobinson/shell/ui/table"

type Category = { value: string; label: string; child?: boolean }
type CategoryGroup = { value: string; items: Category[] }

const groups: CategoryGroup[] = [
  {
    value: "Spending",
    items: [
      { value: "food", label: "Food" },
      { value: "groceries", label: "Groceries", child: true },
      { value: "dining", label: "Dining out", child: true },
      { value: "coffee", label: "Coffee", child: true },
      { value: "home", label: "Home" },
      { value: "rent", label: "Rent", child: true },
      { value: "utilities", label: "Utilities", child: true },
      { value: "internet", label: "Internet", child: true },
      { value: "transit", label: "Transit" },
    ],
  },
  {
    value: "Income",
    items: [
      { value: "salary", label: "Salary" },
      { value: "interest", label: "Interest" },
    ],
  },
]
const all = groups.flatMap((g) => g.items)
const byValue = (value: string) => all.find((c) => c.value === value) ?? null

/** How an app might wrap the primitives once for its own category list. */
function CategoryPicker({
  value,
  onChange,
  variant = "field",
  size,
  label,
  placeholder = "Choose a category",
}: {
  value: Category | null
  onChange: (value: Category | null) => void
  variant?: "field" | "chip"
  size?: "sm" | "default"
  label?: string
  placeholder?: string
}) {
  return (
    <Combobox
      items={groups}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={(c: Category) => c.label}
      isItemEqualToValue={(a: Category, b: Category) => a.value === b.value}
    >
      <ComboboxSelectTrigger
        variant={variant}
        size={size}
        aria-label={label}
        className={variant === "field" ? "w-full" : undefined}
      >
        <ComboboxValue placeholder={placeholder} />
      </ComboboxSelectTrigger>
      <ComboboxContent className="min-w-60">
        <ComboboxInput showTrigger={false} placeholder="Search categories" />
        <ComboboxEmpty>No categories found</ComboboxEmpty>
        <ComboboxList>
          {(group: CategoryGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item: Category) => (
                  <ComboboxItem
                    key={item.value}
                    value={item}
                    inset={item.child}
                  >
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

const rows = [
  { id: "t1", payee: "Corner Market", amount: "$64.20", category: "groceries" },
  { id: "t2", payee: "Bean There", amount: "$5.75", category: "coffee" },
  { id: "t3", payee: "City Power", amount: "$88.10", category: "" },
]

export function ComboboxGallery() {
  const [category, setCategory] = useState<Category | null>(byValue("dining"))
  const [assigned, setAssigned] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.category]))
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Combobox</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Category</FieldLabel>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            label="Category"
          />
        </Field>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.payee}</TableCell>
                <TableCell>
                  <CategoryPicker
                    variant="chip"
                    size="sm"
                    placeholder="Uncategorized"
                    label={`Category for ${row.payee}`}
                    value={byValue(assigned[row.id])}
                    onChange={(c) =>
                      setAssigned((a) => ({ ...a, [row.id]: c?.value ?? "" }))
                    }
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
