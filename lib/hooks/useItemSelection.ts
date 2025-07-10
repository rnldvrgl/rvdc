import { useEffect, useState } from 'react'

export function useItemSelection<Item, TData>({
  initialData,
  allItems,
  getInitialItems,
}: {
  initialData?: TData
  allItems: Item[]
  getInitialItems: (data: TData) => { item: Item | null; quantity: number }[]
}) {
  const [items, setItems] = useState<{ item: Item; quantity: number }[]>([])

  useEffect(() => {
    if (!initialData) return
    const initial = getInitialItems(initialData).map((i) => ({
      item: i.item ?? allItems[0],
      quantity: i.quantity,
    }))
    setItems(initial)
  }, [initialData])

  useEffect(() => {
    if (allItems.length === 0) return
    setItems((prevItems) => {
      const needsUpdate = prevItems.some((i) => i.item == null)
      if (!needsUpdate) return prevItems
      return prevItems.map((i) => ({
        item: i.item ?? allItems[0],
        quantity: i.quantity,
      }))
    })
  }, [allItems])

  return { items, setItems }
}
