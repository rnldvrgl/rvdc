"use client"

import { useMounted } from "@/lib/hooks/useMounted"

export function Background() {
  const mounted = useMounted()
  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* Base gradients */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-50/80 via-violet-50/70 to-fuchsia-50/60 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900" />
      <div className="absolute inset-0 bg-linear-to-tr from-white via-purple-50/50 to-violet-50/60 dark:from-purple-950/40 dark:via-slate-800 dark:to-indigo-950/40" />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-linear-to-r from-purple-300/30 to-violet-300/30 dark:from-purple-600/15 dark:to-violet-600/15" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl animate-pulse bg-linear-to-r from-violet-300/25 to-fuchsia-300/25 dark:from-violet-600/20 dark:to-fuchsia-600/20" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse bg-linear-to-r from-fuchsia-300/25 to-purple-300/25 dark:from-fuchsia-600/15 dark:to-purple-600/15"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse bg-linear-to-r from-indigo-300/30 to-violet-300/30 dark:from-indigo-600/15 dark:to-violet-600/15"
        style={{ animationDelay: "2.5s" }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-25 dark:opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(147,51,234,0.35) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* SVG grid */}
      <div className="absolute inset-0">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="technical-grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-purple-400/40 dark:text-purple-800/40"
              />
              <circle
                cx="40"
                cy="40"
                r="1"
                fill="currentColor"
                className="text-violet-400/60 dark:text-violet-700/40"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#technical-grid)"
          />
        </svg>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        <div
          className="absolute top-20 left-16 w-3 h-3 rounded-full bg-purple-400/50 dark:bg-purple-600/30 animate-bounce shadow-lg shadow-purple-400/30"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute top-40 right-24 w-2 h-2 rounded-full bg-violet-400/60 dark:bg-violet-600/40 animate-bounce shadow-lg shadow-violet-400/30"
          style={{
            animationDelay: "1.5s",
            animationDuration: "3.5s",
          }}
        />
        <div
          className="absolute bottom-32 left-1/3 w-2.5 h-2.5 rounded-full bg-fuchsia-400/55 dark:bg-fuchsia-600/30 animate-bounce shadow-lg shadow-fuchsia-400/30"
          style={{
            animationDelay: "2.5s",
            animationDuration: "4.5s",
          }}
        />
        <div
          className="absolute top-60 right-1/4 w-2 h-2 rounded-full bg-indigo-400/50 dark:bg-indigo-600/25 animate-bounce shadow-lg shadow-indigo-400/25"
          style={{
            animationDelay: "0.8s",
            animationDuration: "3.8s",
          }}
        />
      </div>

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-15 dark:opacity-10 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute inset-0 bg-linear-to-t from-white/10 via-white/30 to-white/50 dark:via-black/10 dark:to-black/20" />
    </div>
  )
}
