"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    ApplianceItemUsed,
    Item,
  ServicePartTemplatePayload,
    ServiceItemUsed,
    Stock,
} from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useApplianceItemMutations } from "@/lib/mutations/services/useApplianceItemMutations"
import { useServiceItemMutations } from "@/lib/mutations/services/useServiceItemMutations"
import { useApplianceItems } from "@/lib/queries/services/useApplianceItems"
import { useServicePartTemplates } from "@/lib/queries/services/useServicePartTemplates"
import { useServiceItems } from "@/lib/queries/services/useServiceItems"
import { useItemChoices } from "@/lib/queries/useChoices"
import { useServicePartTemplateMutations } from "@/lib/mutations/services/useServicePartTemplateMutations"
import api from "@/lib/utils/api"
import { cn } from "@/lib/utils/helpers"
import { formatCurrency } from "@/lib/utils/currency"
import { useQueryClient } from "@tanstack/react-query"
import {
  Edit,
  HardHat,
  Info,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

type ItemUsed = ServiceItemUsed | ApplianceItemUsed

type PendingPartEntry = {
  isCustom: boolean
  itemId: number | null
  itemName: string
  quantity: string
  customPrice: string
  customDescription: string
  isFree: boolean
  discountValue: string
  discountReason: string
  selectedUntrackedItemId: number | null
}

type ServicePartsComposerForm = {
  draft: PendingPartEntry
  parts: PendingPartEntry[]
}

interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      detail?: string
      error?: string
      message?: string
    }
  }
  message?: string
}

interface PartsManagerProps {
  entityType: "service" | "appliance"
  entityId: number
  disabled?: boolean
  disabledReason?: string
  onUpdate?: () => void | Promise<void>
}

const ENTITY_CONFIG = {
  service: {
    icon: HardHat,
    label: "Service-Level Parts",
    emptyText: "No service-level parts added yet",
    description: "Parts used for pre-installation work (chipping, piping) or general materials not tied to a specific unit.",
    dialogTitle: "Add Service-Level Part",
    dialogDescription: "Add items for pre-installation work (chipping, piping, etc.)",
    submitLabel: "Service",
    apiEndpoint: "services/service-items/",
    cardClassName: "",
    cardHeaderClassName: "",
    cardContentClassName: "",
    badgeVariant: "default" as const,
    checkboxIdPrefix: "service_parts",
    queryKeysToInvalidate: [
      ["service"],
      ["service-items"],
    ] as string[][],
    batchQueryKeysToInvalidate: [
      ["service"],
      ["services"],
      ["stocks"],
      ["sales-transactions"],
      ["pending-items-stats"],
    ] as string[][],
  },
  appliance: {
    icon: Package,
    label: "Parts Used",
    emptyText: "No parts added yet",
    description: "",
    dialogTitle: "Add Part",
    dialogDescription: "Select an item from inventory and specify the quantity used.",
    submitLabel: "Appliance",
    apiEndpoint: "services/appliance-items/",
    cardClassName: "bg-transparent border-0 p-0",
    cardHeaderClassName: "px-0",
    cardContentClassName: "px-0",
    badgeVariant: "secondary" as const,
    checkboxIdPrefix: "parts",
    queryKeysToInvalidate: [
      ["service"],
      ["service-appliances"],
      ["appliance-items"],
    ] as string[][],
    batchQueryKeysToInvalidate: [
      ["service"],
      ["services"],
      ["service-appliances"],
      ["stocks"],
      ["sales-transactions"],
      ["pending-items-stats"],
    ] as string[][],
  },
} as const

