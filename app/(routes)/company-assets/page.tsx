"use client"

import { getCompanyAssetColumns } from "@/app/(routes)/company-assets/columns"
import { CardSelect } from "@/components/custom/inputs/CardSelect"
import { ClientCardSelect } from "@/components/custom/inputs/ClientComboBox"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CompanyAsset } from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useCompanyAssetMutations } from "@/lib/mutations/services/useCompanyAssetMutations"
import {
    useCompanyAssetFilters,
    useCompanyAssets,
} from "@/lib/queries/services/useCompanyAssets"
import { Building2, Package, Recycle, Trash2 } from "lucide-react"
import { useState } from "react"

const statusOptions = [
    {
        label: "In Storage",
        value: "holding",
        icon: Package,
        description: "Keep in company inventory",
    },
    {
        label: "Repurposed",
        value: "repurposed",
        icon: Recycle,
        description: "Used for parts or internal use",
    },
    {
        label: "Disposed",
        value: "disposed",
        icon: Trash2,
        description: "Scrapped or discarded",
    },
]

const emptyData: PaginatedResult<CompanyAsset> = {
    count: 0,
    next: null,
    previous: null,
    results: [],
}

export default function CompanyAssetsPage() {
    const searchParams = useSearchParameters()
    const { page, limit, search, ordering, filter } = searchParams

    const { data, isLoading, refetch } = useCompanyAssets({
        page,
        limit,
        search,
        ordering,
        filter,
    })

    const { filters, orderingOptions } = useCompanyAssetFilters()
    const { dispose, sell, updateStatus } = useCompanyAssetMutations()

    // Dispose dialog
    const [disposeTarget, setDisposeTarget] = useState<CompanyAsset | null>(null)
    const [disposeNotes, setDisposeNotes] = useState("")

    // Sell dialog
    const [sellTarget, setSellTarget] = useState<CompanyAsset | null>(null)
    const [salePrice, setSalePrice] = useState("")
    const [soldTo, setSoldTo] = useState<number | null>(null)
    const [sellNotes, setSellNotes] = useState("")

    // Update status dialog
    const [updateTarget, setUpdateTarget] = useState<CompanyAsset | null>(null)
    const [newStatus, setNewStatus] = useState("")
    const [statusNotes, setStatusNotes] = useState("")

    const handleSell = (asset: CompanyAsset) => {
        setSellTarget(asset)
        setSalePrice("")
        setSoldTo(null)
        setSellNotes("")
    }

    const handleDispose = (asset: CompanyAsset) => {
        setDisposeTarget(asset)
        setDisposeNotes("")
    }

    const handleUpdateStatus = (asset: CompanyAsset) => {
        setUpdateTarget(asset)
        setNewStatus(asset.status)
        setStatusNotes(asset.condition_notes ?? "")
    }

    const confirmSell = () => {
        if (!sellTarget || !salePrice || !soldTo) return
        sell.mutate(
            {
                id: sellTarget.id,
                sale_price: parseFloat(salePrice),
                sold_to: soldTo!,
                disposal_notes: sellNotes || undefined,
            },
            {
                onSuccess: () => {
                    setSellTarget(null)
                    setSalePrice("")
                    setSoldTo(null)
                    setSellNotes("")
                    refetch()
                },
            },
        )
    }

    const confirmDispose = () => {
        if (!disposeTarget) return
        dispose.mutate(
            { id: disposeTarget.id, notes: disposeNotes || undefined },
            {
                onSuccess: () => {
                    setDisposeTarget(null)
                    setDisposeNotes("")
                    refetch()
                },
            },
        )
    }

    const confirmUpdateStatus = () => {
        if (!updateTarget || !newStatus) return
        updateStatus.mutate(
            {
                id: updateTarget.id,
                status: newStatus,
                condition_notes: statusNotes || undefined,
            },
            {
                onSuccess: () => {
                    setUpdateTarget(null)
                    setNewStatus("")
                    setStatusNotes("")
                    refetch()
                },
            },
        )
    }

    const columns = getCompanyAssetColumns({
        onSell: handleSell,
        onDispose: handleDispose,
        onUpdateStatus: handleUpdateStatus,
    })

    return (
        <Wrapper>
            <PageHeader
                variant="compact"
                icon={Building2}
                title="Company Assets"
                description="Appliances acquired through forfeiture or client sale — tracked separately from inventory"
                onRefresh={refetch}
            />

            <DataTable<CompanyAsset, unknown>
                enableVirtualization
                columns={columns}
                data={data ?? emptyData}
                isLoading={isLoading}
                filters={filters}
                orderingOptions={orderingOptions}
                emptyIcon={Building2}
                emptyTitle="No company assets found"
                emptyDescription="Appliances declared as company property will appear here"
                searchPlaceholder="Search by client, appliance, service ref..."
            />

            {/* Sell Dialog */}
            <Dialog
                open={!!sellTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setSellTarget(null)
                        setSalePrice("")
                        setSoldTo(null)
                        setSellNotes("")
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Sell Asset</DialogTitle>
                        <DialogDescription>
                            {sellTarget
                                ? `Record sale of "${sellTarget.appliance_description}"`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Sold To</Label>
                            <ClientCardSelect
                                value={soldTo}
                                onChange={setSoldTo}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sale-price">Sale Price</Label>
                            <Input
                                id="sale-price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Enter sale price"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sell-notes">Notes</Label>
                            <Textarea
                                id="sell-notes"
                                placeholder="Any notes about the sale..."
                                value={sellNotes}
                                onChange={(e) => setSellNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSellTarget(null)
                                    setSalePrice("")
                                    setSoldTo(null)
                                    setSellNotes("")
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmSell}
                                disabled={sell.isPending || !salePrice || !soldTo}
                            >
                                {sell.isPending ? "Selling..." : "Confirm Sale"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dispose Dialog */}
            <Dialog
                open={!!disposeTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setDisposeTarget(null)
                        setDisposeNotes("")
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Asset as Disposed</DialogTitle>
                        <DialogDescription>
                            {disposeTarget
                                ? `Dispose of "${disposeTarget.appliance_description}"? This status is final.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="dispose-notes">Disposal Notes</Label>
                            <Textarea
                                id="dispose-notes"
                                placeholder="e.g. Scrapped, donated, sold as parts..."
                                value={disposeNotes}
                                onChange={(e) => setDisposeNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDisposeTarget(null)
                                    setDisposeNotes("")
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDispose}
                                disabled={dispose.isPending}
                            >
                                {dispose.isPending ? "Disposing..." : "Mark as Disposed"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog
                open={!!updateTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setUpdateTarget(null)
                        setNewStatus("")
                        setStatusNotes("")
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Asset Status</DialogTitle>
                        <DialogDescription>
                            {updateTarget
                                ? `Update status for "${updateTarget.appliance_description}"`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <CardSelect
                                options={statusOptions}
                                value={newStatus}
                                onChange={setNewStatus}
                                columns={3}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="status-notes">Condition Notes</Label>
                            <Textarea
                                id="status-notes"
                                placeholder="Any notes about the asset condition..."
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setUpdateTarget(null)
                                    setNewStatus("")
                                    setStatusNotes("")
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmUpdateStatus}
                                disabled={updateStatus.isPending || !newStatus}
                            >
                                {updateStatus.isPending ? "Updating..." : "Update Status"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Wrapper>
    )
}
