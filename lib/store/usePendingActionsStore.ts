import { create } from "zustand"

export type PendingActionType =
  | "export"
  | "maintenance"
  | "bulk_update"
  | "client_bulk_update"
  | "holiday_bulk_update"
  | "aircon_model_bulk_update"
  | "employee_bulk_update"

export interface PendingAction {
  id: string
  type: PendingActionType
  label: string
  startedAt: Date
}

interface PendingActionsStore {
  actions: PendingAction[]
  addAction: (type: PendingActionType, label: string) => string
  removeAction: (id: string) => void
  clearByType: (type: PendingActionType) => void
}

let nextId = 1

const usePendingActionsStore = create<PendingActionsStore>()((set) => ({
  actions: [],
  addAction: (type, label) => {
    const id = `pa-${nextId++}`
    set((state) => ({
      actions: [...state.actions, { id, type, label, startedAt: new Date() }],
    }))
    return id
  },
  removeAction: (id) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id),
    })),
  clearByType: (type) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.type !== type),
    })),
}))

export default usePendingActionsStore