export default function PartsManager({
  entityType,
  entityId,
  disabled = false,
  disabledReason,
  onUpdate,
}: PartsManagerProps) {
  const config = ENTITY_CONFIG[entityType]
  const Icon = config.icon
  const queryClient = useQueryClient()

  const defaultPendingEntry: PendingPartEntry = {
    isCustom: false,
    itemId: null,
    itemName: "",
    quantity: "1",
    customPrice: "",
    customDescription: "",
    isFree: false,
    discountValue: "",
    discountReason: "",
    selectedUntrackedItemId: null,
  }

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPartId, setEditingPartId] = useState<number | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [isFree, setIsFree] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [customPrice, setCustomPrice] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [selectedUntrackedItemId, setSelectedUntrackedItemId] = useState<number | null>(null)
  const [pendingItems, setPendingItems] = useState<
    Array<{
      id: string
      isCustom: boolean
      itemId: number | null
      itemName: string
      quantity: string
      customPrice: string
      customDescription: string
      isFree: boolean
      discountValue: string
      discountReason: string
    }>
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [editingPendingIndex, setEditingPendingIndex] = useState<number | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateDeleteConfirmOpen, setTemplateDeleteConfirmOpen] = useState(false)
  const submitAllLockRef = useRef(false)
  const savePartLockRef = useRef(false)

  const serviceComposerForm = useForm<ServicePartsComposerForm>({
    defaultValues: {
      draft: defaultPendingEntry,
      parts: [],
    },
  })

  const { fields: pendingPartFields, append: appendPendingPart, remove: removePendingPart, update: updatePendingPart } =
    useFieldArray({
      control: serviceComposerForm.control,
      name: "parts",
      keyName: "fieldKey",
    })

  const serviceDraft = useWatch({
    control: serviceComposerForm.control,
    name: "draft",
  })
  const servicePendingParts = useWatch({
    control: serviceComposerForm.control,
    name: "parts",
  })

  // Call both hooks unconditionally (React rules of hooks), only enable the active one
  const serviceItemsQuery = useServiceItems(entityType === "service" ? entityId : undefined)
  const applianceItemsQuery = useApplianceItems(entityType === "appliance" ? entityId : undefined)
  const { data: partsUsed = [], isLoading } = entityType === "service" ? serviceItemsQuery : applianceItemsQuery

  const { data: itemsData, isLoading: itemsLoading } = useItemChoices()
  const { data: servicePartTemplates = [], isLoading: templatesLoading } =
    useServicePartTemplates()
  const { addTemplate, updateTemplate, deleteTemplate } =
    useServicePartTemplateMutations()

  // Call both mutation hooks unconditionally (rules of hooks), use wrappers for type safety
  const serviceMutations = useServiceItemMutations()
  const applianceMutations = useApplianceItemMutations()
  const activeMutations = entityType === "service" ? serviceMutations : applianceMutations
  const isMutatingPart = activeMutations.addItem.isPending || activeMutations.updateItem.isPending

  const items: Item[] = itemsData ?? []
  const untrackedItems = items.filter((i) => !i.is_tracked)
  const activeSelectedItemId =
    !editingPartId
      ? serviceDraft?.itemId ?? null
      : selectedItemId
  const selectedItem = items.find((i) => i.id === activeSelectedItemId)

  const itemOptions = items.filter((i) => i.is_tracked).map((item) => ({
    value: item.id,
    label: item.sku ? `${item.name} — ${item.sku}` : item.name,
  }))

  const untrackedItemOptions = untrackedItems.map((item) => ({
    value: item.id,
    label: `${item.name} — ${formatCurrency(item.retail_price)}`,
  }))

  const isDialogBusy = isSubmitting || isMutatingPart
  const defaultDisabledReason =
    "Parts are locked because this service is completed. Reopen the service first before adding, editing, or deleting parts so sales and sub-stall settlement remain accurate."
  const partsFlowNote =
    "Finalize all parts before completing the service. If changes are needed after completion, reopen the service, update parts, then complete again."
  const activeDisabledReason = disabledReason || defaultDisabledReason
  const pendingCount =
    !editingPartId
      ? servicePendingParts?.length ?? 0
      : pendingItems.length
  const queuedPartsLabel =
    entityType === "service" ? "Queued Service Parts" : "Queued Appliance Parts"
  const selectedTemplate = servicePartTemplates.find(
    (template) => template.id === selectedTemplateId,
  )
  const serviceTemplateOptions = servicePartTemplates.map((template) => ({
    value: template.id,
    label: template.name,
  }))
  const templateActionBusy =
    addTemplate.isPending || updateTemplate.isPending || deleteTemplate.isPending

  const normalizeComparableTemplateLine = (
    line: Pick<
      ServicePartTemplatePayload["lines"][number],
      "item" | "custom_description" | "custom_price" | "quantity"
    >,
  ) => ({
    item: line.item ?? null,
    customDescription: (line.custom_description || "").trim(),
    customPrice:
      line.custom_price === null ||
      line.custom_price === undefined ||
      line.custom_price === ""
        ? null
        : Number(line.custom_price),
    quantity: Number(line.quantity),
  })

  const buildTemplateLinesFromEntries = (queuedEntries: PendingPartEntry[]) => {
    const templateLines: ServicePartTemplatePayload["lines"] = []

    queuedEntries.forEach((entry, index) => {
      const lineQuantity = parseFloat(entry.quantity || "0")
      if (Number.isNaN(lineQuantity) || lineQuantity <= 0) return

      if (!entry.isCustom && entry.itemId) {
        templateLines.push({
          item: entry.itemId,
          custom_description: "",
          custom_price: null,
          quantity: lineQuantity,
          sort_order: index,
        })
        return
      }

      const customDescription =
        entry.customDescription ||
        entry.itemName ||
        items.find((item) => item.id === entry.itemId)?.name ||
        ""

      const customPrice = parseFloat(entry.customPrice || "0")
      if (!customDescription.trim() || Number.isNaN(customPrice) || customPrice < 0) return

      templateLines.push({
        item: null,
        custom_description: customDescription,
        custom_price: customPrice,
        quantity: lineQuantity,
        sort_order: index,
      })
    })

    return templateLines
  }

  const areTemplateLinesEqual = (
    left: ServicePartTemplatePayload["lines"],
    right: ServicePartTemplatePayload["lines"],
  ) => {
    if (left.length !== right.length) return false

    return left.every((line, index) => {
      const targetLine = right[index]
      if (!targetLine) return false
      const normalizedLeft = normalizeComparableTemplateLine(line)
      const normalizedRight = normalizeComparableTemplateLine(targetLine)
      return (
        normalizedLeft.item === normalizedRight.item &&
        normalizedLeft.customDescription === normalizedRight.customDescription &&
        normalizedLeft.customPrice === normalizedRight.customPrice &&
        normalizedLeft.quantity === normalizedRight.quantity
      )
    })
  }

  const selectedTemplateLines = (selectedTemplate?.lines || []).map((line, index) => ({
    item: line.item ?? null,
    custom_description: line.custom_description || "",
    custom_price:
      line.custom_price === null || line.custom_price === undefined
        ? null
        : Number(line.custom_price),
    quantity: Number(line.quantity),
    sort_order: line.sort_order ?? index,
  }))

  const queuedTemplateLines = buildTemplateLinesFromEntries(servicePendingParts ?? [])

  const hasTemplateMetadataChanges =
    !!selectedTemplate &&
    (
      templateName.trim() !== selectedTemplate.name ||
      templateDescription.trim() !== (selectedTemplate.description || "").trim()
    )

  const hasTemplateQueueChanges =
    !!selectedTemplate &&
    queuedTemplateLines.length > 0 &&
    !areTemplateLinesEqual(queuedTemplateLines, selectedTemplateLines)

  const hasTemplateChanges = hasTemplateMetadataChanges || hasTemplateQueueChanges
  const canApplyTemplate =
    !!selectedTemplate && !hasTemplateMetadataChanges && !isDialogBusy && !templateActionBusy
  const canUpdateTemplate =
    !!selectedTemplate && hasTemplateChanges && !isDialogBusy && !templateActionBusy

  const canAddDraftToQueue =
    !isDialogBusy &&
    !!serviceDraft &&
    (
      serviceDraft.isCustom
        ? !!(
            (serviceDraft.selectedUntrackedItemId ||
              serviceDraft.customDescription?.trim()) &&
            serviceDraft.customPrice &&
            serviceDraft.quantity
          )
        : !!(serviceDraft.itemId && serviceDraft.quantity)
    )

  const canClearDraftInput =
    !isDialogBusy &&
    (
      editingPendingIndex !== null ||
      !!serviceDraft?.itemId ||
      !!serviceDraft?.selectedUntrackedItemId ||
      (serviceDraft?.quantity && serviceDraft.quantity !== "1") ||
      !!serviceDraft?.customPrice ||
      !!serviceDraft?.customDescription ||
      !!serviceDraft?.discountValue ||
      !!serviceDraft?.discountReason ||
      !!serviceDraft?.isFree ||
      !!serviceDraft?.isCustom
    )

  const normalizeTemplateName = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

  const findTemplateItemMatch = (targetName: string) => {
    if (!targetName.trim()) return undefined
    const normalizedTarget = normalizeTemplateName(targetName)
    return items.find((item) => {
      const normalizedItemName = normalizeTemplateName(item.name)
      return (
        normalizedItemName === normalizedTarget ||
        normalizedItemName.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedItemName)
      )
    })
  }

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateName("")
      setTemplateDescription("")
      return
    }
    setTemplateName(selectedTemplate.name)
    setTemplateDescription(selectedTemplate.description || "")
  }, [selectedTemplate])

  // Check if the user has unsaved work (pending items or form partially filled)
  const hasServiceDraftChanges =
    !editingPartId &&
    !!serviceDraft &&
    (
      servicePendingParts?.length ||
      serviceDraft.itemId ||
      serviceDraft.selectedUntrackedItemId ||
      (serviceDraft.quantity && serviceDraft.quantity !== "1") ||
      serviceDraft.customPrice ||
      serviceDraft.customDescription ||
      serviceDraft.discountValue ||
      serviceDraft.discountReason ||
      serviceDraft.isFree ||
      serviceDraft.isCustom
    )
  const hasUnsavedChanges =
    hasServiceDraftChanges ||
    pendingItems.length > 0 ||
    !!selectedItemId ||
    (isCustom && (!!customDescription || !!customPrice))

  const { data: stockData } = useApiQuery<PaginatedResult<Stock>>({
    queryKey: ["stall-stocks", "item", activeSelectedItemId],
    url: "/inventory/stocks/",
    params: { item: activeSelectedItemId, limit: 1 },
    enabled: !!activeSelectedItemId,
  })
  const selectedItemStock = stockData?.results?.[0]

  const buildPayload = (opts: {
    isCustomItem: boolean
    itemId: number | null
    qty: number
    isFreeItem: boolean
    discount: string
    discReason: string
    price: string
    description: string
  }) => {
    const entityRef = entityType === "service"
      ? { service: entityId }
      : { appliance: entityId }
    const base = {
      ...entityRef,
      quantity: opts.qty,
      is_free: opts.isFreeItem,
      discount_amount:
        !opts.isFreeItem && opts.discount
          ? Math.round(parseFloat(opts.discount || "0") * 100) / 100
          : 0,
      discount_percentage: 0,
      discount_reason: opts.isFreeItem ? undefined : opts.discReason || undefined,
    }

    if (opts.isCustomItem) {
      return {
        ...base,
        item: null as null,
        custom_price: Math.round(parseFloat(opts.price) * 100) / 100,
        custom_description: opts.description || undefined,
      }
    }
    return { ...base, item: opts.itemId }
  }

  // Type-safe mutation wrappers that dispatch to the correct hook
  const mutateAdd = async (payload: ReturnType<typeof buildPayload>) => {
    if (entityType === "service") {
      return serviceMutations.addItem.mutateAsync(payload as Parameters<typeof serviceMutations.addItem.mutateAsync>[0])
    }
    return applianceMutations.addItem.mutateAsync(payload as Parameters<typeof applianceMutations.addItem.mutateAsync>[0])
  }

  const mutateUpdate = async (id: number, payload: ReturnType<typeof buildPayload>) => {
    if (entityType === "service") {
      return serviceMutations.updateItem.mutateAsync({ id, data: payload as Parameters<typeof serviceMutations.updateItem.mutateAsync>[0]["data"] })
    }
    return applianceMutations.updateItem.mutateAsync({ id, data: payload as Parameters<typeof applianceMutations.updateItem.mutateAsync>[0]["data"] })
  }

  const mutateDelete = async (id: number) => {
    if (entityType === "service") {
      return serviceMutations.deleteItem.mutateAsync({ id, serviceId: entityId })
    }
    return applianceMutations.deleteItem.mutateAsync({ id, applianceId: entityId })
  }

  const resetServiceDraft = () => {
    serviceComposerForm.setValue("draft", { ...defaultPendingEntry }, { shouldDirty: false })
    setEditingPendingIndex(null)
  }

  const resetServiceComposer = () => {
    serviceComposerForm.reset({
      draft: { ...defaultPendingEntry },
      parts: [],
    })
    setEditingPendingIndex(null)
  }

  const handleSavePart = async () => {
    if (savePartLockRef.current) return

    if (isCustom) {
      if ((!selectedUntrackedItemId && !customDescription.trim()) || !customPrice || !quantity) {
        toast.error("Please fill in item name, price, and quantity")
        return
      }
    } else {
      if (!selectedItemId || !quantity) {
        toast.error("Please fill in all fields")
        return
      }
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }
    const isDecimalUnit =
      selectedItem && ["kg", "ft"].includes(selectedItem.unit_of_measure)
    const roundedQty =
      isCustom || isDecimalUnit
        ? Math.round(qty * 100) / 100
        : Math.round(qty) || 1

    const payload = buildPayload({
      isCustomItem: isCustom,
      itemId: selectedItemId,
      qty: roundedQty,
      isFreeItem: isFree,
      discount: discountValue,
      discReason: discountReason,
      price: customPrice,
      description: customDescription,
    })

    const resetForm = () => {
      setDialogOpen(false)
      setEditingPartId(null)
      setSelectedItemId(null)
      setQuantity("1")
      setIsFree(false)
      setIsCustom(false)
      setCustomPrice("")
      setCustomDescription("")
      setSelectedUntrackedItemId(null)
      setDiscountValue("")
      setDiscountReason("")
    }

    savePartLockRef.current = true
    try {
      if (editingPartId) {
        await mutateUpdate(editingPartId, payload)
      } else {
        await mutateAdd(payload)
      }

      resetForm()
      await new Promise((resolve) => setTimeout(resolve, 150))

      for (const key of config.queryKeysToInvalidate) {
        await queryClient.invalidateQueries({ queryKey: key })
      }

      if (onUpdate) {
        await onUpdate()
      }
    } catch (error: unknown) {
      // Enhanced error handling - extract meaningful error message
      const apiError = error as ApiErrorResponse
      const errorMessage = apiError?.response?.data?.detail ||
                          apiError?.response?.data?.error ||
                          apiError?.response?.data?.message ||
                          apiError?.message ||
                          "Failed to save part. Please check your connection and try again."

      // Check if it's a network/connection error
      if (!apiError?.response) {
        toast.error("Network error: Please check your connection and try again.")
      } else if (apiError?.response?.status === 400) {
        // Validation error - show detailed message
        toast.error(`Validation error: ${errorMessage}`)
      } else if (apiError?.response?.status === 409) {
        // Conflict/inventory mismatch
        toast.error(`Inventory issue: ${errorMessage}. The system has reverted any changes to prevent inconsistency.`)
      } else if (apiError?.response?.status && apiError.response.status >= 500) {
        // Server error
        toast.error(`Server error: ${errorMessage}. Please try again later.`)
      } else {
        toast.error(errorMessage)
      }

      // Log the full error for debugging
      console.error("Error saving part:", error)
    } finally {
      savePartLockRef.current = false
    }
  }

  const handleAddToList = () => {
    if (!editingPartId) {
      const draft = serviceComposerForm.getValues("draft")

      if (draft.isCustom) {
        if ((!draft.selectedUntrackedItemId && !draft.customDescription.trim()) || !draft.customPrice || !draft.quantity) {
          toast.error("Please fill in item name, price, and quantity")
          return
        }
      } else {
        if (!draft.itemId || !draft.quantity) {
          toast.error("Please fill in all fields")
          return
        }
      }

      const qty = parseFloat(draft.quantity)
      if (isNaN(qty) || qty <= 0) {
        toast.error("Quantity must be greater than 0")
        return
      }

      const itemName = draft.isCustom
        ? draft.customDescription || "Custom Item"
        : items.find((i) => i.id === draft.itemId)?.name || "Unknown"

      const normalizedEntry: PendingPartEntry = {
        ...draft,
        itemName,
      }

      if (editingPendingIndex !== null) {
        updatePendingPart(editingPendingIndex, normalizedEntry)
      } else {
        appendPendingPart(normalizedEntry)
      }

      resetServiceDraft()
      return
    }

    if (isCustom) {
      if ((!selectedUntrackedItemId && !customDescription.trim()) || !customPrice || !quantity) {
        toast.error("Please fill in item name, price, and quantity")
        return
      }
    } else {
      if (!selectedItemId || !quantity) {
        toast.error("Please fill in all fields")
        return
      }
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    const itemName = isCustom
      ? customDescription || "Custom Item"
      : items.find((i) => i.id === selectedItemId)?.name || "Unknown"

    setPendingItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        isCustom,
        itemId: isCustom ? null : selectedItemId,
        itemName,
        quantity,
        customPrice,
        customDescription,
        isFree,
        discountValue,
        discountReason,
      },
    ])

    // Reset form for next item
    setSelectedItemId(null)
    setQuantity("1")
    setIsFree(false)
    setIsCustom(false)
    setCustomPrice("")
    setCustomDescription("")
    setSelectedUntrackedItemId(null)
    setDiscountValue("")
    setDiscountReason("")
  }

  const handleSubmitAll = async () => {
    const itemsToSubmit =
      !editingPartId
        ? serviceComposerForm.getValues("parts")
        : pendingItems

    if (itemsToSubmit.length === 0 || submitAllLockRef.current) return
    submitAllLockRef.current = true
    setIsSubmitting(true)

    let successCount = 0
    let failCount = 0
    const stockAutoAddedItems: string[] = []

    try {
      for (const item of itemsToSubmit) {
        const qty = parseFloat(item.quantity)
        const selectedItemForQty = items.find((i) => i.id === item.itemId)
        const isDecimalUnit =
          selectedItemForQty &&
          ["kg", "ft"].includes(selectedItemForQty.unit_of_measure)
        const roundedQty =
          item.isCustom || isDecimalUnit
            ? Math.round(qty * 100) / 100
            : Math.round(qty) || 1

        const payload = buildPayload({
          isCustomItem: item.isCustom,
          itemId: item.itemId,
          qty: roundedQty,
          isFreeItem: item.isFree,
          discount: item.discountValue,
          discReason: item.discountReason,
          price: item.customPrice,
          description: item.customDescription,
        })

        try {
          const res = await api.post(config.apiEndpoint, payload)
          successCount++
          if (res.data?.stock_auto_added) {
            stockAutoAddedItems.push(
              `${item.isCustom ? item.customDescription || "Custom Item" : items.find((i) => i.id === item.itemId)?.name || "Item"} (+${res.data.stock_auto_added_qty})`,
            )
          }
        } catch {
          failCount++
        }
      }

      if (stockAutoAddedItems.length > 0) {
        toast.warning(
          `Stock auto-reconciled for: ${stockAutoAddedItems.join(", ")}`,
          { duration: 6000 },
        )
      }
      if (successCount > 0) {
        toast.success(
          `${successCount} part${successCount > 1 ? "s" : ""} added successfully`,
        )
      }
      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} part${failCount > 1 ? "s" : ""}`)
      }

      for (const key of config.batchQueryKeysToInvalidate) {
        await queryClient.invalidateQueries({ queryKey: key })
      }
      if (entityType === "appliance") {
        await queryClient.invalidateQueries({
          queryKey: ["appliance-items", entityId],
        })
        await queryClient.invalidateQueries({
          queryKey: ["service-appliance", `${entityId}`],
        })
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["service-items", entityId],
        })
      }
      if (onUpdate) await onUpdate()

      setPendingItems([])
      resetServiceComposer()
      setDialogOpen(false)
    } finally {
      setIsSubmitting(false)
      submitAllLockRef.current = false
    }
  }

  const getTemplateLinesFromQueue = () =>
    buildTemplateLinesFromEntries(serviceComposerForm.getValues("parts"))

  const getTemplateLinesForUpdate = () => {
    const linesFromQueue = getTemplateLinesFromQueue()
    if (linesFromQueue.length > 0) return linesFromQueue
    return selectedTemplateLines
  }

  const handleCreateTemplate = async () => {
    const normalizedName = templateName.trim()
    if (!normalizedName) {
      toast.error("Template name is required")
      return
    }

    const lines = getTemplateLinesFromQueue()
    if (lines.length === 0) {
      toast.error("Add at least one queued part before saving a template")
      return
    }

    try {
      await addTemplate.mutateAsync({
        name: normalizedName,
        description: templateDescription.trim(),
        lines,
      })

      setTemplateName("")
      setTemplateDescription("")
      setSelectedTemplateId(null)
    } catch {
      // handled by useApiMutation
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Select a template to update")
      return
    }

    const normalizedName = templateName.trim()
    if (!normalizedName) {
      toast.error("Template name is required")
      return
    }

    const lines = getTemplateLinesForUpdate()
    if (!hasTemplateChanges) {
      toast.info("No template changes to update")
      return
    }
    if (lines.length === 0) {
      toast.error("Template has no lines to update")
      return
    }

    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        data: {
          name: normalizedName,
          description: templateDescription.trim(),
          lines,
        },
      })
    } catch {
      // handled by useApiMutation
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Select a template to delete")
      return
    }

    setTemplateDeleteConfirmOpen(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate) {
      setTemplateDeleteConfirmOpen(false)
      return
    }

    try {
      await deleteTemplate.mutateAsync(selectedTemplate.id)
      setSelectedTemplateId(null)
      setTemplateName("")
      setTemplateDescription("")
      setTemplateDeleteConfirmOpen(false)
    } catch {
      // handled by useApiMutation
    }
  }

  const handleApplyTemplate = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first")
      return
    }

    const entriesToAppend = selectedTemplate.lines.map((line) => {
      const exactItem = line.item ? items.find((item) => item.id === line.item) : undefined
      const matchedItem = exactItem || findTemplateItemMatch(line.item_name || "")

      if (!matchedItem && line.custom_description) {
        return {
          ...defaultPendingEntry,
          isCustom: true,
          itemName: line.custom_description,
          customDescription: line.custom_description,
          customPrice: line.custom_price != null ? String(line.custom_price) : "",
          quantity: String(line.quantity),
        }
      }

      if (!matchedItem) {
        return {
          ...defaultPendingEntry,
          isCustom: true,
          itemName: line.item_name || "Custom Item",
          customDescription: line.item_name || "Custom Item",
          quantity: String(line.quantity),
        }
      }

      if (!matchedItem.is_tracked) {
        return {
          ...defaultPendingEntry,
          isCustom: true,
          itemName: matchedItem.name,
          customDescription: matchedItem.name,
          customPrice: matchedItem.retail_price,
          quantity: String(line.quantity),
          selectedUntrackedItemId: matchedItem.id,
        }
      }

      return {
        ...defaultPendingEntry,
        isCustom: false,
        itemId: matchedItem.id,
        itemName: matchedItem.name,
        quantity: String(line.quantity),
      }
    })

    appendPendingPart(entriesToAppend)
    setSelectedTemplateId(null)

    const unmatchedCount = entriesToAppend.filter(
      (entry) => entry.isCustom && !entry.selectedUntrackedItemId,
    ).length

    if (unmatchedCount > 0) {
      toast.warning(
        `${selectedTemplate.name} template added. ${unmatchedCount} item${unmatchedCount > 1 ? "s" : ""} need manual price or item check.`,
      )
    } else {
      toast.success(
        `${selectedTemplate.name} template applied (${entriesToAppend.length} parts).`,
      )
    }
  }

  const handleEditPart = (part: ItemUsed) => {
    setEditingPartId(part.id)

    if (!part.item && !!part.custom_price) {
      setIsCustom(true)
      setCustomPrice(part.custom_price?.toString() || "")
      setCustomDescription(part.custom_description || "")
      setSelectedItemId(null)
    } else {
      setIsCustom(false)
      setCustomPrice("")
      setCustomDescription("")
      setSelectedItemId(part.item)
    }

    setQuantity(part.quantity.toString())
    setIsFree(part.is_free || false)

    if (part.discount_amount && parseFloat(part.discount_amount) > 0) {
      setDiscountValue(part.discount_amount)
    } else {
      setDiscountValue("")
    }

    setDiscountReason(part.discount_reason || "")
    setDialogOpen(true)
  }

  const handleDeletePart = (id: number) => {
    setItemToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await mutateDelete(itemToDelete)

        setItemToDelete(null)
        setDeleteConfirmOpen(false)

        await new Promise((resolve) => setTimeout(resolve, 150))

        for (const key of config.queryKeysToInvalidate) {
          await queryClient.invalidateQueries({ queryKey: key })
        }

        if (onUpdate) {
          await onUpdate()
        }
      } catch {
        // error is handled by mutation
      }
    }
  }

  if (isLoading) {
    return (
      <Card className={config.cardClassName || undefined}>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading parts...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={config.cardClassName || undefined}>
        <CardHeader className={cn("flex flex-row items-center justify-between pb-3", config.cardHeaderClassName)}>
          <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium uppercase tracking-wide">
              {config.label}
            </span>
            {partsUsed.length > 0 && (
              entityType === "appliance" ? (
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 px-1 text-[10px] rounded-full"
                >
                  {partsUsed.length}
                </Badge>
              ) : (
                <Badge className="text-xs font-normal">{partsUsed.length}</Badge>
              )
            )}
          </CardTitle>
          {!disabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialogOpen(true)}
                  disabled={disabled}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Part
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Finalize parts before completion. Reopen service first if post-completion changes are needed.</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Parts Locked
            </Badge>
          )}
        </CardHeader>
        <CardContent className={config.cardContentClassName || undefined}>
          {config.description && (
            <p className="text-xs text-muted-foreground mb-3">
              {config.description}
            </p>
          )}
          {disabled ? (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              {activeDisabledReason}
            </div>
          ) : (
            <p className="mb-3 text-xs text-muted-foreground">{partsFlowNote}</p>
          )}
          {partsUsed.length === 0 ? (
            <div className="text-center py-6">
              <Icon className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                {config.emptyText}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {!disabled && (
                      <TableHead className="w-[100px]">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partsUsed.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{part.item_name}</span>
                          {!part.item && part.custom_price != null && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              Custom
                            </Badge>
                          )}
                          {part.is_free && (
                            <Badge
                              variant="success"
                              className="text-xs"
                            >
                              FREE
                            </Badge>
                          )}
                          {part.stock_request_status === "pending" && (
                            <Badge
                              variant="warning"
                              className="text-xs"
                            >
                              Stock Pending
                            </Badge>
                          )}
                          {part.stock_request_status === "approved" && (
                            <Badge
                              variant="success"
                              className="text-xs"
                            >
                              Stock Approved
                            </Badge>
                          )}
                          {part.stock_request_status === "declined" && (
                            <Badge
                              variant="destructive"
                              className="text-xs"
                            >
                              Stock Declined
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {part.is_free ? (
                          <Badge
                            variant="success"
                            className="text-xs"
                          >
                            FREE
                          </Badge>
                        ) : part.discount_amount &&
                          parseFloat(part.discount_amount) > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="line-through text-xs text-muted-foreground">
                              {formatCurrency(part.item_price || 0)}
                            </span>
                            <span className="text-success">
                              {formatCurrency(
                                part.discounted_price || part.item_price || 0,
                              )}
                            </span>
                          </div>
                        ) : (
                          formatCurrency(part.item_price || 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex flex-col items-end gap-1">
                          <span>{formatCurrency(part.line_total)}</span>
                          {!part.is_free &&
                            part.discount_amount &&
                            parseFloat(part.discount_amount) > 0 && (
                              <span className="text-xs text-success">
                                ₱{part.discount_amount} off
                              </span>
                            )}
                        </div>
                      </TableCell>
                      {!disabled && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditPart(part)}
                                  disabled={disabled}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit part quantity/discount before completion. For completed services, reopen first.</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeletePart(part.id)}
                                  disabled={disabled}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove part and return reserved stock before completion. Reopen first if already completed.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell
                      colSpan={3}
                      className="text-right font-semibold"
                    >
                      Total Parts Cost:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        partsUsed.reduce(
                          (sum, part) => sum + parseFloat(part.line_total),
                          0,
                        ),
                      )}
                    </TableCell>
                    {!disabled && <TableCell></TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Part Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && isDialogBusy) return
          if (!open && !editingPartId && hasUnsavedChanges) {
            setShowCloseWarning(true)
            return
          }
          setDialogOpen(open)
          if (!open) {
            setEditingPartId(null)
            setSelectedItemId(null)
            setQuantity("1")
            setIsFree(false)
            setIsCustom(false)
            setSelectedTemplateId(null)
            setTemplateName("")
            setTemplateDescription("")
            setTemplateDeleteConfirmOpen(false)
            setCustomPrice("")
            setDiscountValue("")
            setDiscountReason("")
            setSelectedUntrackedItemId(null)
            setPendingItems([])
            resetServiceComposer()
          }
        }}
      >
        <DialogContent
          className={
            entityType === "service"
              ? "h-[92dvh] w-[98vw] max-w-[98vw] overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:max-w-[96vw] sm:p-6 lg:max-w-6xl"
              : "h-[92dvh] w-[98vw] max-w-[98vw] overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:max-w-[96vw] sm:p-6 lg:max-w-5xl"
          }
          showCloseButton={!isDialogBusy}
          onEscapeKeyDown={(event) => {
            if (isDialogBusy) event.preventDefault()
            if (!editingPartId && hasUnsavedChanges) {
              event.preventDefault()
              setShowCloseWarning(true)
            }
          }}
          onPointerDownOutside={(event) => {
            if (isDialogBusy) event.preventDefault()
            if (!editingPartId && hasUnsavedChanges) {
              event.preventDefault()
              setShowCloseWarning(true)
            }
          }}
        >
          {isDialogBusy && (
            <div className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin text-primary" />
              <div className="space-y-0.5 text-center">
                <p className="text-sm font-medium">
                  {isSubmitting
                    ? `Saving ${pendingCount} part${pendingCount > 1 ? "s" : ""}...`
                    : editingPartId
                      ? "Updating part..."
                      : "Adding part..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please wait until the request completes.
                </p>
              </div>
            </div>
          )}
          <DialogHeader>
            <DialogTitle>
              {editingPartId ? "Edit Part" : config.dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {editingPartId
                ? "Update the part details. If this service is completed, reopen it first before editing parts."
                : `${config.dialogDescription} Finalize parts before completion.`}
            </DialogDescription>
          </DialogHeader>

          {!editingPartId ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <div className="space-y-4 lg:sticky lg:top-0">
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Part Input
                    </Label>
                    {editingPendingIndex !== null && (
                      <Badge variant="secondary" className="text-xs">
                        Editing queued item
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 rounded-xl border bg-linear-to-b from-muted/60 to-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Layers className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Parts Templates
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Reusable parts lists for faster queuing
                          </p>
                        </div>
                      </div>
                      {templatesLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    </div>

                    <ComboBox
                      options={serviceTemplateOptions}
                      value={selectedTemplateId}
                      onChange={(value) => setSelectedTemplateId(value as number | null)}
                      placeholder="Select template..."
                      searchPlaceholder="Search templates..."
                      disabled={isDialogBusy || templateActionBusy || templatesLoading}
                    />
                    {selectedTemplate && (
                      <p className="text-xs text-muted-foreground">
                        {selectedTemplate.description || "No description"}
                      </p>
                    )}
                    {selectedTemplate && hasTemplateMetadataChanges && (
                      <p className="text-xs text-amber-600">
                        You have unsaved template details. Update before applying.
                      </p>
                    )}
                    {selectedTemplate && hasTemplateQueueChanges && (
                      <p className="text-xs text-amber-600">
                        Queue differs from this template. You can keep queue-only items, or click Update to save these changes to the template.
                      </p>
                    )}
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name"
                      disabled={isDialogBusy || templateActionBusy}
                    />
                    <Input
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Template description (optional)"
                      disabled={isDialogBusy || templateActionBusy}
                    />

                    {!selectedTemplate ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleCreateTemplate}
                        disabled={isDialogBusy || templateActionBusy}
                      >
                        <Save className="mr-1.5 size-3.5" />
                        Save New Template
                      </Button>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={handleApplyTemplate}
                          disabled={!canApplyTemplate}
                        >
                          <Sparkles className="mr-1.5 size-3.5" />
                          Apply
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleUpdateTemplate}
                          disabled={!canUpdateTemplate}
                        >
                          <RefreshCcw className="mr-1.5 size-3.5" />
                          Update
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={handleDeleteTemplate}
                          disabled={isDialogBusy || templateActionBusy}
                        >
                          <Trash2 className="mr-1.5 size-3.5" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${config.checkboxIdPrefix}_is_custom_service`}
                      checked={!!serviceDraft?.isCustom}
                      disabled={isDialogBusy}
                      onCheckedChange={(checked) => {
                        const next = checked === true
                        serviceComposerForm.setValue("draft.isCustom", next)
                        serviceComposerForm.setValue("draft.itemId", null)
                        if (!next) {
                          serviceComposerForm.setValue("draft.customPrice", "")
                          serviceComposerForm.setValue("draft.customDescription", "")
                          serviceComposerForm.setValue("draft.selectedUntrackedItemId", null)
                        }
                      }}
                    />
                    <Label htmlFor={`${config.checkboxIdPrefix}_is_custom_service`} className="text-sm">
                      Custom Item (no stock deduction)
                    </Label>
                  </div>

                  {serviceDraft?.isCustom ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Select from custom items</Label>
                        <ComboBox
                          options={untrackedItemOptions}
                          value={serviceDraft.selectedUntrackedItemId}
                          onChange={(value) => {
                            const id = value as number | null
                            serviceComposerForm.setValue("draft.selectedUntrackedItemId", id)
                            if (id) {
                              const matched = untrackedItems.find((i) => i.id === id)
                              serviceComposerForm.setValue("draft.customDescription", matched?.name || "")
                              serviceComposerForm.setValue("draft.customPrice", matched?.retail_price || "")
                            }
                          }}
                          placeholder="Select custom item or enter manually below..."
                          searchPlaceholder="Search custom items..."
                          disabled={isDialogBusy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input
                          value={serviceDraft.customDescription || ""}
                          onChange={(e) => {
                            serviceComposerForm.setValue("draft.customDescription", e.target.value)
                            if (serviceDraft.selectedUntrackedItemId) {
                              serviceComposerForm.setValue("draft.selectedUntrackedItemId", null)
                            }
                          }}
                          placeholder="Enter item name..."
                          disabled={isDialogBusy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price (PHP)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={serviceDraft.customPrice || ""}
                          onChange={(e) =>
                            serviceComposerForm.setValue("draft.customPrice", e.target.value)
                          }
                          disabled={isDialogBusy}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Item</Label>
                        <ComboBox
                          options={itemOptions}
                          value={serviceDraft?.itemId ?? null}
                          onChange={(value) =>
                            serviceComposerForm.setValue("draft.itemId", value as number | null)
                          }
                          placeholder="Select item..."
                          searchPlaceholder="Search items..."
                          disabled={itemsLoading || isDialogBusy}
                        />
                      </div>
                      {selectedItem && (
                        <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                          <p className="truncate font-medium text-foreground">{selectedItem.name}</p>
                          <p>
                            {selectedItem.sku ? `${selectedItem.sku} | ` : ""}
                            {selectedItem.unit_of_measure}
                          </p>
                          <p className="font-medium text-foreground mt-1">
                            {formatCurrency(selectedItem.retail_price)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={selectedItem && selectedItem.unit_of_measure === "kg" ? "0.25" : selectedItem && selectedItem.unit_of_measure === "ft" ? "0.01" : "1"}
                      step={selectedItem && ["kg", "ft"].includes(selectedItem.unit_of_measure) ? "any" : "1"}
                      value={serviceDraft?.quantity || "1"}
                      onChange={(e) => serviceComposerForm.setValue("draft.quantity", e.target.value)}
                      disabled={isDialogBusy}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${config.checkboxIdPrefix}_is_free_service`}
                        checked={!!serviceDraft?.isFree}
                        disabled={isDialogBusy}
                        onCheckedChange={(checked) => {
                          const next = checked === true
                          serviceComposerForm.setValue("draft.isFree", next)
                          if (next) {
                            serviceComposerForm.setValue("draft.discountValue", "")
                            serviceComposerForm.setValue("draft.discountReason", "")
                          }
                        }}
                      />
                      <Label htmlFor={`${config.checkboxIdPrefix}_is_free_service`} className="text-sm">
                        Free item
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Discount (PHP)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={serviceDraft?.discountValue || ""}
                        onChange={(e) =>
                          serviceComposerForm.setValue("draft.discountValue", e.target.value)
                        }
                        disabled={isDialogBusy || !!serviceDraft?.isFree}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Discount Reason</Label>
                    <Input
                      value={serviceDraft?.discountReason || ""}
                      onChange={(e) =>
                        serviceComposerForm.setValue("draft.discountReason", e.target.value)
                      }
                      disabled={isDialogBusy || !!serviceDraft?.isFree}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:flex-1"
                      onClick={() => {
                        resetServiceDraft()
                      }}
                      disabled={!canClearDraftInput}
                    >
                      Clear Input
                    </Button>
                    <Button
                      type="button"
                      className="sm:flex-1"
                      onClick={handleAddToList}
                      disabled={!canAddDraftToQueue}
                    >
                      {editingPendingIndex !== null ? "Update Queued Item" : "Add To Queue"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{queuedPartsLabel}</p>
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 rounded-full px-1 text-[10px]"
                    >
                      {pendingPartFields.length}
                    </Badge>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2">
                  {pendingPartFields.length === 0 && (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No queued items yet. Add a part from the form on the left.
                    </div>
                  )}
                  {pendingPartFields.map((field, index) => {
                    const lineTotal = (() => {
                      const qty = parseFloat(field.quantity || "0")
                      const unitPrice = field.isCustom
                        ? parseFloat(field.customPrice || "0")
                        : Number(items.find((i) => i.id === field.itemId)?.retail_price || 0)
                      const discount = field.isFree ? unitPrice * qty : parseFloat(field.discountValue || "0")
                      return field.isFree ? 0 : unitPrice * qty - discount
                    })()

                    return (
                      <div key={field.fieldKey} className="rounded-md border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{field.itemName || "Custom Item"}</p>
                            <p className="text-xs text-muted-foreground">Qty: {field.quantity}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {field.isCustom && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                              {field.isFree && <Badge variant="success" className="text-xs">Free</Badge>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{formatCurrency(lineTotal)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isDialogBusy}
                            onClick={() => {
                              serviceComposerForm.setValue("draft", {
                                isCustom: field.isCustom,
                                itemId: field.itemId,
                                itemName: field.itemName,
                                quantity: field.quantity,
                                customPrice: field.customPrice,
                                customDescription: field.customDescription,
                                isFree: field.isFree,
                                discountValue: field.discountValue,
                                discountReason: field.discountReason,
                                selectedUntrackedItemId: field.selectedUntrackedItemId,
                              })
                              setEditingPendingIndex(index)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={isDialogBusy}
                            onClick={() => {
                              removePendingPart(index)
                              if (editingPendingIndex === index) {
                                resetServiceDraft()
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* Pending Items List */}
          {!editingPartId && pendingItems.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Items to Add
                </Label>
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 rounded-full px-1 text-[10px]"
                >
                  {pendingItems.length}
                </Badge>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {pendingItems.map((item) => {
                  const unitPrice = item.isCustom
                    ? parseFloat(item.customPrice || "0")
                    : Number(
                        items.find((i) => i.id === item.itemId)?.retail_price ||
                          0,
                      )
                  const qty = parseFloat(item.quantity || "0")
                  const discount = item.isFree
                    ? unitPrice * qty
                    : parseFloat(item.discountValue || "0")
                  const lineTotal = item.isFree ? 0 : unitPrice * qty - discount
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm bg-background rounded px-2 py-1.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className="truncate font-medium"
                          title={item.itemName}
                        >
                          {item.itemName}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          &times; {item.quantity}
                        </span>
                        {item.isFree && (
                          <Badge
                            variant="success"
                            className="text-xs shrink-0"
                          >
                            FREE
                          </Badge>
                        )}
                        {item.isCustom && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            Custom
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-medium">
                          {formatCurrency(lineTotal)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={isDialogBusy}
                          onClick={() =>
                            setPendingItems((prev) =>
                              prev.filter((p) => p.id !== item.id),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {pendingItems.length > 1 && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                  <span className="text-muted-foreground font-medium">
                    Total
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      pendingItems.reduce((sum, item) => {
                        const unitPrice = item.isCustom
                          ? parseFloat(item.customPrice || "0")
                          : Number(
                              items.find((i) => i.id === item.itemId)
                                ?.retail_price || 0,
                            )
                        const qty = parseFloat(item.quantity || "0")
                        const discount = item.isFree
                          ? unitPrice * qty
                          : parseFloat(item.discountValue || "0")
                        return (
                          sum + (item.isFree ? 0 : unitPrice * qty - discount)
                        )
                      }, 0),
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className={entityType === "service" ? "max-h-[70vh] space-y-4 overflow-y-auto py-4 pr-1" : "max-h-[70vh] space-y-4 overflow-y-auto py-4 px-1 pr-2"}>
            {/* Custom Item Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${config.checkboxIdPrefix}_is_custom`}
                checked={isCustom}
                disabled={isDialogBusy}
                onCheckedChange={(checked) => {
                  setIsCustom(checked === true)
                  if (checked === true) {
                    setSelectedItemId(null)
                  } else {
                    setCustomPrice("")
                    setCustomDescription("")
                  }
                }}
                className="cursor-pointer"
              />
              <Label
                htmlFor={`${config.checkboxIdPrefix}_is_custom`}
                className="text-sm font-medium cursor-pointer"
              >
                Custom Item (no stock deduction)
              </Label>
            </div>

            {isCustom ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Select from custom items</Label>
                  <ComboBox
                    options={untrackedItemOptions}
                    value={selectedUntrackedItemId}
                    onChange={(value) => {
                      const id = value as number | null
                      setSelectedUntrackedItemId(id)
                      if (id) {
                        const item = untrackedItems.find((i) => i.id === id)
                        if (item) {
                          setCustomPrice(item.retail_price)
                          setCustomDescription(item.name)
                        }
                      } else {
                        setCustomPrice("")
                        setCustomDescription("")
                      }
                    }}
                    placeholder="Select custom item or enter manually below..."
                    searchPlaceholder="Search custom items..."
                    disabled={isDialogBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Item Name{selectedUntrackedItemId ? " (from selection)" : ""}
                  </Label>
                  <Input
                    value={customDescription}
                    onChange={(e) => {
                      setCustomDescription(e.target.value)
                      if (selectedUntrackedItemId) {
                        setSelectedUntrackedItemId(null)
                      }
                    }}
                    placeholder="Enter item name..."
                    disabled={isDialogBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Unit Price (₱){selectedUntrackedItemId ? " — auto-filled, can override" : ""}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={isDialogBusy}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Item</Label>
                  <ComboBox
                    options={itemOptions}
                    value={selectedItemId}
                    onChange={(value) =>
                      setSelectedItemId(value as number | null)
                    }
                    placeholder="Select item..."
                    searchPlaceholder="Search items..."
                    disabled={itemsLoading || isDialogBusy}
                  />
                </div>

                {selectedItem && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p
                          className="truncate text-sm font-medium"
                          title={selectedItem.name}
                        >
                          {selectedItem.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {selectedItem.sku && <span>{selectedItem.sku}</span>}
                          <span>{selectedItem.unit_of_measure}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-muted-foreground">
                          Unit Price
                        </p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(selectedItem.retail_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock availability info */}
                {selectedItem && selectedItemStock && (
                  <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Available Stock:
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          selectedItemStock.status === "no_stock" &&
                            "text-destructive",
                          selectedItemStock.status === "low_stock" &&
                            "text-amber-600",
                          selectedItemStock.status === "high_stock" &&
                            "text-success",
                        )}
                      >
                        {selectedItemStock.available_quantity}{" "}
                        {selectedItem.unit_of_measure}
                      </span>
                    </div>
                    {selectedItemStock.status === "no_stock" && (
                      <p className="text-xs text-destructive font-medium">
                        No stock available
                      </p>
                    )}
                    {selectedItemStock.status === "low_stock" && (
                      <p className="text-xs text-amber-600">Low stock</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Quantity</Label>
                {selectedItem && selectedItem.unit_of_measure === "kg" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-[200px]"
                    >
                      <div className="space-y-1.5">
                        <p className="font-semibold text-xs">
                          Fraction to Decimal:
                        </p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                          <span>1/4 kg</span>
                          <span className="font-mono">= 0.25</span>
                          <span>1/2 kg</span>
                          <span className="font-mono">= 0.5</span>
                          <span>3/4 kg</span>
                          <span className="font-mono">= 0.75</span>
                          <span>1 kg</span>
                          <span className="font-mono">= 1</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Input
                type="number"
                min={
                  selectedItem && selectedItem.unit_of_measure === "kg"
                    ? "0.25"
                    : selectedItem && selectedItem.unit_of_measure === "ft"
                      ? "0.01"
                      : "1"
                }
                step={
                  selectedItem &&
                  ["kg", "ft"].includes(selectedItem.unit_of_measure)
                    ? "any"
                    : "1"
                }
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isDialogBusy}
                onBlur={() => {
                  if (
                    !selectedItem ||
                    ["kg", "ft"].includes(selectedItem.unit_of_measure)
                  )
                    return
                  const parsed = parseFloat(quantity)
                  if (!isNaN(parsed) && parsed > 0) {
                    setQuantity(String(Math.round(parsed) || 1))
                  }
                }}
                placeholder={
                  selectedItem &&
                  ["kg", "ft"].includes(selectedItem.unit_of_measure)
                    ? `Enter quantity (${selectedItem.unit_of_measure})`
                    : "Enter quantity"
                }
              />
              {selectedItem &&
                ["kg", "ft"].includes(selectedItem.unit_of_measure) && (
                  <p className="text-xs text-muted-foreground">
                    Supports decimal values (e.g., 2.5{" "}
                    {selectedItem.unit_of_measure})
                  </p>
                )}
            </div>

            {/* Is Free Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${config.checkboxIdPrefix}_is_free`}
                checked={isFree}
                disabled={isDialogBusy}
                onCheckedChange={(checked) => {
                  setIsFree(checked === true)
                  if (checked === true) {
                    setDiscountValue("")
                    setDiscountReason("")
                  }
                }}
                className="cursor-pointer"
              />
              <Label
                htmlFor={`${config.checkboxIdPrefix}_is_free`}
                className="text-sm font-medium cursor-pointer"
              >
                Part is Free (Warranty/Complementary)
              </Label>
            </div>

            {/* Discount Section */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Item Discount
              </Label>
              {isFree ? (
                <p className="text-xs text-muted-foreground">
                  Discount not applicable for free parts
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Amount (₱)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder="0"
                          disabled={isDialogBusy || isFree}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Enter discount in peso amount
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Reason</Label>
                    <Input
                      placeholder="Optional"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      disabled={isDialogBusy || isFree}
                    />
                  </div>
                </div>
              )}
            </div>

            {(selectedItemId || (isCustom && customPrice)) && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(
                      (isCustom
                        ? parseFloat(customPrice || "0")
                        : Number(
                            items.find((i) => i.id === selectedItemId)
                              ?.retail_price || 0,
                          )) * parseFloat(quantity || "0"),
                    )}
                  </span>
                </div>
                {discountValue && parseFloat(discountValue) > 0 && (
                  <>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-success">Discount</span>
                      <span className="text-sm text-success">
                        -₱{discountValue}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Final Cost</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(
                          (() => {
                            const subtotal =
                              (isCustom
                                ? parseFloat(customPrice || "0")
                                : Number(
                                    items.find((i) => i.id === selectedItemId)
                                      ?.retail_price || 0,
                                  )) * parseFloat(quantity || "0")
                            const discount = parseFloat(discountValue)
                            return subtotal - discount
                          })(),
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
            </>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {editingPartId ? (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={isDialogBusy}
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingPartId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePart}
                  disabled={
                    isDialogBusy ||
                    (isCustom
                      ? !selectedUntrackedItemId || !quantity
                      : !selectedItemId || !quantity)
                  }
                >
                  {isMutatingPart && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {isMutatingPart ? "Updating..." : "Update Part"}
                </Button>
              </div>
            ) : (
              <>
                {editingPartId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddToList}
                    disabled={
                      isDialogBusy ||
                      (isCustom
                        ? !selectedUntrackedItemId || !quantity
                        : !selectedItemId || !quantity)
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    {pendingItems.length > 0 ? "Add Another Item" : "Add Item"}
                  </Button>
                )}
                {pendingCount > 0 && (
                  <Button
                    className="w-full"
                    onClick={handleSubmitAll}
                    disabled={isDialogBusy}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {isSubmitting
                      ? `Saving ${pendingCount} item${pendingCount > 1 ? "s" : ""}...`
                      : `Save ${pendingCount} Item${pendingCount > 1 ? "s" : ""} to ${config.submitLabel}`}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Part"
        description="Are you sure you want to remove this part? This will return the quantity to stock."
        confirmText="Remove"
        cancelText="Cancel"
        variant="warning"
      />

      <ConfirmDialog
        open={showCloseWarning}
        onCancel={() => setShowCloseWarning(false)}
        onConfirm={() => {
          setShowCloseWarning(false)
          setDialogOpen(false)
          setEditingPartId(null)
          setSelectedItemId(null)
          setQuantity("1")
          setIsFree(false)
          setIsCustom(false)
          setCustomPrice("")
          setDiscountValue("")
          setDiscountReason("")
          setSelectedUntrackedItemId(null)
          setPendingItems([])
          resetServiceComposer()
        }}
        title="Discard Changes?"
        description={`You have ${pendingCount > 0 ? `${pendingCount} unsaved item${pendingCount > 1 ? "s" : ""}` : "unsaved changes"} that will be lost. Are you sure you want to close?`}
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="warning"
      />

      <ConfirmDialog
        open={templateDeleteConfirmOpen}
        onCancel={() => setTemplateDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteTemplate}
        title="Remove Template"
        description={
          selectedTemplate
            ? `Are you sure you want to remove "${selectedTemplate.name}"? This action cannot be undone.`
            : "Are you sure you want to remove this template?"
        }
        confirmText="Remove"
        cancelText="Cancel"
        variant="warning"
        isLoading={deleteTemplate.isPending}
      />
    </>
  )
}
