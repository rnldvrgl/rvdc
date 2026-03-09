"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  QuotationTermsTemplate,
  QuotationTermsTemplateCategory,
  QuotationTermsTemplatePayload,
} from "@/lib/constants/types"
import { useQuotationTemplateMutations } from "@/lib/mutations/useQuotationTemplateMutations"
import { useQuotationTemplates } from "@/lib/queries/useQuotationTemplates"
import { cn } from "@/lib/utils/helpers"
import {
  Check,
  Coins,
  Edit,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Save,
  ScrollText,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { useCallback, useState } from "react"

type EditState = {
  id: number | null // null = creating new
  name: string
  category: QuotationTermsTemplateCategory
  lines: string[]
  is_default: boolean
}

const EMPTY_STATE: EditState = {
  id: null,
  name: "",
  category: "terms_conditions",
  lines: [""],
  is_default: false,
}

export default function QuotationTemplatesManager() {
  const { data: templates, isLoading } = useQuotationTemplates()
  const { addTemplate, updateTemplate, deleteTemplate } =
    useQuotationTemplateMutations()

  const [editing, setEditing] = useState<EditState | null>(null)

  const startCreate = () => setEditing({ ...EMPTY_STATE })

  const startEdit = (t: QuotationTermsTemplate) => {
    setEditing({
      id: t.id,
      name: t.name,
      category: t.category,
      lines: [...t.lines],
      is_default: t.is_default,
    })
  }

  const cancelEdit = () => setEditing(null)

  const updateLine = useCallback(
    (idx: number, value: string) => {
      if (!editing) return
      const next = [...editing.lines]
      next[idx] = value
      setEditing({ ...editing, lines: next })
    },
    [editing],
  )

  const removeLine = useCallback(
    (idx: number) => {
      if (!editing) return
      setEditing({
        ...editing,
        lines: editing.lines.filter((_, i) => i !== idx),
      })
    },
    [editing],
  )

  const addLine = useCallback(() => {
    if (!editing) return
    setEditing({ ...editing, lines: [...editing.lines, ""] })
  }, [editing])

  const handleSave = () => {
    if (!editing) return
    const payload: QuotationTermsTemplatePayload = {
      name: editing.name,
      category: editing.category,
      lines: editing.lines.filter((l) => l.trim()),
      is_default: editing.is_default,
    }

    if (editing.id) {
      updateTemplate.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setEditing(null) },
      )
    } else {
      addTemplate.mutate(payload, { onSuccess: () => setEditing(null) })
    }
  }

  const handleDelete = (id: number) => {
    deleteTemplate.mutate(id)
  }

  const isSaving = addTemplate.isPending || updateTemplate.isPending

  const groupedTemplates = {
    terms_conditions: (templates ?? []).filter(
      (t) => t.category === "terms_conditions",
    ),
    payment_terms: (templates ?? []).filter(
      (t) => t.category === "payment_terms",
    ),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Quotation Templates
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create reusable templates for terms &amp; conditions and payment
            terms. These can be selected when creating quotations.
          </p>
        </div>
        {!editing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={startCreate}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Template
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new terms template</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Edit / Create Form ── */}
      {editing && (
        <Card className="p-5 space-y-5">
          <h4 className="text-sm font-semibold text-foreground">
            {editing.id ? "Edit Template" : "New Template"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Template Name
              </Label>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder='e.g. "Installation", "Cleaning"'
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={editing.category}
                onValueChange={(v) =>
                  setEditing({
                    ...editing,
                    category: v as QuotationTermsTemplateCategory,
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms_conditions">
                    Terms & Conditions
                  </SelectItem>
                  <SelectItem value="payment_terms">Payment Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Default?</Label>
              <Button
                type="button"
                variant={editing.is_default ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-full h-9",
                  editing.is_default &&
                    "bg-amber-500 text-white hover:bg-amber-600",
                )}
                onClick={() =>
                  setEditing({ ...editing, is_default: !editing.is_default })
                }
              >
                <Star
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    editing.is_default && "fill-white",
                  )}
                />
                {editing.is_default ? "Default Template" : "Not Default"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Lines (one per input)
            </Label>
            {editing.lines.map((line, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-1.5"
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <Input
                  value={line}
                  onChange={(e) => updateLine(idx, e.target.value)}
                  placeholder={`Line ${idx + 1}...`}
                  className="h-8 text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  onClick={() => removeLine(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="h-7 text-xs mt-1 border-dashed text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Line
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={cancelEdit}
              disabled={isSaving}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={handleSave}
              disabled={isSaving || !editing.name.trim()}
            >
              {isSaving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1 h-3.5 w-3.5" />
              )}
              {editing.id ? "Update" : "Create"}
            </Button>
          </div>
        </Card>
      )}

      <Separator />

      {/* ── Template List ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm">Loading templates...</span>
        </div>
      ) : (templates ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
          <FileText className="h-14 w-14 mb-5 text-muted-foreground/40" />
          <p className="text-base font-semibold text-foreground">
            No templates yet
          </p>
          <p className="text-sm mt-1.5 mb-5 text-muted-foreground">
            Create your first template to speed up quotation creation.
          </p>
          {!editing && (
            <Button
              size="sm"
              variant="success"
              onClick={startCreate}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terms & Conditions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg border-2 border-blue-500/20">
                <ScrollText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Terms & Conditions
                </h4>
                <p className="text-xs text-muted-foreground">
                  {groupedTemplates.terms_conditions.length} template
                  {groupedTemplates.terms_conditions.length !== 1 ? "s" : ""}
                </p>
              </div>
              {!editing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    setEditing({ ...EMPTY_STATE, category: "terms_conditions" })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {groupedTemplates.terms_conditions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No terms templates yet
                  </p>
                </div>
              ) : (
                groupedTemplates.terms_conditions.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    accent="blue"
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Payment Terms Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg border-2 border-emerald-500/20">
                <Coins className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Payment Terms
                </h4>
                <p className="text-xs text-muted-foreground">
                  {groupedTemplates.payment_terms.length} template
                  {groupedTemplates.payment_terms.length !== 1 ? "s" : ""}
                </p>
              </div>
              {!editing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    setEditing({ ...EMPTY_STATE, category: "payment_terms" })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {groupedTemplates.payment_terms.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No payment templates yet
                  </p>
                </div>
              ) : (
                groupedTemplates.payment_terms.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    accent="emerald"
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Template Card Component
   ────────────────────────────────────────────────────────── */

function TemplateCard({
  template: t,
  accent,
  onEdit,
  onDelete,
}: {
  template: QuotationTermsTemplate
  accent: "blue" | "emerald"
  onEdit: (t: QuotationTermsTemplate) => void
  onDelete: (id: number) => void
}) {
  const accentBorder =
    accent === "blue" ? "border-l-blue-500" : "border-l-emerald-500"
  const checkColor = accent === "blue" ? "text-blue-500" : "text-emerald-500"

  return (
    <div
      className={cn(
        "group rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-border/80 border-l-[3px]",
        accentBorder,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {t.name}
          </span>
          {t.is_default && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
              <Star className="h-2.5 w-2.5 fill-amber-500" />
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onEdit(t)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(t.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ul className="space-y-1.5">
        {t.lines.map((line, i) => (
          <li
            key={i}
            className="text-[13px] text-foreground/80 flex items-start gap-2"
          >
            <Check className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", checkColor)} />
            <span>{line}</span>
          </li>
        ))}
        {t.lines.length === 0 && (
          <li className="text-sm text-muted-foreground italic">
            No lines defined
          </li>
        )}
      </ul>
    </div>
  )
}
