"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Button } from "@/components/ui/button"
import {
    CATEGORY_META,
    ChangelogCategory,
    ChangelogEntry,
} from "@/lib/constants/changelog"
import { useChangelog } from "@/lib/hooks/useChangelog"
import { cn } from "@/lib/utils/helpers"
import { motion } from "framer-motion"
import {
    BookOpen,
    CheckCheck,
    Sparkles,
} from "lucide-react"

const CATEGORY_ORDER: ChangelogCategory[] = [
    "feature",
    "improvement",
    "fix",
    "security",
    "removed",
]

function CategoryPill({ category }: { category: ChangelogCategory }) {
    const meta = CATEGORY_META[category]
    return (
        <span
            className={cn(
                "shrink-0 rounded px-1.5 py-px text-[10px] font-semibold leading-tight",
                meta.bg,
                meta.color,
            )}
        >
            {meta.label}
        </span>
    )
}

function VersionEntry({
    entry,
    isNew,
    isLast,
    index,
}: {
    entry: ChangelogEntry
    isNew: boolean
    isLast: boolean
    index: number
}) {
    // Group items by category in defined order
    const grouped = CATEGORY_ORDER.reduce(
        (acc, cat) => {
            const items = entry.items.filter((i) => i.category === cat)
            if (items.length) acc[cat] = items
            return acc
        },
        {} as Partial<Record<ChangelogCategory, typeof entry.items>>,
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
            className="flex gap-0"
        >
            {/* Left column: date + rail */}
            <div className="flex flex-col items-center w-28 shrink-0 pt-0.5">
                <p className="text-[11px] text-muted-foreground text-right pr-4 leading-tight w-full">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })}
                </p>
                <p className="text-[10px] text-muted-foreground/60 text-right pr-4 w-full">
                    {new Date(entry.date).getFullYear()}
                </p>
            </div>

            {/* Rail dot + line */}
            <div className="flex flex-col items-center mx-3">
                <div
                    className={cn(
                        "size-3 rounded-full ring-4 shrink-0 mt-0.5",
                        isNew
                            ? "bg-primary ring-primary/20"
                            : "bg-border ring-background",
                    )}
                />
                {!isLast && (
                    <div className="w-px flex-1 bg-border mt-1" />
                )}
            </div>

            {/* Right: card content */}
            <div className={cn("flex-1 pb-8", isLast && "pb-2")}>
                {/* Version header */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        v{entry.version}
                    </span>
                    {isNew && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                            <Sparkles className="size-2.5" />
                            NEW
                        </span>
                    )}
                    <h2 className="text-sm font-semibold">{entry.title}</h2>
                </div>

                {/* Grouped items */}
                <div className="space-y-3">
                    {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <CategoryPill category={cat as ChangelogCategory} />
                            </div>
                            <ul className="space-y-1.5 pl-2 border-l-2 border-border ml-1">
                                {items!.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="text-[13px] text-muted-foreground leading-snug pl-2"
                                    >
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default function ChangelogPage() {
    const { entries, unseenEntries, unseenCount, markAllRead, mounted } =
        useChangelog()
    const unseenVersions = new Set(unseenEntries.map((e) => e.version))

    return (
        <Wrapper>
            <PageHeader
                icon={BookOpen}
                title="Changelog"
                description="New features, improvements, and fixes — filtered to what's relevant for your role."
                breadcrumbs={["Changelog"]}
                actionButton={
                    mounted && unseenCount > 0 ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={markAllRead}
                        >
                            <CheckCheck className="size-4" />
                            Mark all read ({unseenCount})
                        </Button>
                    ) : undefined
                }
            />

            {mounted && unseenCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 pl-4 pr-4 py-3"
                >
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary/60" />
                    <Sparkles className="size-4 text-primary shrink-0" />
                    <p className="text-sm flex-1">
                        You have{" "}
                        <span className="font-semibold">
                            {unseenCount} new update{unseenCount > 1 ? "s" : ""}
                        </span>{" "}
                        since your last visit.
                    </p>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={markAllRead}
                    >
                        Dismiss
                    </Button>
                </motion.div>
            )}

            {/* Timeline */}
            <div className="pt-2">
                {entries.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground text-sm">
                        No changelog entries for your role yet.
                    </div>
                ) : (
                    entries.map((entry, idx) => (
                        <VersionEntry
                            key={entry.version}
                            entry={entry}
                            isNew={unseenVersions.has(entry.version)}
                            isLast={idx === entries.length - 1}
                            index={idx}
                        />
                    ))
                )}
            </div>
        </Wrapper>
    )
}
