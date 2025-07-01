import { useState } from 'react'

export function useEditableSheet<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleEdit = (item: T) => {
    setSelectedItem(item)
    setIsOpen(true)
  }

  return {
    selectedItem,
    isOpen,
    setIsOpen,
    handleEdit,
  }
}
