"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, PolarAngleAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { motion } from "framer-motion"

// Removed Treemap Implementation as it was visually cluttered
const chartConfig = {
    total: {
        label: "Claims",
        color: "var(--color-primary)",
    },
} satisfies ChartConfig

// removed static pieConfig
const barConfig = {
    total: {
        label: "Total Claims",
        color: "var(--color-primary)",
    },
} satisfies ChartConfig

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

export default function InsuranceAnalysisPage() {
    const { filteredClaims, claims } = useData()

    const categoryStats = useMemo(() => {
        const map: Record<string, number> = {}
        filteredClaims.forEach(c => {
            const cat = String(c.insuranceType)
            map[cat] = (map[cat] || 0) + 1
        })
        return Object.keys(map).map(k => ({
            category: k,
            total: map[k]
        })).sort((a, b) => b.total - a.total)
    }, [filteredClaims])

    const companyStats = useMemo(() => {
        const map: Record<string, number> = {}
        filteredClaims.forEach(c => {
            const comp = String(c.insuranceCompany || c.insuranceType)
            map[comp] = (map[comp] || 0) + 1
        })
        return Object.keys(map).map(k => ({
            company: k,
            total: map[k]
        })).sort((a, b) => b.total - a.total)
    }, [filteredClaims])

    const treemapData = categoryStats.map((s, idx) => ({
        name: s.category,
        size: s.total,
        value: s.total,
        total: filteredClaims.length,
        fill: `var(--color-chart-${(idx % 5) + 1})`
    }))

    const dynamicConfig = {
        value: { label: "Claims" }
    } satisfies ChartConfig

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">April thru December 2025 - Chiro / PT / OT Insurance Mix Analysis</h1>
            <GlobalFilters />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2"
            >
                <motion.div variants={itemVariants}>
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Insurance Category Mix</CardTitle>
                            <CardDescription>Distribution by insurance category</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="space-y-6 mt-4">
                                {categoryStats.map((s, idx) => {
                                    const percentage = (s.total / filteredClaims.length) * 100;
                                    const colorClass = `bg-[var(--color-chart-${(idx % 5) + 1})]`;

                                    return (
                                        <div key={s.category} className="group">
                                            <div className="flex items-end justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                                                        {s.category}
                                                    </span>
                                                    <span className="text-2xl font-black tracking-tight mt-0.5">
                                                        {s.total.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-primary">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                    <span className="block text-[9px] font-medium text-muted-foreground/30 uppercase tracking-wider">
                                                        of volume
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative h-1.5 w-full bg-foreground/[0.03] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                                    className={`absolute left-0 top-0 h-full rounded-full ${colorClass} opacity-80`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Section Footer / Insight */}
                            <div className="mt-8 pt-6 border-t border-border/10">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
                                        Primary Revenue Driver
                                    </span>
                                    <span className="text-[11px] font-bold text-foreground">
                                        {categoryStats[0]?.category}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Claims by Insurance Company</CardTitle>
                            <CardDescription>Total volume of claims per payer</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <ChartContainer config={barConfig} className="h-[350px] w-full">
                                <BarChart accessibilityLayer data={companyStats.slice(0, 10)} layout="vertical" margin={{ top: 20, right: 120, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.2} />
                                    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} style={{ fill: "var(--color-muted-foreground)" }} />
                                    <YAxis
                                        type="category"
                                        dataKey="company"
                                        width={100}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => {
                                            const u = val.toUpperCase();
                                            if (u.includes("PROGRESSIVE")) return "Progressive";
                                            if (u.includes("NJ MANUFACTUR")) return "NJM";
                                            if (u.includes("STATE FARM")) return "State Farm";
                                            if (u.includes("HORIZON BCBS")) return "Horizon OOS";
                                            if (u.includes("PLYMOUTH ROCK")) return "Plymouth Rock";
                                            if (u.includes("GEICO")) return "Geico NJ";
                                            const formatted = val.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
                                            return formatted.length > 14 ? formatted.substring(0, 14) + "..." : formatted;
                                        }}
                                        style={{ fontSize: "11px", fill: "var(--color-muted-foreground)" }}
                                    />
                                    <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent />} />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={40}>
                                        {companyStats.slice(0, 10).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`var(--color-chart-${(index % 5) + 1})`}
                                            />
                                        ))}
                                        <LabelList
                                            dataKey="total"
                                            position="right"
                                            offset={10}
                                            className="fill-foreground/80 font-bold"
                                            fontSize={11}
                                            formatter={(val: number) => `${val.toLocaleString()} (${((val / filteredClaims.length) * 100 || 0).toFixed(1)}%)`}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
