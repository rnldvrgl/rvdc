"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ReactNode, useState } from "react"

interface QueryClientContextProps {
  children: ReactNode
}

export function QueryClientContextProvider({
  children,
}: QueryClientContextProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            staleTime: 5 * 60 * 1000, // 5 minutes — avoid refetching fresh data
            gcTime: 10 * 60 * 1000, // 10 minutes — keep unused cache longer
            refetchOnWindowFocus: false, // only refetch explicitly or when stale
          },
          mutations: {
            retry: 0, // Never auto-retry mutations — prevents duplicate side effects
            // Suppress error logging in console for mutations
            onError: () => {
              // Errors are already handled by useApiMutation's handleError
              // No need to log them again in console
            },
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
