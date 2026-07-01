"use client"

export { AnimatedNumber, AnimatedNumberGroup } from "@/components/custom/shared/AnimatedNumber"

import { motion, type Variants } from "framer-motion"
import { ReactNode } from "react"

// Staggered container — children animate in sequence
const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
}

// Fade-up animation for individual items
const fadeUpItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

// Scale-in animation for cards
const scaleItem: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
}

// Section fade-in
const sectionFade: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
}

export function StaggerGrid({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            className={className}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
        >
            {children}
        </motion.div>
    )
}

export function FadeUpItem({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            className={className}
            variants={fadeUpItem}
        >
            {children}
        </motion.div>
    )
}

export function ScaleItem({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            className={className}
            variants={scaleItem}
        >
            {children}
        </motion.div>
    )
}

export function SectionReveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
                hidden: sectionFade.hidden,
                visible: {
                    ...sectionFade.visible,
                    transition: { duration: 0.5, ease: "easeOut", delay },
                },
            }}
        >
            {children}
        </motion.div>
    )
}
