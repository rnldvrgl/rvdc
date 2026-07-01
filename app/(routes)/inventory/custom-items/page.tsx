"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CustomItemTemplate } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useCustomItemTemplateMutations } from "@/lib/mutations/useCustomItemTemplateMutations"
import { useCustomItemTemplates } from "@/lib/queries/inventory/useCustomItemTemplates"
import { formatCurrency } from "@/lib/utils/helpers"
import { Edit, LayoutList, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface TemplateFormState {
    name: string
    default_price: string
    description: string
    is_active: boolean
}

const defaultForm: TemplateFormState = {
    name: "",
    default_price: "",
    description: "",
    is_active: true,
}

export default function CustomItemsPage() {
    const { isAdmin } = useCurrentUser()
    const { data, isLoading } = useCustomItemTemplates({ limit: 200 })
    const { addTemplate, updateTemplate, deleteTemplate } =
        useCustomItemTemplateMutations()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [form, setForm] = useState<TemplateFormState>(defaultForm)

    const templates: CustomItemTemplate[] = data?.results ?? []

    const openAdd = () => {
        setEditingId(null)
        setForm(defaultForm)
        setDialogOpen(true)
    }

    const openEdit = (tpl: CustomItemTemplate) => {
        setEditingId(tpl.id)
        setForm({
            name: tpl.name,
            default_price: tpl.default_price,
            description: tpl.description,
            is_active: tpl.is_active,
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.default_price) {
            toast.error("Name and price are required.")
            return
        }
        const price = parseFloat(form.default_price)
        if (isNaN(price) || price < 0) {
            toast.error("Price must be a valid positive number.")
            return
        }
        const payload = {
            name: form.name.trim(),
            default_price: price.toFixed(2),
            description: form.description.trim(),
            is_active: form.is_active,
        }
        try {
            if (editingId) {
                await updateTemplate.mutateAsync({ id: editingId, data: payload })
            } else {
                await addTemplate.mutateAsync(payload)
            }
            setDialogOpen(false)
        } catch {
            // handled by mutation
        }
    }

    const handleDelete = async (tpl: CustomItemTemplate) => {
        if (!confirm(`Delete template "${tpl.name}"? This cannot be undone.`))
            return
        try {
            await deleteTemplate.mutateAsync(tpl.id)
        } catch {
            // handled by mutation
        }
    }

    const isSaving = addTemplate.isPending || updateTemplate.isPending

    return (
        <Wrapper>
            <PageHeader
                variant="compact"
                title="Custom Item Templates"
                description="Manage reusable custom item templates for quick entry when adding parts to services."
                icon={LayoutList}
                actionButton={
                    isAdmin ? (
                        <Button
                            size="sm"
                            onClick={openAdd}
                        >
                            <Plus className="size-4 mr-1.5" />
                            Add Template
                        </Button>
                    ) : null
                }
            />

            {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                    Loading templates...
                </p>
            ) : templates.length === 0 ? (
                <div className="border rounded-lg py-16 flex flex-col items-center gap-3 text-muted-foreground">
                    <LayoutList className="size-10 opacity-30" />
                    <p className="text-sm">No custom item templates yet.</p>
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openAdd}
                        >
                            <Plus className="size-4 mr-1.5" />
                            Create First Template
                        </Button>
                    )}
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Default Price</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                {isAdmin && (
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((tpl) => (
                                <TableRow
                                    key={tpl.id}
                                    className={!tpl.is_active ? "opacity-50" : undefined}
                                >
                                    <TableCell className="font-medium">{tpl.name}</TableCell>
                                    <TableCell>{formatCurrency(tpl.default_price)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                        {tpl.description || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {tpl.is_active ? (
                                            <Badge
                                                variant="success"
                                                className="text-xs"
                                            >
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Inactive
                                            </Badge>
                                        )}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => openEdit(tpl)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit template</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(tpl)}
                                                            disabled={deleteTemplate.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete template</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Edit Template" : "New Custom Item Template"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="e.g., Drain hose, Mounting bracket"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Price (₱) *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.default_price}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, default_price: e.target.value }))
                                }
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                                placeholder="Optional notes..."
                                rows={2}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="tpl_active"
                                checked={form.is_active}
                                onCheckedChange={(val) =>
                                    setForm((f) => ({ ...f, is_active: val }))
                                }
                            />
                            <Label
                                htmlFor="tpl_active"
                                className="cursor-pointer"
                            >
                                Active (visible to all users)
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Create Template"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Wrapper>
    )
}
