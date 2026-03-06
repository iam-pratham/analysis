"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { PieChart, Pie, RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, PolarAngleAxis } from "recharts"
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">April thru December 2025 - Chiro / PT / OT Insurance Category Mix</h1>
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
                        <CardContent className="pb-6 flex flex-col items-center">
                            <div className="relative w-full aspect-square max-h-[420px] mt-4">
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryStats}
                                                dataKey="total"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="52%"
                                                outerRadius="72%"
                                                paddingAngle={3}
                                                strokeWidth={2}
                                                stroke="var(--background)"
                                                label={({ cx, cy, midAngle, outerRadius, category, total, percent }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = outerRadius + 36;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                    const anchor = x > cx ? "start" : "end";
                                                    return (
                                                        <g>
                                                            <text x={x} y={y - 9} textAnchor={anchor} fill="var(--foreground)" fontSize={11} fontWeight={700}>
                                                                {category}
                                                            </text>
                                                            <text x={x} y={y + 6} textAnchor={anchor} fill="var(--muted-foreground)" fontSize={11} fontWeight={500}>
                                                                {total.toLocaleString()} ({((percent ?? 0) * 100).toFixed(1)}%)
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                                labelLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                                            >
                                                {categoryStats.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={`var(--color-chart-${(index % 5) + 1})`}
                                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                                    />
                                                ))}
                                            </Pie>
                                            <ChartTooltip
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>

                                {/* Center Aggregate Statistics */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground/30">Total Volume</span>
                                    <span className="text-4xl font-black text-foreground">{filteredClaims.length.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest">Insurance Mix</span>
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
