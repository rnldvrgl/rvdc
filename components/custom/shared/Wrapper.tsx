export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="container max-w-7xl mx-auto p-2 md:p-4 xl:p-6 space-y-8">
      {children}
    </div>
  )
}
