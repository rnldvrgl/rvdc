import React from "react"

import { Item } from "@/lib/constants/interface"

interface InventorySkuLabelPrintContentProps {
  items: Item[]
  showPreviewMargins?: boolean
}

function chunkItems(items: Item[], size = 10): Item[][] {
  const pages: Item[][] = []

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size))
  }

  return pages
}

function normalizeLabelText(text: string) {
  return text.trim() || "Unnamed item"
}

function SkuLabel({ item }: { item: Item }) {
  const sku = normalizeLabelText(item.sku || "NO SKU")
  const name = normalizeLabelText(item.name)

  return (
    <div className="sku-label flex h-full w-full flex-col items-center justify-center border-2 border-gray-800 bg-white px-2 py-1 text-center text-black overflow-hidden">
      <p className="w-full text-[20px] font-black leading-none tracking-[0.14em] text-gray-950 break-all">
        {sku}
      </p>
      <p className="mt-1 w-full text-[11px] font-medium leading-tight text-gray-900 truncate">
        {name}
      </p>
    </div>
  )
}

export const InventorySkuLabelPrintContent = React.forwardRef<
  HTMLDivElement,
  InventorySkuLabelPrintContentProps
>(function InventorySkuLabelPrintContent({ items, showPreviewMargins }, ref) {
  const pages = chunkItems(items)

  return (
    <div ref={ref} className="inventory-sku-print bg-white text-black">
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className={`sku-page-wrapper ${
            showPreviewMargins
              ? "mb-4 rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
              : ""
          }`}
        >
          <div className="sku-page grid grid-cols-2 gap-[0.12in]">
            {pageItems.map((item) => (
              <div
                key={item.id}
                className="sku-page-item h-48 w-72"
              >
                <SkuLabel item={item} />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 10 - pageItems.length) }).map((_, index) => (
              <div
                key={`empty-${pageIndex}-${index}`}
                className="sku-page-item h-48 w-72"
              >
                <div className="h-full w-full rounded-md border-2 border-dashed border-gray-200 bg-white" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})
