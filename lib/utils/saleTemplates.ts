export interface SaleTemplate {
  id: string
  name: string
  items: {
    item_id: number | null
    description?: string
    quantity: number
    final_price_per_unit: number
    print_price_per_unit?: number
  }[]
  createdAt: string
}

const STORAGE_KEY = "rvdc_sale_templates"

function read(): SaleTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(templates: SaleTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function getSaleTemplates(): SaleTemplate[] {
  return read()
}

export function saveSaleTemplate(
  name: string,
  items: SaleTemplate["items"],
): SaleTemplate {
  const template: SaleTemplate = {
    id: crypto.randomUUID(),
    name,
    items,
    createdAt: new Date().toISOString(),
  }
  const all = read()
  all.unshift(template)
  write(all)
  return template
}

export function removeSaleTemplate(id: string) {
  const all = read()
  write(all.filter((t) => t.id !== id))
}
