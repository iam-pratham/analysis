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
        // Card 1: Deductible / Self Pay
        // Status contains: "Towards Dedcutible" OR "Self Pay"
        let deductibleSelfPay = 0;

        // Card 2: In Process
        // Status contains: "In Process" OR "Pending"
        let inProcess = 0;

        // Card 3: ARB / LOP / No OON / Benefits Exhausted
        // Status contains: "Under Arbitration" OR "LOP" OR "Benefit Exhausted/Secondary insurance/LOP"
        //                  OR "Denied-No OON with secondary/LOP/Pt's responsibility"
        let arbLopNoOon = 0;

        // Card 4: Max Limit / Not Covered
        // Status contains: "Not Covered under patient's Plan" OR "Reached Maximum Limit" OR "EFFORTS EXHAUSTED"
        let maxLimit = 0;

        // Card 5: Paid Claims
        // Status contains: "Paid Correctly" OR "Paid with 50% pre-cert Penalty" OR "Paid with patient's responsibllity"
        let paid = 0;

        filteredClaims.forEach(c => {
            const s = String(c.claimStatus || "").toLowerCase().trim();

            // Card 5 — Paid is checked FIRST so explicit paid status always wins over any flags
            if (
                s.includes("paid correctly") ||
                s.includes("paid with 50%") ||
                s.includes("paid with patient")
            ) {
                paid++;
            }
            // Card 1 — Deductible / Self Pay
            else if (s.includes("towards dedcutible") || s.includes("towards deductible") || s.includes("self pay")) {
                deductibleSelfPay++;
            }
            // Card 2 — In Process
            else if (s.includes("in process") || s.includes("pending")) {
                inProcess++;
            }
            // Card 3 — ARB / LOP / No OON / Benefits Exhausted
            else if (
                s.includes("under arbitration") ||
                s.includes("benefit exhausted") ||
                s.includes("denied-no oon") ||
                s.includes("denied - no oon") ||
                s.includes("no oon") ||
                s === "lop" ||
                s.includes("/lop") ||
                String(c.insuranceType || "").toUpperCase() === "LOP" ||
                c.arbFlag
            ) {
                arbLopNoOon++;
            }
            // Card 4 — Max Limit / Not Covered
            else if (
                s.includes("not covered under patient") ||
                s.includes("reached maximum limit") ||
                s.includes("efforts exhausted")
            ) {
                maxLimit++;
            }
        });

        const allMetrics = [
            { name: "Deductible / Self Pay", value: deductibleSelfPay, fill: "#6366f1" },
            { name: "In Process", value: inProcess, fill: "#f59e0b" },
            { name: "ARB / LOP / No OON / Benefit Exhausted", value: arbLopNoOon, fill: "#f97316" },
            { name: "Max Limit / Not Covered", value: maxLimit, fill: "#ef4444" },
            { name: "Paid Claims", value: paid, fill: "#22c55e" },
        ];

        return { metrics: allMetrics, chartData: allMetrics };
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
                className="grid gap-4 md:grid-cols-3 lg:grid-cols-5"
            >
                {metrics.map((sm: any, i: number) => (
                    <motion.div variants={itemVariants} key={i}>
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground leading-snug">{sm.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold" style={{ color: sm.fill }}>
                                    {sm.value.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                    {((sm.value / filteredClaims.length) * 100 || 0).toFixed(1)}% of total
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="show">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Claim Status</CardTitle>
                        <CardDescription>Breakdown of claims into key analytic status buckets</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
                            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ top: 5, right: 140, left: 10, bottom: 5 }}>
                                <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} style={{ fill: "var(--color-muted-foreground)", fontSize: "12px" }} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={240}
                                    tickLine={false}
                                    axisLine={false}
                                    style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }}
                                />
                                <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={48}>
                                    {chartData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="value"
                                        position="right"
                                        offset={12}
                                        className="fill-foreground/80 font-bold"
                                        fontSize={12}
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
