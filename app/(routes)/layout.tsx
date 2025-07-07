import { Sidebar } from '@/components/custom/navigation/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile sidebar could be a drawer; omit here for brevity */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
