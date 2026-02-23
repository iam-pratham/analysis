"use client"

import React, { useEffect } from "react"
import { useData } from "@/context/data-context"
import { useRouter } from "next/navigation"
import { GlobalFilters } from "@/components/global-filters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, ShieldAlert, CheckCircle, AlertOctagon } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const chartConfig = {
  value: {
    label: "Claims",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig



export default function DashboardPage() {
  const { filteredClaims, claims } = useData()
  const router = useRouter()

  useEffect(() => {
    if (claims.length === 0) {
      router.replace("/upload")
    }
  }, [claims, router])

  if (claims.length === 0) {
    return null
  }

  // Calculate KPIs
  const totalClaims = filteredClaims.length
  const arbCount = filteredClaims.filter((c) => c.arbFlag).length
  const deniedCount = filteredClaims.filter((c) => c.denialIndicator).length
  const paidCount = filteredClaims.filter((c) =>
    String(c.paymentStatus).toLowerCase().includes("paid") ||
    String(c.claimStatus).toLowerCase() === "paid" ||
    (!c.denialIndicator && String(c.claimStatus).toLowerCase() !== "denied")
  ).length

  // Generate Data for Bar Chart: Claims by Insurance
  const insMap: Record<string, number> = {}
  filteredClaims.forEach(c => {
    insMap[c.insuranceType] = (insMap[c.insuranceType] || 0) + 1
  })
  const insurancesData = Object.keys(insMap).map(key => ({ name: key, value: insMap[key] }))
    .sort((a, b) => b.value - a.value).slice(0, 5)

  // Generate Data for Pie Chart: Top 5 CPT Codes
  const cptMap: Record<string, number> = {}
  filteredClaims.forEach(c => {
    const codes = String(c.cptCode || "").split(',').map(s => s.trim()).filter(Boolean)
    codes.forEach(code => {
      cptMap[code] = (cptMap[code] || 0) + 1
    })
  })
  const cptData = Object.keys(cptMap).map((key, i) => {
    const pieColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
    return {
      name: `CPT ${key}`,
      value: cptMap[key],
      fill: pieColors[i % 5]
    }
  }).sort((a, b) => b.value - a.value).slice(0, 5);

  const dynamicPieConfig = {
    value: { label: "Volume" },
    ...Object.fromEntries(
      cptData.map((d, i) => [
        d.name,
        { label: d.name, color: d.fill }
      ])
    )
  } satisfies ChartConfig;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <GlobalFilters />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed claims mtching filters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARB Volume</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{arbCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{((arbCount / totalClaims) * 100 || 0).toFixed(1)}% of total volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Paid / Allowed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{((paidCount / totalClaims) * 100 || 0).toFixed(1)}% performance rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied Claims</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{((deniedCount / totalClaims) * 100 || 0).toFixed(1)}% denial rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Top Insurances Volume</CardTitle>
            <CardDescription>Highest volume payers</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={insurancesData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.length > 14 ? value.substring(0, 14) + "..." : value}
                  style={{ fontSize: "11px" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Top 5 CPT Distribution</CardTitle>
            <CardDescription>Most frequently billed codes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={dynamicPieConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <ChartLegend className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4" content={<ChartLegendContent nameKey="name" />} />
                <Pie
                  data={cptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                >
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
