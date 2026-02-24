"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, LabelList, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { motion } from "framer-motion"

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

    const pieData = categoryStats.slice(0, 5).map((s, idx) => {
        const pieColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
        return {
            name: s.category,
            value: s.total,
            fill: pieColors[idx % 5]
        }
    })

    const dynamicPieConfig = useMemo(() => {
        const config: ChartConfig = {
            value: { label: "Volume" }
        }
        pieData.forEach((d) => {
            config[d.name] = {
                label: d.name,
                color: d.fill
            }
        })
        return config
    }, [pieData])

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">Insurance Mix Analysis</h1>
            <GlobalFilters />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2"
            >
                <motion.div variants={itemVariants} className="h-full">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <CardTitle>Insurance Category Mix</CardTitle>
                            <CardDescription>Distribution by insurance category</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4 flex flex-col items-center justify-center">
                            <ChartContainer config={dynamicPieConfig} className="mx-auto w-full max-w-[400px] h-[350px]">
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={120}
                                        paddingAngle={4}
                                        dataKey="value"
                                        nameKey="name"
                                        labelLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                                        label={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: "medium" }}
                                        stroke="none"
                                    >
                                    </Pie>
                                    <ChartLegend className="flex-wrap gap-4 pb-4" content={<ChartLegendContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="h-full">
                    <Card className="flex flex-col h-full">
                        <CardHeader>
                            <CardTitle>Claims by Insurance Company</CardTitle>
                            <CardDescription>Total volume of claims per payer</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <ChartContainer config={barConfig} className="min-h-[400px] w-full">
                                <BarChart accessibilityLayer data={companyStats.slice(0, 10)} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
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
                                                fill={`rgba(255, 255, 255, ${0.9 - (index * 0.08)})`}
                                            />
                                        ))}
                                        <LabelList dataKey="total" position="right" offset={10} className="fill-foreground/80 font-bold" fontSize={11} />
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
