"use client"

import React, { useEffect, useMemo } from "react"
import { useData } from "@/context/data-context"
import { useRouter } from "next/navigation"
import { GlobalFilters } from "@/components/global-filters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell, LabelList, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, RefreshCw, TrendingUp, CalendarDays, Activity } from "lucide-react"
import { format } from "date-fns"

const parseDateSafe = (dateStr: any) => {
    if (!dateStr) return new Date()
    if (typeof dateStr === 'string' && dateStr.includes('-') && !dateStr.includes('T')) {
        return new Date(dateStr + 'T00:00:00')
    }
    return new Date(dateStr)
}

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
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 }, transitionEnd: { transform: "none", "-webkit-transform": "none" } }
}

export default function DashboardPage() {
  const { filteredClaims, claims } = useData()
  const router = useRouter()

  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)
  const [modalPage, setModalPage] = React.useState(1)
  const modalRowsPerPage = 50

  React.useEffect(() => {
    if (searchTerm) {
      setIsPending(true)
      const timer = setTimeout(() => setIsPending(false), 300)
      return () => clearTimeout(timer)
    } else {
      setIsPending(false)
    }
  }, [searchTerm])

  const activeClaimsForModal = useMemo(() => {
    let list = filteredClaims;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(c => {
        const patName = (c.patientName || "").toLowerCase();
        const insName = (c.insuranceCompany || "").toLowerCase();
        const docName = (c.doctorName || "").toLowerCase();
        const dos = format(parseDateSafe(c.serviceDate), "MM/dd/yyyy");
        return patName.includes(lower) || insName.includes(lower) || docName.includes(lower) || dos.includes(lower);
      });
    }
    return list;
  }, [filteredClaims, searchTerm])

  const paginatedModalClaims = useMemo(() => {
    return activeClaimsForModal.slice((modalPage - 1) * modalRowsPerPage, modalPage * modalRowsPerPage)
  }, [activeClaimsForModal, modalPage])

  const modalTotalPages = Math.ceil(activeClaimsForModal.length / modalRowsPerPage)

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
  const arbLopNoOonCount = filteredClaims.filter((c) => {
    const s = String(c.claimStatus || "").toLowerCase().trim()
    // Exclude claims whose status explicitly places them in another category
    if (s.includes("paid correctly") || s.includes("paid with 50%") || s.includes("paid with patient")) return false
    if (s.includes("towards dedcutible") || s.includes("towards deductible") || s.includes("self pay")) return false
    if (s.includes("in process") || s.includes("pending")) return false

    // ARB / LOP / No OON / Benefit Exhausted logic
    return (
      s.includes("under arbitration") ||
      s.includes("benefit exhausted") ||
      s.includes("denied-no oon") ||
      s.includes("denied - no oon") ||
      s.includes("no oon") ||
      s === "lop" ||
      s.includes("/lop") ||
      String(c.insuranceType || "").toUpperCase() === "LOP" ||
      c.arbFlag
    )
  }).length
  const deductibleCount = filteredClaims.filter((c) => {
    const status = String(c.claimStatus || "").toLowerCase()
    return status.includes("towards deductible") || status.includes("towards dedcutible") || status.includes("deductible")
  }).length
  const selfPayCount = filteredClaims.filter((c) => {
    const status = String(c.claimStatus || "").toLowerCase()
    const payStatus = String(c.paymentStatus || "").toLowerCase()
    return status.includes("self pay") || status.includes("selfpay") || payStatus.includes("selfpay")
  }).length
  const paidCount = filteredClaims.filter((c) => {
    const s = String(c.claimStatus || "").toLowerCase().trim()
    return s.includes("paid correctly") || s.includes("paid with 50%") || s.includes("paid with patient")
  }).length
  const unpaidCount = totalClaims - paidCount - arbLopNoOonCount

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
        name: d.toLocaleString('default', { month: 'long' }),
        shortName: d.toLocaleString('default', { month: 'short' }),
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
    if (monthlyData.length === 0) return { peak: null, avg: 0, topFive: [], max: 0 };
    const sorted = [...monthlyData].sort((a, b) => b.value - a.value);
    const peak = sorted[0];
    const avg = monthlyData.reduce((acc, d) => acc + d.value, 0) / monthlyData.length;
    const topFive = sorted.slice(0, 5);
    return { peak, avg, topFive, max: peak ? peak.value : 0 };
  }, [monthlyData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Chiro / PT / OT - Claims Overview</h1>
        <Button onClick={() => setIsSearchOpen(true)} variant="outline" className="gap-2 bg-background/50 backdrop-blur-md">
            <Search className="h-4 w-4" /> Global Search
        </Button>
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
              <p className="text-xs text-muted-foreground mt-1">100% of total claims</p>
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
              <p className="text-xs text-muted-foreground mt-1">{((paidCount / totalClaims) * 100 || 0).toFixed(1)}% of total</p>
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
              <p className="text-xs text-muted-foreground mt-1">{((unpaidCount / totalClaims) * 100 || 0).toFixed(1)}% of total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARB / LOP / No OON</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{arbLopNoOonCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{((arbLopNoOonCount / totalClaims) * 100 || 0).toFixed(1)}% of total</p>
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
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Monthly Claims Volume
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Growth and scaling trends across the year</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-[500px]">
                {/* Main Timeline Chart */}
                <div className="lg:col-span-8 flex flex-col h-full bg-background p-6 lg:border-r border-border/20">
                  <div className="flex-1 w-full min-h-[350px]">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorLineGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="var(--color-chart-1)" />
                              <stop offset="50%" stopColor="var(--color-chart-2)" />
                              <stop offset="100%" stopColor="var(--color-chart-5)" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                          <XAxis
                            dataKey="shortName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 500 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 500 }}
                          />
                          <RechartsTooltip
                            content={<ChartTooltipContent className="bg-background/95 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl p-3" />}
                            cursor={{ fill: 'transparent', stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="url(#colorLineGradient)"
                            strokeWidth={4}
                            dot={{ fill: "var(--color-background)", stroke: "var(--color-chart-2)", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: "var(--color-chart-5)", stroke: "var(--color-background)", strokeWidth: 2 }}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>

                {/* Detailed List Sidebar */}
                <div className="lg:col-span-4 flex flex-col p-6 bg-background space-y-6">
                  {/* Summary Metric */}
                  <div className="p-4 rounded-xl border border-border/30 bg-muted/10 shadow-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg. Monthly Volume</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-foreground">{Math.ceil(stats.avg).toLocaleString()}</p>
                      <p className="text-xs font-semibold text-muted-foreground/70">claims / mo</p>
                    </div>
                  </div>

                  {/* Top 5 list */}
                  <div className="flex-1 flex flex-col space-y-4">
                    <div className="px-1">
                      <h4 className="text-sm font-semibold text-foreground tracking-tight">
                        Top 5 Volume Months
                      </h4>
                    </div>
                    
                    <div className="flex-col space-y-2">
                      {stats.topFive.map((d, i) => (
                        <div key={d.sortKey} className="group flex flex-col justify-center p-3 rounded-xl bg-card border border-border/30 shadow-sm relative overflow-hidden">
                          {/* Progress background */}
                          <div 
                              className="absolute left-0 top-0 bottom-0 bg-primary/[0.03] transition-all duration-1000 origin-left" 
                              style={{ width: `${(d.value / stats.max) * 100}%` }} 
                          />
                          
                          <div className="relative flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{i + 1}</span>
                              <span className="text-sm font-semibold tracking-tight text-foreground">{d.name}</span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="text-sm font-bold text-foreground">{d.value.toLocaleString()}</span>
                            </div>
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

      {/* Claims Detail Modal */}
      <Dialog 
          open={isSearchOpen} 
          onOpenChange={(open) => {
              if (!open) {
                  setIsSearchOpen(false)
                  setSearchTerm("")
                  setIsPending(false)
                  setTimeout(() => setModalPage(1), 300)
              }
          }}
      >
          <DialogContent className="sm:max-w-[96vw] w-[96vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-background/50 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                          <DialogTitle className="text-2xl font-black flex items-center gap-3">
                              <span>Global Claims Search</span>
                              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                                  {activeClaimsForModal.length} RECORDS
                              </span>
                          </DialogTitle>
                      </div>
                      <div className="relative w-full sm:w-72 sm:pr-10">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                              placeholder="Search patient, DOS, provider" 
                              className="pl-9 h-10 w-full bg-background/50 border-border focus:border-border focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all font-medium text-sm outline-none"
                              value={searchTerm}
                              onChange={(e) => {
                                  setSearchTerm(e.target.value);
                                  setModalPage(1);
                              }}
                          />
                          {isPending && (
                              <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute right-14 top-1/2 -translate-y-1/2"
                              >
                                  <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                              </motion.div>
                          )}
                      </div>
                  </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 bg-muted/10">
                  <div className="min-w-max w-full">
                      <Table className="relative w-full border-collapse">
                          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-md z-30 shadow-sm border-b border-border">
                              <TableRow className="hover:bg-transparent border-none">
                                  <TableHead className="w-[140px] py-4 pl-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Date</TableHead>
                                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patient Name</TableHead>
                                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Insurance & Payer</TableHead>
                                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attending Physician</TableHead>
                                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">CPT Codes</TableHead>
                                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Billed Amount</TableHead>
                                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paid Amount</TableHead>
                                  <TableHead className="py-4 pr-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Claim Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              <AnimatePresence mode="popLayout">
                                  {isPending ? (
                                      <TableRow>
                                          <TableCell colSpan={8} className="h-32 text-center">
                                              <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                                                  <p className="text-[10px] font-bold uppercase tracking-widest">Updating results...</p>
                                              </div>
                                          </TableCell>
                                      </TableRow>
                                  ) : (
                                      paginatedModalClaims.map((claim) => (
                                          <motion.tr 
                                              key={claim.id} 
                                              initial={{ opacity: 0, y: 4 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className="hover:bg-primary/[0.03] transition-colors border-b border-border/50 group/row"
                                          >
                                              <TableCell className="whitespace-nowrap text-xs font-mono pl-6 py-4">
                                                  {format(parseDateSafe(claim.serviceDate), "MM/dd/yyyy")}
                                              </TableCell>
                                              <TableCell className="whitespace-nowrap text-xs font-bold py-4">
                                                  {claim.patientName}
                                              </TableCell>
                                              <TableCell className="text-xs py-4">
                                                  <div className="flex flex-col gap-0.5">
                                                      <span className="font-bold text-foreground line-clamp-1">{claim.insuranceCompany}</span>
                                                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{claim.insuranceType}</span>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="text-xs py-4">
                                                  <div className="flex flex-col gap-0.5">
                                                      <span className="font-bold text-foreground line-clamp-1">{claim.doctorName?.split(' - ')[0] || "N/A"}</span>
                                                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                                          {claim.doctorName?.includes(' - Chiro') ? 'Chiro' : 
                                                           claim.doctorName?.includes(' - PT') ? 'PT' : 
                                                           claim.doctorName?.includes(' - OT') ? 'OT' : 'N/A'}
                                                      </span>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="text-xs font-mono text-muted-foreground py-4">
                                                  {claim.cptCode}
                                              </TableCell>
                                              <TableCell className="text-xs font-bold py-4">
                                                  ${claim.billedAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                              </TableCell>
                                              <TableCell className="text-xs font-black text-green-600 py-4">
                                                  ${claim.paidAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                              </TableCell>
                                              <TableCell className="py-4 pr-6">
                                                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-1 rounded inline-block max-w-[280px] break-words uppercase leading-tight">
                                                      {claim.claimStatus}
                                                  </span>
                                              </TableCell>
                                          </motion.tr>
                                      ))
                                  )}
                              </AnimatePresence>
                          </TableBody>
                      </Table>
                  </div>
              </div>

              <div className="p-4 border-t border-border/50 flex items-center justify-between bg-background shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">
                      Showing <span className="text-foreground">{(modalPage - 1) * modalRowsPerPage + 1}</span> to <span className="text-foreground">{Math.min(modalPage * modalRowsPerPage, activeClaimsForModal.length)}</span> of {activeClaimsForModal.length}
                  </p>
                  <div className="flex items-center gap-2">
                      <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs font-bold"
                          onClick={() => setModalPage(p => Math.max(1, p - 1))}
                          disabled={modalPage === 1}
                      >
                          Previous
                      </Button>
                      <div className="flex items-center gap-1 mx-2">
                          <span className="text-xs font-bold">Page {modalPage}</span>
                          <span className="text-xs text-muted-foreground">of {modalTotalPages}</span>
                      </div>
                      <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs font-bold"
                          onClick={() => setModalPage(p => Math.min(modalTotalPages, p + 1))}
                          disabled={modalPage === modalTotalPages}
                      >
                          Next
                      </Button>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}
