"use client"

import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { RealtimeProvider } from "./realtime-provider"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RealtimeProvider showToasts={true}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
