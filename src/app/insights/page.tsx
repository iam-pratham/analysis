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

    const statusMetrics = React.useMemo(() => {
        let deductible = 0;
        let pending = 0;
        let noBenefits = 0;
        let maxLimit = 0;
        let paid = 0;
        let denied = 0;

        filteredClaims.forEach(c => {
            const status = String(c.claimStatus || "").toLowerCase();
            const payStatus = String(c.paymentStatus || "").toLowerCase();
            const fullText = (status + " " + payStatus).toLowerCase();

            // 1. Highest Priority: Denied
            if (fullText.includes('denied') || fullText.includes('deni')) {
                denied++;
            }
            // 2. Paid (User: "whatever says paid is paid")
            else if (fullText.includes('paid')) {
                paid++;
            }
            // 3. Max Limit / Not Covered
            else if (fullText.includes('maximum limit') || fullText.includes('reached maximum limit') || fullText.includes('max limit') || fullText.includes('not covered under patient plan') || fullText.includes('not covered')) {
                maxLimit++;
            }
            // 4. Deductible / Self Pay
            else if (fullText.includes('towards deductible') || fullText.includes('towards ded') || fullText.includes('deductible') || fullText.includes('self pay') || fullText.includes('self-pay') || fullText.includes('selfpay') || fullText.includes('patient responsibility') || fullText.includes('patient resp')) {
                deductible++;
            }
            // 5. No Benefits / LOP / ARB
            else if (fullText.includes('no oon') || fullText.includes('out of network') || fullText.includes('benefits exhausted') || fullText.includes('benefits') || fullText.includes('secondary insurance') || fullText.includes('secondary') || fullText.includes('exhausted') || fullText.includes('lop') || fullText.includes('arb') || fullText.includes('arbitration') || fullText.includes('under arbitration')) {
                noBenefits++;
            }
            // 6. Pending
            else if (fullText.includes('pending') || fullText.includes('in process') || fullText.includes('in-process')) {
                pending++;
            }
        });

        return [
            { name: "Deductible / Self Pay", value: deductible, fill: "var(--color-chart-1)" },
            { name: "Pending", value: pending, fill: "var(--color-chart-2)" },
            { name: "No OON / LOP / ARB", value: noBenefits, fill: "var(--color-chart-3)" },
            { name: "Max Limit / Not Covered", value: maxLimit, fill: "var(--color-chart-4)" },
            { name: "Paid Claims", value: paid, fill: "var(--color-chart-5)" },
            { name: "Denied", value: denied, fill: "var(--color-destructive)" }
        ]
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
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                    Reports
                </h1>
            </div>

            <GlobalFilters />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-3 lg:grid-cols-6"
            >
                {statusMetrics.map((sm, i) => (
                    <motion.div variants={itemVariants} key={i}>
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground">{sm.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {sm.value}
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
                            <BarChart accessibilityLayer data={statusMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                                    {statusMetrics.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`rgba(255, 255, 255, ${0.9 - (index * 0.12)})`}
                                        />
                                    ))}
                                    <LabelList dataKey="value" position="top" offset={10} className="fill-foreground/80 font-bold" fontSize={11} />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
