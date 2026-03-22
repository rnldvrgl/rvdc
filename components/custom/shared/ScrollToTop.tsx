"use client"

import { cn } from "@/lib/utils/helpers"
import { ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-22 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-primary/90 dark:bg-primary/20 text-white hover:bg-primary dark:hover:bg-primary/40 shadow-lg transition-all duration-300 cursor-pointer",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-[18px]" />
    </button>
  )
}
