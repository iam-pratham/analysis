"use client"

import React, { useEffect } from "react"
import { useData } from "@/context/data-context"
import { useRouter } from "next/navigation"
import { GlobalFilters } from "@/components/global-filters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, ShieldAlert, CheckCircle, AlertOctagon } from "lucide-react"
import { BarChart, Bar, XAxis, PieChart, Pie, CartesianGrid, LabelList, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { motion } from "framer-motion"

const chartConfig = {
  value: {
    label: "Claims",
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
  const paidCount = filteredClaims.filter((c) =>
    String(c.paymentStatus).toLowerCase().includes("paid") ||
    String(c.claimStatus).toLowerCase().includes("paid")
  ).length
  const unpaidCount = totalClaims - paidCount

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
      cptData.map((d) => [
        d.name,
        { label: d.name, color: d.fill }
      ])
    )
  } satisfies ChartConfig;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      </div>

      <GlobalFilters />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalClaims.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Processed claims mtching filters</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARB Volume</CardTitle>
              <div className="p-2 bg-chart-1/10 rounded-full">
                <ShieldAlert className="h-4 w-4 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{arbCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((arbCount / totalClaims) * 100 || 0).toFixed(1)}% of total volume</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
              <div className="p-2 bg-chart-2/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{paidCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((paidCount / totalClaims) * 100 || 0).toFixed(1)}% performance rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Claims</CardTitle>
              <div className="p-2 bg-chart-3/10 rounded-full">
                <AlertOctagon className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{unpaidCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((unpaidCount / totalClaims) * 100 || 0).toFixed(1)}% unpaid rate</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Top Insurances Volume</CardTitle>
              <CardDescription>Highest volume payers</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={insurancesData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const u = value.toUpperCase();
                      if (u === "WC") return "WC";
                      if (u === "LOP") return "LOP";
                      if (u === "MVA") return "MVA";
                      if (u.includes("PROGRESSIVE")) return "Progressive";
                      if (u.includes("NJ MANUFACTUR")) return "NJM";
                      if (u.includes("STATE FARM")) return "State Farm";
                      if (u.includes("HORIZON BCBS")) return "Horizon OOS";
                      if (u.includes("PLYMOUTH ROCK")) return "Plymouth Rock";
                      if (u.includes("GEICO")) return "Geico NJ";
                      const formatted = value.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
                      return formatted.length > 14 ? formatted.substring(0, 14) + "..." : formatted;
                    }}
                    style={{ fontSize: "11px", fill: "var(--color-muted-foreground)" }}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--color-primary)', opacity: 0.1 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {insurancesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`var(--color-chart-${(index % 5) + 1})`}
                      />
                    ))}
                    <LabelList dataKey="value" position="top" offset={10} className="fill-foreground/80 font-bold" fontSize={11} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex flex-col h-full">
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
                  <ChartLegend className="flex-wrap gap-4 pb-4" content={<ChartLegendContent nameKey="name" />} />
                  <Pie
                    data={cptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    labelLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                    label={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: "medium" }}
                    stroke="none"
                  >
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
