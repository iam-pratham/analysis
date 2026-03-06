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
            const status = String(c.claimStatus || "").toLowerCase().trim();
            const payStatus = String(c.paymentStatus || "").toLowerCase().trim();
            const fullText = (status + " " + payStatus).toLowerCase();

            // Category classification (Mutually exclusive for main buckets)
            // 1. No OON / LOP / ARB
            if (
                status.includes("benefit exhausted/secondary insurance/lop") ||
                status.includes("denied-no oon with secondary/lop/pt's responsibility") ||
                status.includes("under arbitration") ||
                status === "lop"
            ) {
                noBenefits++;
            }
            // 2. Deductible / Self Pay
            else if (
                status.includes("towards dedcutible") ||
                status.includes("towards deductible") ||
                status.includes("self pay")
            ) {
                deductible++;
            }
            // 3. Pending
            else if (status.includes("in process")) {
                pending++;
            }
            // 4. Paid
            else if (
                status.includes("paid correctly") ||
                status.includes("paid with 50% pre-cert penalty") ||
                status.includes("paid with patient's responsibllity") ||
                status.includes("paid with patient's responsibility")
            ) {
                paid++;
            }
            // 5. Max Limit / Not Covered
            else if (
                status.includes("reached maximum limit") ||
                status.includes("not covered under patient's plan") ||
                status.includes("not covered under patient plan")
            ) {
                maxLimit++;
            }
            // Fallbacks for older dummy data or generalized variants
            else if (fullText.includes("paid")) {
                paid++;
            }
            else if (fullText.includes("arb") || fullText.includes("lop")) {
                noBenefits++;
            }
            else if (fullText.includes("pending")) {
                pending++;
            }
            else if (fullText.includes("maximum limit") || fullText.includes("not covered")) {
                maxLimit++;
            }
            else if (fullText.includes("deductible") || fullText.includes("selfpay")) {
                deductible++;
            }

            // 6. Denied (Independent check)
            // Any claim containing 'denied' or 'deni' should be counted in the Denied card,
            // even if it was also classified under No OON.
            if (status.includes("denied") || status.includes("deni") || fullText.includes("denied") || fullText.includes("deni")) {
                denied++;
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    2025 - Chiro / PT / OT - Reports
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
                            <BarChart accessibilityLayer data={statusMetrics} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
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
