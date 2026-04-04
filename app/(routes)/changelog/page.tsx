"use client"

import { ChangelogDialog } from "@/components/custom/changelog/ChangelogBanner"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_META, ChangelogEntry } from "@/lib/constants/changelog"
import { useChangelog } from "@/lib/hooks/useChangelog"
import { cn } from "@/lib/utils/helpers"
import { BookOpen, CheckCheck, Sparkles } from "lucide-react"
import { useState } from "react"

function CategoryPill({ category }: { category: keyof typeof CATEGORY_META }) {
  const meta = CATEGORY_META[category]
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight",
        meta.bg,
        meta.color,
      )}
    >
      {meta.label}
    </span>
  )
}

function EntrySection({
  entry,
  isNew,
}: {
  entry: ChangelogEntry
  isNew: boolean
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        isNew && "border-primary/30 shadow-sm",
      )}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <span className="font-mono text-xs font-bold text-muted-foreground">
            v{entry.version}
          </span>
          {isNew && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/20 font-semibold">
              NEW
            </Badge>
          )}
          <h2 className="text-base font-semibold">{entry.title}</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(entry.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <Separator />
      </div>

      <CardContent className="px-5 pb-5">
        <ul className="space-y-3">
          {entry.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm"
            >
              <CategoryPill category={item.category} />
              <span className="text-muted-foreground leading-snug">
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function ChangelogPage() {
  const { entries, unseenEntries, unseenCount, markAllRead, mounted } =
    useChangelog()
  const [dialogOpen, setDialogOpen] = useState(false)
  const unseenVersions = new Set(unseenEntries.map((e) => e.version))

  return (
    <Wrapper>
      <PageHeader
        icon={BookOpen}
        title="Changelog"
        description="Stay up to date with new features, bug fixes, and improvements relevant to your role."
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
              Mark all as read ({unseenCount})
            </Button>
          ) : undefined
        }
      />

      {mounted && unseenCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span>
            You have{" "}
            <strong>
              {unseenCount} new update{unseenCount > 1 ? "s" : ""}
            </strong>{" "}
            since your last visit.
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            Quick view
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No changelog entries for your role yet.
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <EntrySection
              key={entry.version}
              entry={entry}
              isNew={unseenVersions.has(entry.version)}
            />
          ))
        )}
      </div>

      <ChangelogDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
        }}
      />
    </Wrapper>
  )
}
