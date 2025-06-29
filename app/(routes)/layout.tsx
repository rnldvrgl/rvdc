import { Sidebar } from '@/components/custom/navigation/Sidebar'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative">
      <div className="min-h-screen p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7 flex flex-col lg:flex-row">
        <Sidebar />
        <section className="grid place-items-center w-full">{children}</section>
      </div>
    </div>
  )
}
