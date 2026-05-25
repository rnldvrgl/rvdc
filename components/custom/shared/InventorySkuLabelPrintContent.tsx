import React from "react"

import { Item } from "@/lib/constants/interface"

interface InventorySkuLabelPrintContentProps {
  items: Item[]
  labelsPerPage: number
  showPreviewMargins?: boolean
}

function chunkItems(items: Item[], size = 20): Item[][] {
  const pages: Item[][] = []

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size))
  }

  return pages
}

function normalizeLabelText(text: string) {
  return text.trim() || "Unnamed item"
}

function getLabelTypography(labelsPerPage: number) {
  if (labelsPerPage <= 2) {
    return {
      sku: "text-4xl",
      name: "text-xl",
      padding: "px-4 py-5",
    }
  }

  if (labelsPerPage <= 4) {
    return {
      sku: "text-[34px]",
      name: "text-[18px]",
      padding: "px-4 py-4",
    }
  }

  if (labelsPerPage <= 8) {
    return {
      sku: "text-3xl",
      name: "text-lg",
      padding: "px-3 py-4",
    }
  }

  if (labelsPerPage <= 16) {
    return {
      sku: "text-2xl",
      name: "text-base",
      padding: "px-3 py-3",
    }
  }

  return {
    sku: "text-lg",
    name: "text-sm",
    padding: "px-2 py-2",
  }
}

const LABEL_GRID_CLASSES: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
  5: "grid-cols-2 grid-rows-3",
  6: "grid-cols-2 grid-rows-3",
  7: "grid-cols-2 grid-rows-4",
  8: "grid-cols-2 grid-rows-4",
  9: "grid-cols-2 grid-rows-5",
  10: "grid-cols-2 grid-rows-5",
  11: "grid-cols-2 grid-rows-6",
  12: "grid-cols-2 grid-rows-6",
  13: "grid-cols-2 grid-rows-7",
  14: "grid-cols-2 grid-rows-7",
  15: "grid-cols-2 grid-rows-8",
  16: "grid-cols-2 grid-rows-8",
  17: "grid-cols-4 grid-rows-5",
  18: "grid-cols-4 grid-rows-5",
  19: "grid-cols-4 grid-rows-5",
  20: "grid-cols-4 grid-rows-5",
}

function SkuLabel({ item, labelsPerPage }: { item: Item; labelsPerPage: number }) {
  const sku = normalizeLabelText(item.sku || "NO SKU")
  const name = normalizeLabelText(item.name)
  const typography = getLabelTypography(labelsPerPage)

  return (
    <div className={`sku-label flex h-full w-full flex-col items-center justify-center border-2 border-gray-800 bg-white text-center text-black overflow-hidden ${typography.padding}`}>
      <p className={`w-full font-black leading-none tracking-widest text-gray-950 break-all ${typography.sku}`}>
        {sku}
      </p>
      <p className={`mt-1.5 w-full font-medium leading-tight text-gray-900 truncate ${typography.name}`}>
        {name}
      </p>
    </div>
  )
}

export const InventorySkuLabelPrintContent = React.forwardRef<
  HTMLDivElement,
  InventorySkuLabelPrintContentProps
>(function InventorySkuLabelPrintContent({ items, showPreviewMargins }, ref) {
  const clampedLabelsPerPage = 20
  const pages = chunkItems(items, clampedLabelsPerPage)
  const gridClassName = `sku-page grid h-full gap-0 ${LABEL_GRID_CLASSES[clampedLabelsPerPage]}`

  return (
    <div ref={ref} className="inventory-sku-print bg-white text-black font-sans">
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className={`sku-page-wrapper ${
            showPreviewMargins
              ? "mb-4 h-[11in] w-[8.5in] rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
              : ""
          }`}
          data-labels-per-page={clampedLabelsPerPage}
        >
          <div className={gridClassName}>
            {pageItems.map((item) => (
              <div
                key={item.id}
                className="sku-page-item h-full w-full"
              >
                <SkuLabel item={item} labelsPerPage={clampedLabelsPerPage} />
              </div>
            ))}
            {Array.from({ length: Math.max(0, clampedLabelsPerPage - pageItems.length) }).map((_, index) => (
              <div
                key={`empty-${pageIndex}-${index}`}
                className="sku-page-item h-full w-full"
              >
                <div className="h-full w-full bg-white" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})
