"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn, tint } from "@/lib/utils/helpers"
import { Eraser, ImageIcon, Pen, Trash2, Upload } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"

interface SignatureInputProps {
    label: string
    value: string
    onChange: (dataUrl: string) => void
}

type Mode = "draw" | "upload"

export default function SignatureInput({
    label,
    value,
    onChange,
}: SignatureInputProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [mode, setMode] = useState<Mode>("upload")
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasContent, setHasContent] = useState(!!value)

    const initialValue = useRef(value)
    useEffect(() => {
        if (initialValue.current && canvasRef.current && mode === "draw") {
            const ctx = canvasRef.current.getContext("2d")
            if (!ctx) return
            const img = new Image()
            img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
                ctx.drawImage(img, 0, 0)
            }
            img.src = initialValue.current
        }
    }, [mode])

    const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if ("touches" in e) {
            const touch = e.touches[0]
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            }
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        }
    }, [])

    const startDrawing = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault()
            const ctx = canvasRef.current?.getContext("2d")
            if (!ctx) return
            const { x, y } = getPos(e)
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineWidth = 2
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.strokeStyle = "#000"
            setIsDrawing(true)
        },
        [getPos],
    )

    const draw = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (!isDrawing) return
            e.preventDefault()
            const ctx = canvasRef.current?.getContext("2d")
            if (!ctx) return
            const { x, y } = getPos(e)
            ctx.lineTo(x, y)
            ctx.stroke()
        },
        [isDrawing, getPos],
    )

    const stopDrawing = useCallback(() => {
        if (!isDrawing) return
        setIsDrawing(false)
        setHasContent(true)
        if (canvasRef.current) {
            onChange(canvasRef.current.toDataURL("image/png"))
        }
    }, [isDrawing, onChange])

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (!file.type.startsWith("image/")) return

            const img = new Image()
            const objectUrl = URL.createObjectURL(file)
            img.onload = () => {
                URL.revokeObjectURL(objectUrl)
                const maxW = 400
                const scale = img.width > maxW ? maxW / img.width : 1
                const w = Math.round(img.width * scale)
                const h = Math.round(img.height * scale)
                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) return
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/png")
                onChange(dataUrl)
                setHasContent(true)
            }
            img.src = objectUrl
        },
        [onChange],
    )

    const clearSignature = useCallback(() => {
        if (mode === "draw") {
            const ctx = canvasRef.current?.getContext("2d")
            if (!ctx || !canvasRef.current) return
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
        setHasContent(false)
        onChange("")
    }, [mode, onChange])

    const switchMode = (newMode: Mode) => {
        clearSignature()
        setMode(newMode)
    }

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => switchMode("draw")}
                                className="flex items-center justify-center size-6 rounded-md transition-colors"
                                style={
                                    mode === "draw"
                                        ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                                        : { color: "var(--muted-foreground)" }
                                }
                            >
                                <Pen className="size-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Draw signature</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => switchMode("upload")}
                                className="flex items-center justify-center size-6 rounded-md transition-colors"
                                style={
                                    mode === "upload"
                                        ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                                        : { color: "var(--muted-foreground)" }
                                }
                            >
                                <Upload className="size-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Upload image</TooltipContent>
                    </Tooltip>
                </div>


            </div>

            {mode === "draw" ? (
                <div
                    className="rounded-md border bg-white overflow-hidden transition-colors relative"
                    style={{ borderColor: isDrawing ? "var(--primary)" : "var(--border)" }}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon-sm"
                                onClick={clearSignature}
                                className={cn("absolute top-2 right-2 z-10 transition-transform", hasContent ? "scale-100" : "scale-0")}
                            >
                                <Eraser className="h-2 w-2" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear signature</TooltipContent>
                    </Tooltip>
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        className="w-full h-32 cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            ) : (
                <div
                    className="border border-dashed rounded-lg p-3 flex items-center gap-4 transition-colors bg-muted/20"
                    style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = tint("--primary", 60))}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                    {/* Preview / Placeholder */}
                    <div className="relative size-16 rounded-md overflow-hidden border bg-muted/30 shrink-0 group">
                        {hasContent && value ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={value}
                                    alt={label}
                                    className="h-full w-full object-contain transition group-hover:opacity-60"
                                />
                                <button
                                    type="button"
                                    onClick={clearSignature}
                                    aria-label="Remove signature"
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                    style={{ backgroundColor: tint("--destructive", 75) }}
                                >
                                    <Trash2 className="h-4 w-4" style={{ color: "var(--destructive-foreground)" }} />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full w-full">
                                <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>

                    {/* Upload Actions */}
                    <div className="flex justify-between items-center gap-1.5 flex-1 min-w-0">
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-xs font-medium text-foreground">
                                Upload signature
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                                PNG, JPG up to 2MB
                            </p>
                        </div>
                        <label
                            role="button"
                            className="inline-flex items-center justify-center w-max px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer shadow-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                        >
                            <Upload className="mr-1.5 h-3 w-3" />
                            Browse
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpg, image/jpeg"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
    )
}
