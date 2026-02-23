"use client"

import { DataProvider } from "@/context/data-context"
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [preloading, setPreloading] = useState(true)
    const [fadeOut, setFadeOut] = useState(false)
    const pathname = usePathname()
    const isDashboard = pathname === "/"

    useEffect(() => {
        setMounted(true)
        const t1 = setTimeout(() => {
            setFadeOut(true)
            const t2 = setTimeout(() => setPreloading(false), 300)
            return () => clearTimeout(t2)
        }, 800)
        return () => clearTimeout(t1)
    }, [])

    return (
        <>
            {preloading && (
                <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            )}
            <DataProvider>
                <SidebarProvider>
                    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background text-foreground">
                        <AppSidebar />
                        <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
                            <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <SidebarTrigger />
                                </div>
                                {mounted && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                                    >
                                        {resolvedTheme === "dark" ? (
                                            <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
                                        ) : (
                                            <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
                                        )}
                                        <span className="sr-only">Toggle theme</span>
                                    </Button>
                                )}
                            </header>
                            <div className={`flex-1 bg-muted/20 ${isDashboard ? 'overflow-hidden pb-4' : 'overflow-auto pb-16'}`}>
                                {children}
                            </div>
                        </main>
                    </div>
                </SidebarProvider>
            </DataProvider>
        </>
    )
}
