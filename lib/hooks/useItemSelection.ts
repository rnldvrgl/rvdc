import { useEffect, useState } from "react"

export function useItemSelection<
  Item,
  Entry extends { item: Item | null },
  TData,
>({
  initialData,
  allItems,
  getInitialItems,
}: {
  initialData?: TData
  allItems: Item[]
  getInitialItems: (data: TData) => Entry[]
}) {
  const [items, setItems] = useState<Entry[]>([])

  useEffect(() => {
    if (initialData) {
      const initial = getInitialItems(initialData)
      setItems(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  useEffect(() => {
    if (allItems.length === 0) return
    setItems((prevItems) =>
      prevItems.map((i) => ({
        ...i,
        item:
          i.item ?? ("description" in i && i.description ? null : allItems[0]),
      })),
    )
  }, [allItems])

  return { items, setItems }
}
