'use client'
import { Sidebar } from '@/components/custom/navigation/Sidebar'
import { Background } from '@/components/custom/shared/Background'
import React from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Background />

      <div className="fixed top-0 left-0 lg:h-full z-40  over-flow-y-auto w-full lg:w-auto bg-background xl:bg-background/60">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 sm:p-6  lg:pl-[315px] mt-16 lg:mt-0">
        {children}
      </main>
    </div>
  )
}
