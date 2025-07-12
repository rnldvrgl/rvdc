import { useEffect, useState } from 'react'

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

  // Init from initialData ONCE
  useEffect(() => {
    if (initialData) {
      const initial = getInitialItems(initialData)
      setItems(initial)
    }
  }, [initialData])

  // Fill any missing items with first available item
  useEffect(() => {
    if (allItems.length === 0) return
    setItems((prevItems) =>
      prevItems.map((i) => ({
        ...i,
        item: i.item ?? allItems[0],
      })),
    )
  }, [allItems])

  return { items, setItems }
}
