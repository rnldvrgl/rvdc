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
    <div className="flex flex-col lg:flex-row min-h-screen ">
      <Background />

      <Sidebar />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
