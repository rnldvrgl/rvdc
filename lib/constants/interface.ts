export interface EntitySheetProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  entity?: T
  renderForm: (props: { onClose: () => void; entity?: T }) => React.ReactNode
}

export interface EntitySheetState<T> {
  open: boolean
  entity: T | undefined
}

export interface UseEntitySheetReturn<T> {
  sheetState: EntitySheetState<T>
  openSheet: (entity?: T) => void
  closeSheet: () => void
  toggleSheet: () => void
}
export interface User {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
  profile_image: string
  birthday?: string
  is_active?: boolean
  contact_number?: string
}
