"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell } from "recharts"
import { GlobalFilters } from "@/components/global-filters"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { motion } from "framer-motion"

const volumeConfig = {
    claims: {
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

export default function ProviderPage() {
    const { filteredClaims, claims } = useData()

    const { providerVolumeMap, totalBilled, totalPaid, totalPaidClaims, totalDenied, totalArb, totalNoOon, totalChiro, totalPT, totalOT } = useMemo(() => {
        const pMap: Record<string, number> = {}
        let tBilled = 0
        let tPaid = 0
        let tPaidClaims = 0
        let tDenied = 0
        let tArb = 0
        let tChiro = 0
        let tPT = 0
        let tOT = 0
        let tNoOon = 0

        filteredClaims.forEach(c => {
            const statusStr = String(c.claimStatus || (c as any).report || '').toLowerCase();
            const payStatusStr = String(c.paymentStatus || "").toLowerCase();
            const combinedStatus = (statusStr + " " + payStatusStr).toLowerCase();
            const isPaid = combinedStatus.includes('paid');
            const isNoOon = statusStr.includes("no oon") || statusStr.includes("benefit exhausted")

            const name = c.doctorName || "Unknown"
            const nameLower = name.toLowerCase()

            pMap[name] = (pMap[name] || 0) + 1
            tBilled += (c.billedAmt || 0)
            tPaid += (c.paidAmt || 0)

            // Align with Reports and Dashboard logic
            if (isPaid) tPaidClaims++
            if (c.denialIndicator || statusStr.includes('denied') || statusStr.includes('deni') || combinedStatus.includes('denied')) tDenied++
            // Align ARB count exactly with Dashboard logic
            const isPaidStatus = statusStr.includes("paid correctly") || statusStr.includes("paid with 50%") || statusStr.includes("paid with patient")
            const isDeductible = statusStr.includes("towards dedcutible") || statusStr.includes("towards deductible") || statusStr.includes("self pay")
            const isInProcess = statusStr.includes("in process") || statusStr.includes("pending")
            const isMaxLimit = statusStr.includes("not covered under patient") || statusStr.includes("reached maximum limit") || statusStr.includes("efforts exhausted")
            const isNoOonOrExhausted = statusStr.includes("no oon") || statusStr.includes("benefit exhausted")
            const isLop = String(c.insuranceType || "").toUpperCase() === "LOP" || statusStr === "lop" || statusStr.includes("/lop")
            const isArb = c.arbFlag || statusStr.includes("under arbitration") || statusStr.includes("arbitration")
            if (!isPaidStatus && !isDeductible && !isInProcess && !isMaxLimit && !isNoOonOrExhausted && (isLop || isArb)) {
                tArb++
            }
            if (statusStr.includes('no oon') || statusStr.includes('benefit exhausted')) tNoOon++

            // Categorization based on pre-processed suffixes in data context
            const isChiro = name.includes(' - Chiro');
            const isPT = name.includes(' - PT');
            const isOT = name.includes(' - OT');

            if (isChiro) tChiro++
            if (isPT) tPT++
            if (isOT) tOT++
        })
        return {
            providerVolumeMap: pMap,
            totalBilled: tBilled,
            totalPaid: tPaid,
            totalPaidClaims: tPaidClaims,
            totalDenied: tDenied,
            totalArb: tArb,
            totalNoOon: tNoOon,
            totalChiro: tChiro,
            totalPT: tPT,
            totalOT: tOT
        }
    }, [filteredClaims])

    const providerData = useMemo(() => Object.keys(providerVolumeMap).map(k => ({ name: k, claims: providerVolumeMap[k] })).sort((a, b) => b.claims - a.claims), [providerVolumeMap])

    const cptData = useMemo(() => {
        const map: Record<string, number> = {}
        filteredClaims.forEach(c => {
            const codes = String(c.cptCode || "").split(',').map(s => s.trim()).filter(Boolean)
            codes.forEach(code => {
                map[code] = (map[code] || 0) + 1
            })
        })
        return Object.keys(map).map(k => ({ cpt: k, usage: map[k] })).sort((a, b) => b.usage - a.usage)
    }, [filteredClaims])

    const totalCptUsages = useMemo(() => cptData.reduce((acc, curr) => acc + curr.usage, 0), [cptData])

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">April thru December 2025 - Chiro / PT / OT Provider Analysis</h1>

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
                            <CardTitle>Total Claims by Provider</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <ChartContainer config={volumeConfig} className="min-h-[400px] w-full">
                                <BarChart accessibilityLayer data={providerData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 80, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.2} />
                                    <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} style={{ fill: "var(--color-muted-foreground)" }} />
                                    <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--color-muted-foreground)" }} />
                                    <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent indicator="line" />} />
                                    <Bar dataKey="claims" radius={[0, 4, 4, 0]} maxBarSize={40}>
                                        {providerData.slice(0, 10).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`var(--color-chart-${(index % 5) + 1})`}
                                            />
                                        ))}
                                        <LabelList
                                            dataKey="claims"
                                            position="right"
                                            content={(props: any) => {
                                                const { x, y, width, height, value } = props;
                                                if (value == null) return null;
                                                const pct = ((value / filteredClaims.length) * 100 || 0).toFixed(1);
                                                const rx = (x as number) + (width as number) + 10;
                                                const ry = (y as number) + (height as number) / 2 + 4;
                                                return (
                                                    <g>
                                                        <text x={rx} y={ry} fill="#dc2626" fontSize={11} fontWeight={700}>{(value as number).toLocaleString()}</text>
                                                        <text x={rx + 38} y={ry} fill="var(--color-muted-foreground)" fontSize={11}>{`(${pct}%)`}</text>
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

                <div className="flex flex-col gap-4 h-full">
                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 flex-1">
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Paid Amount</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-foreground">
                                    ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Actual collected payments</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 flex-1">
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Chiro Claims</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[var(--color-chart-1)]">
                                    {totalChiro}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Assigned provider</p>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">PT Claims</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[var(--color-chart-2)]">
                                    {totalPT}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Assigned provider</p>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">OT Claims</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[var(--color-chart-4)]">
                                    {totalOT}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Assigned provider</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 flex-1">
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {totalPaidClaims}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Successfully collected</p>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-center h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ARB / LOP Volume</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {totalArb}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Arbitration & LOP cases</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={itemVariants}>
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Top CPT Codes Used</CardTitle>
                            <CardDescription>Most frequently billed procedure codes for selected providers</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <ChartContainer config={{
                                usage: {
                                    label: "Total Usage",
                                    color: "var(--color-primary)",
                                }
                            }} className="min-h-[400px] w-full">
                                <BarChart accessibilityLayer data={cptData.slice(0, 15)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                                    <YAxis tickLine={false} axisLine={false} tickMargin={10} style={{ fill: "var(--color-muted-foreground)" }} />
                                    <ChartTooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }} content={<ChartTooltipContent />} />
                                    <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                                        {cptData.slice(0, 15).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`var(--color-chart-${(index % 5) + 1})`}
                                            />
                                        ))}
                                        <LabelList
                                            dataKey="usage"
                                            position="top"
                                            offset={26}
                                            style={{ fill: "#dc2626", fontWeight: 700 }}
                                            fontSize={12}
                                            formatter={(val: number) => val.toLocaleString()}
                                        />
                                        <LabelList
                                            dataKey="usage"
                                            position="top"
                                            offset={11}
                                            style={{ fill: "var(--color-muted-foreground)", fontWeight: 500 }}
                                            fontSize={11}
                                            formatter={(val: number) => `(${((val / totalCptUsages) * 100 || 0).toFixed(1)}%)`}
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
