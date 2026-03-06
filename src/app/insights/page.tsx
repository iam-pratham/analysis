"use client"

import React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"

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

export default function ReportsPage() {
    const { filteredClaims, claims } = useData()

    const { metrics, chartData } = React.useMemo(() => {
        let deductible = 0;
        let pendingCount = 0;
        let arbLop = 0;
        let noOon = 0;
        let maxLimit = 0;
        let paidCount = 0;

        // Independent counters to match Dashboard and Provider exactly
        let cardPaid = 0;
        let cardArbLop = 0;
        let cardNoOon = 0;
        let cardDenied = 0;

        filteredClaims.forEach(c => {
            const statusStr = String(c.claimStatus || "").toLowerCase().trim();
            const payStatusStr = String(c.paymentStatus || "").toLowerCase().trim();
            const fullTextStr = (statusStr + " " + payStatusStr).toLowerCase();
            const isPaidCase = fullTextStr.includes("paid");
            const isNoOonCase = statusStr.includes("no oon") || statusStr.includes("benefit exhausted");
            const isArbLopCase = !isNoOonCase && (c.arbFlag || String(c.insuranceType).toUpperCase() === "LOP" || statusStr.includes("arbitration") || statusStr.includes("lop"));
            const isDeniedCase = c.denialIndicator || statusStr.includes("denied") || statusStr.includes("deni") || fullTextStr.includes("denied") || fullTextStr.includes("deni");

            // Independent Card Counts
            if (isPaidCase) cardPaid++;
            if (isArbLopCase) cardArbLop++;
            if (isNoOonCase) cardNoOon++;
            if (isDeniedCase) cardDenied++;

            // Mutual Exclusion for Chart Distribution
            if (isPaidCase) {
                paidCount++;
            }
            else if (isNoOonCase) {
                noOon++;
            }
            else if (isArbLopCase) {
                arbLop++;
            }
            else if (statusStr.includes("towards dedcutible") || statusStr.includes("towards deductible") || statusStr.includes("self pay") || fullTextStr.includes("deductible")) {
                deductible++;
            }
            else if (statusStr.includes("in process") || fullTextStr.includes("pending")) {
                pendingCount++;
            }
            else if (
                statusStr.includes("reached maximum limit") ||
                statusStr.includes("not covered under patient's plan") ||
                statusStr.includes("not covered under patient plan") ||
                fullTextStr.includes("maximum limit") ||
                fullTextStr.includes("not covered")
            ) {
                maxLimit++;
            }
        });

        const allMetrics = [
            { name: "Deductible / Self Pay", value: deductible, fill: "var(--color-chart-1)" },
            { name: "Pending", value: pendingCount, fill: "var(--color-chart-2)" },
            { name: "ARB / LOP Volume", value: cardArbLop, fill: "var(--color-chart-3)", isKpi: true },
            { name: "NO OON Volume", value: cardNoOon, fill: "var(--color-chart-4)", isKpi: true },
            { name: "Max Limit / Not Covered", value: maxLimit, fill: "var(--color-chart-5)" },
            { name: "Paid Claims", value: cardPaid, fill: "var(--color-chart-6)", isKpi: true },
            { name: "Denied", value: cardDenied, fill: "var(--color-destructive)", isKpi: true }
        ];

        const chartItems = [
            { name: "Deductible", value: deductible, fill: "var(--color-chart-1)" },
            { name: "Pending", value: pendingCount, fill: "var(--color-chart-2)" },
            { name: "ARB / LOP", value: arbLop, fill: "var(--color-chart-3)" },
            { name: "No OON", value: noOon, fill: "var(--color-chart-4)" },
            { name: "Max Limit", value: maxLimit, fill: "var(--color-chart-5)" },
            { name: "Paid", value: paidCount, fill: "var(--color-chart-6)" }
        ];

        return { metrics: allMetrics, chartData: chartItems };
    }, [filteredClaims])

    const chartConfig = {
        value: { label: "Claims", color: "var(--color-primary)" }
    } satisfies ChartConfig;

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    April thru December 2025 - Chiro / PT / OT Reports
                </h1>
            </div>

            <GlobalFilters />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-3 lg:grid-cols-7"
            >
                {metrics.map((sm: any, i: number) => (
                    <motion.div variants={itemVariants} key={i}>
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">{sm.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {sm.value}
                                </div>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                    {((sm.value / filteredClaims.length) * 100 || 0).toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="show">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Status Category Distribution</CardTitle>
                        <CardDescription>Breakdown of claims into key analytic status buckets</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChart accessibilityLayer data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    style={{ fill: "var(--color-muted-foreground)", fontSize: "11px" }}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} style={{ fill: "var(--color-muted-foreground)" }} />
                                <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {chartData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="value"
                                        position="top"
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
        </div>
    )
}
