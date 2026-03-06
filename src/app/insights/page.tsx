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
            { name: "Deductible / Self Pay", value: deductibleSelfPay, fill: "var(--color-chart-1)" },
            { name: "In Process", value: inProcess, fill: "var(--color-chart-2)" },
            { name: "ARB / LOP / No OON / Benefit Exhausted", value: arbLopNoOon, fill: "var(--color-chart-4)" },
            { name: "Max Limit / Not Covered", value: maxLimit, fill: "var(--color-chart-6)" },
            { name: "Paid Claims", value: paid, fill: "var(--color-chart-5)" },
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
                        <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
                            <BarChart
                                accessibilityLayer
                                data={chartData}
                                margin={{ top: 30, right: 20, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    height={50}
                                    tick={(props: any) => {
                                        const { x, y, payload } = props;
                                        const parts = (payload.value as string).split(" / ");
                                        const mid = Math.ceil(parts.length / 2);
                                        const line1 = parts.slice(0, mid).join(" / ");
                                        const line2 = parts.slice(mid).join(" / ");
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize={11} fontWeight={500}>{line1}</text>
                                                {line2 && <text x={0} y={0} dy={30} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize={11} fontWeight={500}>{line2}</text>}
                                            </g>
                                        );
                                    }}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} style={{ fill: "var(--color-muted-foreground)", fontSize: "12px" }} />
                                <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                    {chartData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        content={(props: any) => {
                                            const { x, y, width, value } = props;
                                            if (value == null) return null;
                                            const pct = ((value / filteredClaims.length) * 100 || 0).toFixed(1);
                                            // Place the text centered above the bar
                                            const cx = (x as number) + (width as number) / 2;
                                            const cy = (y as number) - 10;
                                            return (
                                                <g>
                                                    <text x={cx} y={cy - 12} textAnchor="middle" fontSize={13}>
                                                        <tspan fill="#dc2626" fontWeight={700}>{(value as number).toLocaleString()}</tspan>
                                                    </text>
                                                    <text x={cx} y={cy + 2} textAnchor="middle" fontSize={11}>
                                                        <tspan fill="var(--color-muted-foreground)" fontWeight={500}>{`(${pct}%)`}</tspan>
                                                    </text>
                                                </g>
                                            );
                                        }}
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
