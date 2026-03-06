"use client"

import React, { useEffect, useMemo } from "react"
import { useData } from "@/context/data-context"
import { useRouter } from "next/navigation"
import { GlobalFilters } from "@/components/global-filters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell, LabelList } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
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

  // Generate Monthly Claims Data (DOS)
  const monthMap: Record<string, number> = {}
  filteredClaims.forEach(c => {
    if (c.serviceDate) {
      const d = new Date(c.serviceDate);
      if (!isNaN(d.getTime())) {
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[sortKey] = (monthMap[sortKey] || 0) + 1;
      }
    }
  })

  // Support filling gaps between min/max months
  let monthlyData: Array<{ sortKey: string, name: string, shortName: string, value: number }> = [];

  const sortKeys = Object.keys(monthMap).sort();
  if (sortKeys.length > 0) {
    const minKey = sortKeys[0];
    const maxKey = sortKeys[sortKeys.length - 1];

    let [currY, currM] = minKey.split('-').map(Number);
    const [maxY, maxM] = maxKey.split('-').map(Number);

    while (currY < maxY || (currY === maxY && currM <= maxM)) {
      const key = `${currY}-${String(currM).padStart(2, '0')}`;
      const d = new Date(currY, currM - 1, 1);

      monthlyData.push({
        sortKey: key,
        name: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        shortName: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        value: monthMap[key] || 0
      });

      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
    }
  }

  // Determine the display year/range for the title
  const dateRangeTitle = useMemo(() => {
    if (monthlyData.length === 0) return "2025";
    if (monthlyData.length === 1) return monthlyData[0].name;
    return `${monthlyData[0].shortName} - ${monthlyData[monthlyData.length - 1].shortName}`;
  }, [monthlyData]);

  // Analytics helper for the side panel
  const stats = useMemo(() => {
    if (monthlyData.length === 0) return { peak: null, avg: 0, topFive: [] };
    const sorted = [...monthlyData].sort((a, b) => b.value - a.value);
    const peak = sorted[0];
    const avg = monthlyData.reduce((acc, d) => acc + d.value, 0) / monthlyData.length;
    const topFive = sorted.slice(0, 5);
    return { peak, avg, topFive };
  }, [monthlyData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">2025 - Chiro / PT / OT - Claims Analysis</h1>
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
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalClaims.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total volume matching filters</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{paidCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((paidCount / totalClaims) * 100 || 0).toFixed(1)}% of total volume</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{unpaidCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((unpaidCount / totalClaims) * 100 || 0).toFixed(1)}% of total volume</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARB Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{arbCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((arbCount / totalClaims) * 100 || 0).toFixed(1)}% of total volume</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-1"
      >
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Monthly Claims Volume</CardTitle>
              <CardDescription>Number of claims processed per month based on Date of Service</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 min-h-[500px] mt-4">
                {/* Main Timeline Chart */}
                <div className="lg:col-span-8 flex flex-col h-full bg-muted/20 rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-semibold">Volume Timeline</h3>
                      <p className="text-sm text-muted-foreground italic">Monthly distribution of processed claims</p>
                    </div>
                    {stats.peak && (
                      <div className="text-right">
                        <span className="text-xs font-medium text-muted-foreground block">PEAK PERFORMANCE</span>
                        <span className="text-xl font-bold text-primary">{stats.peak.value} <span className="text-sm font-medium">Claims</span></span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full min-h-[350px]">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                          <XAxis
                            dataKey="shortName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                          />
                          <RechartsTooltip
                            content={<ChartTooltipContent className="bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-3" />}
                            cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                          />
                          <Bar
                            dataKey="value"
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={50}
                            animationBegin={300}
                          >
                            {monthlyData.map((_, i) => (
                              <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} fillOpacity={0.9} />
                            ))}
                            <LabelList
                              dataKey="value"
                              position="top"
                              offset={12}
                              className="fill-foreground font-bold"
                              fontSize={11}
                              formatter={(val: number) => val.toLocaleString()}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>

                {/* Detailed List Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Summary Metric */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Average Monthly Vol.</p>
                      <p className="text-2xl font-bold">{stats.avg.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Top 5 list (no scroll) */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-sm font-bold mb-4 px-1 text-primary lowercase">
                      top 5 high volume months
                    </h4>
                    <div className="flex-col space-y-3">
                      {stats.topFive.map((d, i) => (
                        <div key={d.sortKey} className="group flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/10">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold uppercase tracking-tight">{d.name}</span>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-base font-extrabold">{d.value.toLocaleString()}</span>
                            <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">
                              {((d.value / totalClaims) * 100 || 0).toFixed(1)}% Usage
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
