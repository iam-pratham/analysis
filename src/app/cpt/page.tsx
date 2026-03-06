"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { motion } from "framer-motion"

const chartConfig = {
    total: {
        label: "Total Volume",
        color: "var(--color-primary)",
    },
    denied: {
        label: "Denied Count",
        color: "var(--color-destructive)",
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

export default function CptAnalysisPage() {
    const { filteredClaims, claims } = useData()

    const cptStats = useMemo(() => {
        const map: Record<string, { total: number, arb: number, denied: number }> = {}
        filteredClaims.forEach(c => {
            const codes = String(c.cptCode || "").split(',').map(s => s.trim()).filter(Boolean)
            codes.forEach(cpt => {
                if (!map[cpt]) map[cpt] = { total: 0, arb: 0, denied: 0 }
                map[cpt].total += 1
                if (c.arbFlag) map[cpt].arb += 1
                if (c.denialIndicator) map[cpt].denied += 1
            })
        })
        return Object.keys(map).map(k => ({
            cpt: k,
            total: map[k].total,
            arb: map[k].arb,
            denied: map[k].denied,
            denialRate: ((map[k].denied / map[k].total) * 100).toFixed(1),
            totalLabel: `${map[k].total.toLocaleString()}`,
            deniedLabel: `${map[k].denied.toLocaleString()}`
        })).sort((a, b) => b.total - a.total)
    }, [filteredClaims])

    const totalCptUsages = useMemo(() => cptStats.reduce((acc, curr) => acc + curr.total, 0), [cptStats])

    const chartsData = useMemo(() => cptStats.slice(0, 15).map(s => ({
        ...s,
        totalPercentLabel: `${s.total} (${((s.total / totalCptUsages) * 100 || 0).toFixed(1)}%)`,
        deniedPercentLabel: `${s.denied} (${s.denialRate}%)`
    })), [cptStats, totalCptUsages])

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    const topCpts = cptStats.slice(0, 15)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">2025 - Chiro / PT / OT - CPT Analysis</h1>
            <GlobalFilters />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                <motion.div variants={itemVariants}>
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Top 15 CPT Codes - Volume vs Denials</CardTitle>
                            <CardDescription>Visualizing highest volume codes against their denial count</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
                                <BarChart accessibilityLayer data={chartsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis
                                        dataKey="cpt"
                                        angle={-45}
                                        textAnchor="end"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        height={60}
                                        style={{ fill: "var(--color-muted-foreground)" }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        style={{ fill: "var(--color-muted-foreground)" }}
                                    />
                                    <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent indicator="dashed" />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {chartsData.map((entry, index) => (
                                            <Cell
                                                key={`cell-total-${index}`}
                                                fill={`var(--color-chart-${(index % 5) + 1})`}
                                            />
                                        ))}
                                        <LabelList dataKey="total" position="top" offset={10} className="fill-foreground/80 font-bold" fontSize={11} />
                                    </Bar>
                                    <Bar dataKey="denied" radius={[4, 4, 0, 0]}>
                                        {chartsData.map((entry, index) => (
                                            <Cell
                                                key={`cell-denied-${index}`}
                                                fill="var(--color-destructive)"
                                            />
                                        ))}
                                        <LabelList dataKey="denied" position="top" offset={10} className="fill-foreground/60 font-bold" fontSize={11} />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>High-Risk CPT Glossary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-white/5 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>CPT Code</TableHead>
                                            <TableHead>Total Volume</TableHead>
                                            <TableHead>Denied Count</TableHead>
                                            <TableHead>Denial Rate (%)</TableHead>
                                            <TableHead>ARB Flags</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cptStats.slice(0, 20).map((row) => (
                                            <TableRow key={row.cpt} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium text-primary">{row.cpt}</TableCell>
                                                <TableCell>{row.total}</TableCell>
                                                <TableCell>{row.denied}</TableCell>
                                                <TableCell className={Number(row.denialRate) > 20 ? "text-destructive font-bold bg-destructive/10 px-2 py-1 rounded" : ""}>
                                                    {row.denialRate}%
                                                </TableCell>
                                                <TableCell>{row.arb}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
