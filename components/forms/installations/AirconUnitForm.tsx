"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AirconUnitPayload } from "@/lib/constants/infers"
import { AirconUnits } from "@/lib/constants/interface"
import { AirconUnitSchema } from "@/lib/constants/schema"
import { useAirconUnitMutations } from "@/lib/mutations/installations/useAirconUnitMutations"
import { useAirconModels } from "@/lib/queries/useAircons"
import { zodResolver } from "@hookform/resolvers/zod"
import { Shield } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

interface Props {
    initialData?: AirconUnits
    onClose: () => void
}

export default function AirconUnitForm({ initialData, onClose }: Props) {
    const isEditing = !!initialData
    const { addUnit, updateUnit } = useAirconUnitMutations()
    const { data: models } = useAirconModels({ limit: 100 })

    const form = useForm<AirconUnitPayload>({
        resolver: zodResolver(AirconUnitSchema),
        defaultValues: {
            serial_number: initialData?.serial_number ?? "",
            outdoor_serial_number: initialData?.outdoor_serial_number ?? "",
            model_id: initialData?.model?.id ?? undefined,
            compressor_warranty_months:
                initialData?.compressor_warranty_months ?? undefined,
            labor_warranty_months: initialData?.labor_warranty_months ?? undefined,
            parts_warranty_months: initialData?.parts_warranty_months ?? undefined,
        },
        mode: "onSubmit",
    })

    const { handleSubmit, control, reset } = form

    // Watch model_id to show model details
    const selectedModelId = useWatch({ control, name: "model_id" })
    const selectedModel = models?.results.find((m) => m.id === selectedModelId)

    useEffect(() => {
        if (initialData) {
            reset({
                model_id: initialData.model?.id,
                serial_number: initialData.serial_number,
                outdoor_serial_number: initialData.outdoor_serial_number ?? "",
                compressor_warranty_months:
                    initialData.compressor_warranty_months ?? undefined,
                labor_warranty_months: initialData.labor_warranty_months ?? undefined,
                parts_warranty_months: initialData.parts_warranty_months ?? undefined,
            })
        }
    }, [initialData, reset])

    const handleFormSubmit = (data: AirconUnitPayload) => {
        const payload: Record<string, unknown> = {
            serial_number: data.serial_number.toUpperCase(),
            outdoor_serial_number: data.outdoor_serial_number.toUpperCase(),
            model_id: data.model_id,
        }

        if (data.compressor_warranty_months != null) {
            payload.compressor_warranty_months = data.compressor_warranty_months
        }
        if (data.labor_warranty_months != null) {
            payload.labor_warranty_months = data.labor_warranty_months
        }
        if (data.parts_warranty_months != null) {
            payload.parts_warranty_months = data.parts_warranty_months
        }

        if (isEditing && initialData) {
            updateUnit.mutate(
                { id: initialData.id, data: payload as AirconUnitPayload },
                { onSuccess: onClose },
            )
        } else {
            addUnit.mutate(payload as AirconUnitPayload, { onSuccess: onClose })
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-8"
            >
                {/* Model Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aircon Model</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Select the aircon model for this unit
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={control}
                            name="model_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Model</FormLabel>
                                    <FormControl>
                                        <ComboBox
                                            value={field.value ?? null}
                                            onChange={(val) => field.onChange(val ?? undefined)}
                                            options={
                                                models?.results.map((m) => ({
                                                    value: m.id,
                                                    label: `${m.brand?.name || ""} ${m.name}`,
                                                })) ?? []
                                            }
                                            placeholder="Select aircon model"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedModel && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <h4 className="text-sm font-medium mb-2">Model Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Type:</span>{" "}
                                        <span className="font-medium capitalize">
                                            {selectedModel.aircon_type || "N/A"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">HP:</span>{" "}
                                        <span className="font-medium">
                                            {selectedModel.horsepower || "N/A"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Price:</span>{" "}
                                        <span className="font-medium">
                                            ₱{selectedModel.retail_price?.toLocaleString() || "0.00"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Inverter:</span>{" "}
                                        <span className="font-medium">
                                            {selectedModel.is_inverter ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="grid">
                                        <div>
                                            <span className="text-muted-foreground">
                                                Parts Warranty:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {selectedModel.parts_warranty_years ?? 1} yr(s)
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Compressor Warranty:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {selectedModel.compressor_warranty_years ?? 5} yr(s)
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Labor Warranty:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {selectedModel.labor_warranty_years ?? 1} yr(s)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Serial Numbers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Serial Numbers</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Enter the indoor and outdoor unit serial numbers
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={control}
                            name="serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Indoor Unit Serial Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter indoor serial number"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="outdoor_serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Outdoor Unit Serial Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter outdoor serial number"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Warranty Override */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="size-5" />
                            Warranty Configuration
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Override the default warranty periods from the model. Leave blank
                            to use model defaults.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid">
                            <FormField
                                control={control}
                                name="parts_warranty_months"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parts Warranty</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    className="h-11 pr-16"
                                                    placeholder={
                                                        selectedModel
                                                            ? `${selectedModel.parts_warranty_months ?? 12}`
                                                            : "12"
                                                    }
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === ""
                                                                ? undefined
                                                                : parseInt(e.target.value, 10),
                                                        )
                                                    }
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                    months
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            {field.value
                                                ? `≈ ${(Number(field.value) / 12).toFixed(1)} year(s)`
                                                : selectedModel
                                                    ? `Default: ${((selectedModel.parts_warranty_months ?? 12) / 12).toFixed(1)} year(s)`
                                                    : "Default: 1.0 year(s)"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="compressor_warranty_months"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Compressor Warranty</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    className="h-11 pr-16"
                                                    placeholder={
                                                        selectedModel
                                                            ? `${selectedModel.compressor_warranty_months ?? 60}`
                                                            : "60"
                                                    }
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === ""
                                                                ? undefined
                                                                : parseInt(e.target.value, 10),
                                                        )
                                                    }
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                    months
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            {field.value
                                                ? `≈ ${(Number(field.value) / 12).toFixed(1)} year(s)`
                                                : selectedModel
                                                    ? `Default: ${((selectedModel.compressor_warranty_months ?? 60) / 12).toFixed(1)} year(s)`
                                                    : "Default: 5.0 year(s)"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="labor_warranty_months"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Labor Warranty</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    className="h-11 pr-16"
                                                    placeholder={
                                                        selectedModel
                                                            ? `${selectedModel.labor_warranty_months ?? 12}`
                                                            : "12"
                                                    }
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === ""
                                                                ? undefined
                                                                : parseInt(e.target.value, 10),
                                                        )
                                                    }
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                    months
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            {field.value
                                                ? `≈ ${(Number(field.value) / 12).toFixed(1)} year(s)`
                                                : selectedModel
                                                    ? `Default: ${((selectedModel.labor_warranty_months ?? 12) / 12).toFixed(1)} year(s)`
                                                    : "Default: 1.0 year(s)"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-4 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="min-w-32"
                    >
                        {isEditing ? "Update Unit" : "Add Unit"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
