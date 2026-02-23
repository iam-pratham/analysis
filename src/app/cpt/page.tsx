"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

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

export default function CptAnalysisPage() {
    const { filteredClaims, claims } = useData()

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

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
            denialRate: ((map[k].denied / map[k].total) * 100).toFixed(1)
        })).sort((a, b) => b.total - a.total)
    }, [filteredClaims])

    const topCpts = cptStats.slice(0, 15)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">CPT Analysis</h1>
            <GlobalFilters />

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Top 15 CPT Codes - Volume vs Denials</CardTitle>
                    <CardDescription>Visualizing highest volume codes against their denial count</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
                        <BarChart accessibilityLayer data={topCpts} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="cpt"
                                angle={-45}
                                textAnchor="end"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                height={60}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="denied" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>High-Risk CPT Glossary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
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
                                    <TableRow key={row.cpt}>
                                        <TableCell className="font-medium">{row.cpt}</TableCell>
                                        <TableCell>{row.total}</TableCell>
                                        <TableCell>{row.denied}</TableCell>
                                        <TableCell className={Number(row.denialRate) > 20 ? "text-destructive font-bold" : ""}>
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
        </div>
    )
}
