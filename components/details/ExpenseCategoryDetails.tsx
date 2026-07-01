"use client"

import { Detail } from "@/components/details/Detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseCategory } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
    Calendar,
    CheckCircle,
    DollarSign,
    FileText,
    FolderTree,
    Layers,
    XCircle,
} from "lucide-react"

export function ExpenseCategoryDetails({
    entity,
    onClose,
}: {
    entity: ExpenseCategory
    onClose: () => void
}) {
    return (
        <div className="space-y-6">
            {/* Status badges */}
            <div className="flex items-center gap-3">
                <Badge variant={entity?.is_active ? "default" : "secondary"}>
                    {entity?.is_active ? (
                        <CheckCircle className="size-3 mr-1" />
                    ) : (
                        <XCircle className="size-3 mr-1" />
                    )}
                    {entity?.is_active ? "Active" : "Inactive"}
                </Badge>
                {entity?.parent_data && (
                    <Badge variant="outline">
                        <FolderTree className="size-3 mr-1" />
                        Subcategory
                    </Badge>
                )}
            </div>

            {/* Category Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="size-4" />
                        Category Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <Detail
                            label="Category Name"
                            value={entity?.name}
                            icon={<Layers className="size-4" />}
                        />
                        {entity?.description && (
                            <Detail
                                label="Description"
                                value={entity.description}
                                icon={<FileText className="size-4" />}
                            />
                        )}
                        {entity?.parent_data && (
                            <Detail
                                label="Parent Category"
                                value={entity.parent_data.name}
                                icon={<FolderTree className="size-4" />}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Budget Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="size-4" />
                        Budget Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Detail
                            label="Monthly Budget"
                            value={
                                entity?.monthly_budget && entity.monthly_budget > 0
                                    ? formatCurrency(entity.monthly_budget)
                                    : "Not set"
                            }
                            icon={<DollarSign className="size-4" />}
                        />
                        {entity?.monthly_budget > 0 && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Budget Status
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Monthly budget limit:{" "}
                                    <span className="font-semibold">
                                        {formatCurrency(entity.monthly_budget)}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground italic mt-1">
                                    Budget tracking coming soon
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Subcategories */}
            {entity?.subcategories && entity.subcategories.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FolderTree className="size-4" />
                            Subcategories
                            <Badge
                                variant="secondary"
                                className="ml-1 text-xs"
                            >
                                {entity.subcategories.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {entity.subcategories.map((subcat) => (
                                <div
                                    key={subcat.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <Layers className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{subcat.name}</span>
                                    </div>
                                    <Badge variant={subcat.is_active ? "default" : "secondary"}>
                                        {subcat.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="size-4" />
                        Metadata
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Detail
                            label="Created At"
                            value={
                                entity?.created_at
                                    ? formatDate(
                                        new Date(entity.created_at),
                                        "EEE, MMM dd yyyy • hh:mm a",
                                    )
                                    : "N/A"
                            }
                            icon={<Calendar className="size-4" />}
                        />
                        <Detail
                            label="Last Updated"
                            value={
                                entity?.updated_at
                                    ? formatDate(
                                        new Date(entity.updated_at),
                                        "EEE, MMM dd yyyy • hh:mm a",
                                    )
                                    : "N/A"
                            }
                            icon={<Calendar className="size-4" />}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex justify-end border-t pt-4">
                <Button
                    variant="outline"
                    onClick={onClose}
                >
                    Close
                </Button>
            </div>
        </div>
    )
}
