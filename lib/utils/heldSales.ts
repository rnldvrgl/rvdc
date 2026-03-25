export interface HeldSale {
  id: string
  label: string
  clientId: number | null
  clientName: string
  items: {
    item_id: number | null
    description?: string
    quantity: number
    final_price_per_unit: number
    print_price_per_unit?: number
  }[]
  payments: {
    payment_type: string
    amount: number
    cheque_collection: number | null
  }[]
  transactionType: "sale" | "replacement"
  orderDiscount: number
  note: string
  manualReceiptNumber: string
  receiptBook: string
  with2307: boolean
  heldAt: string // ISO timestamp
}

const STORAGE_KEY = "rvdc_held_sales"

function read(): HeldSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(sales: HeldSale[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
}

export function getHeldSales(): HeldSale[] {
  return read()
}

export function holdSale(sale: Omit<HeldSale, "id" | "heldAt">): HeldSale {
  const held: HeldSale = {
    ...sale,
    id: crypto.randomUUID(),
    heldAt: new Date().toISOString(),
  }
  const all = read()
  all.unshift(held)
  write(all)
  return held
}

export function resumeHeldSale(id: string): HeldSale | null {
  const all = read()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const [sale] = all.splice(idx, 1)
  write(all)
  return sale
}

export function removeHeldSale(id: string) {
  const all = read()
  write(all.filter((s) => s.id !== id))
}
