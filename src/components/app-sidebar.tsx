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
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, UploadCloud, Users, Stethoscope, Activity, ShieldPlus, BrainCircuit, FileBarChart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
    { title: "Upload", url: "/upload", icon: UploadCloud },
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Provider View", url: "/provider", icon: Users },
    { title: "CPT Analysis", url: "/cpt", icon: Activity },
    { title: "Insurance Analysis", url: "/insurance", icon: ShieldPlus },
    { title: "AI Insights", url: "/insights", icon: BrainCircuit },
    { title: "Reports", url: "/reports", icon: FileBarChart },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <h2 className="text-xl font-bold text-foreground">
                    SHMB Analysis Tool
                </h2>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
