"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    UploadCloud,
    Users,
    Activity,
    ShieldPlus,
    BrainCircuit,
    FileBarChart,
    LayoutDashboard,
    Zap
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

const items = [
    { title: "Upload Data", url: "/upload", icon: UploadCloud },
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Provider Analysis", url: "/provider", icon: Users },
    { title: "CPT Metrics", url: "/cpt", icon: Activity },
    { title: "Insurance Analysis", url: "/insurance", icon: ShieldPlus },
    { title: "Reports", url: "/insights", icon: BrainCircuit },
    { title: "Raw Data", url: "/reports", icon: FileBarChart },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar className="border-r border-border/40 bg-background/50 backdrop-blur-md">
            <SidebarHeader className="p-7 pb-4">
                <Link href="/" className="flex flex-col group transition-opacity hover:opacity-80">
                    <h2 className="text-base font-bold tracking-tight text-foreground leading-none">
                        SHMB Analytics
                    </h2>
                    <span className="text-[11px] text-muted-foreground/60 mt-1">
                        Precision Billing
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 overflow-y-auto custom-scrollbar">
                <SidebarGroup className="mt-2">
                    <SidebarGroupLabel className="px-4 text-[11px] font-medium tracking-wider text-muted-foreground/40 mb-3 uppercase">
                        Management
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5">
                            {items.slice(0, 2).map((item) => {
                                const isActive = pathname === item.url
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            className={`
                                                relative h-10 px-4 rounded-md transition-all duration-200 group
                                                ${isActive
                                                    ? "bg-foreground/[0.04] text-foreground font-medium"
                                                    : "hover:bg-foreground/[0.03] text-muted-foreground hover:text-foreground"
                                                }
                                            `}
                                        >
                                            <Link href={item.url} className="flex items-center gap-3.5 w-full">
                                                <item.icon className={`w-4.5 h-4.5 transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`} />
                                                <span className="text-[14px] font-medium tracking-tight">{item.title}</span>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="nav-pill"
                                                        className="absolute left-0 w-[2px] h-5 bg-primary rounded-full"
                                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                                    />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-2">
                    <SidebarGroupLabel className="px-4 text-[11px] font-medium tracking-wider text-muted-foreground/40 mb-3 uppercase">
                        Insights
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5">
                            {items.slice(2).map((item) => {
                                const isActive = pathname === item.url
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            className={`
                                                relative h-10 px-4 rounded-md transition-all duration-200 group
                                                ${isActive
                                                    ? "bg-foreground/[0.04] text-foreground font-medium"
                                                    : "hover:bg-foreground/[0.03] text-muted-foreground hover:text-foreground"
                                                }
                                            `}
                                        >
                                            <Link href={item.url} className="flex items-center gap-3.5 w-full">
                                                <item.icon className={`w-4.5 h-4.5 transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`} />
                                                <span className="text-[14px] font-medium tracking-tight">{item.title}</span>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="nav-pill"
                                                        className="absolute left-0 w-[2px] h-5 bg-primary rounded-full"
                                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                                    />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <div className="mt-auto p-7 pt-4">
                <div className="flex items-center gap-2.5 px-2 group cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] group-hover:bg-emerald-500 transition-colors" />
                    <span className="text-[11px] font-medium text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors tracking-wide">Analytic Engine v2.4</span>
                </div>
            </div>
        </Sidebar>
    )
}
