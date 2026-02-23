"use client"

import React from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts"
import { format } from "date-fns"
import { GlobalFilters } from "@/components/global-filters"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const volumeConfig = {
    claims: {
        label: "Total Claims",
        color: "var(--color-primary)",
    },
} satisfies ChartConfig

export default function ProviderPage() {
    const { filteredClaims, claims } = useData()

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    // Claim Volume by Provider (Doctor)
    const providerVolumeMap: Record<string, number> = {}
    let totalBilled = 0
    let totalPaid = 0
    let totalDenied = 0
    let totalArb = 0

    filteredClaims.forEach(c => {
        const name = c.doctorName || "Unknown"
        providerVolumeMap[name] = (providerVolumeMap[name] || 0) + 1
        totalBilled += (c.billedAmt || 0)
        totalPaid += (c.paidAmt || 0)
        if (c.denialIndicator) totalDenied++
        if (c.arbFlag) totalArb++
    })

    const providerData = Object.keys(providerVolumeMap).map(k => ({ name: k, claims: providerVolumeMap[k] }))
        .sort((a, b) => b.claims - a.claims)

    // CPT Usage for currently filtered claims
    const cptMap: Record<string, number> = {}
    filteredClaims.forEach(c => {
        const codes = String(c.cptCode || "").split(',').map(s => s.trim()).filter(Boolean)
        codes.forEach(code => {
            cptMap[code] = (cptMap[code] || 0) + 1
        })
    })

    const cptData = Object.keys(cptMap).map(k => ({ cpt: k, usage: cptMap[k] }))
        .sort((a, b) => b.usage - a.usage)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Provider Analysis</h1>

            <GlobalFilters />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Total Claims by Provider</CardTitle>
                        <CardDescription>Top billing service providers</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                        <ChartContainer config={volumeConfig} className="min-h-[400px] w-full">
                            <BarChart accessibilityLayer data={providerData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Bar dataKey="claims" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4 h-full">
                    <Card className="flex-1 flex flex-col justify-center">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Billed Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Aggregated billed charges</p>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 flex flex-col justify-center">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Actual collected payments</p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <Card className="flex flex-col justify-center">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Denied Claims</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {totalDenied}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Requiring review</p>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-center">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ARB Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {totalArb}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Arbitration flagged</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Card className="mt-6 flex flex-col">
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
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="cpt"
                                angle={-45}
                                textAnchor="end"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                height={60}
                            />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="usage" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
