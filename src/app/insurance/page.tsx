"use client"

import React, { useMemo } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

// removed static pieConfig
const barConfig = {
    total: {
        label: "Total Claims",
        color: "var(--color-primary)",
    },
} satisfies ChartConfig

export default function InsuranceAnalysisPage() {
    const { filteredClaims, claims } = useData()

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    const categoryStats = useMemo(() => {
        const map: Record<string, number> = {}
        filteredClaims.forEach(c => {
            const cat = String(c.insuranceType)
            map[cat] = (map[cat] || 0) + 1
        })
        return Object.keys(map).map(k => ({
            category: k,
            total: map[k]
        })).sort((a, b) => b.total - a.total)
    }, [filteredClaims])

    const companyStats = useMemo(() => {
        const map: Record<string, number> = {}
        filteredClaims.forEach(c => {
            const comp = String(c.insuranceCompany || c.insuranceType)
            map[comp] = (map[comp] || 0) + 1
        })
        return Object.keys(map).map(k => ({
            company: k,
            total: map[k]
        })).sort((a, b) => b.total - a.total)
    }, [filteredClaims])

    const pieData = categoryStats.slice(0, 5).map((s, idx) => {
        const pieColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
        return {
            name: s.category,
            value: s.total,
            fill: pieColors[idx % 5]
        }
    })

    const dynamicPieConfig = useMemo(() => {
        const config: ChartConfig = {
            value: { label: "Volume" }
        }
        pieData.forEach((d) => {
            config[d.name] = {
                label: d.name,
                color: d.fill
            }
        })
        return config
    }, [pieData])

    const targetRef = React.useRef<HTMLDivElement>(null)
    const [isExporting, setIsExporting] = React.useState(false)

    const exportPdf = async () => {
        if (!targetRef.current) return
        setIsExporting(true)
        try {
            const html2canvas = (await import('html2canvas')).default
            const { jsPDF } = await import('jspdf')

            const canvas = await html2canvas(targetRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#020817' : '#ffffff'
            })

            const imgData = canvas.toDataURL('image/jpeg', 1.0)
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
            pdf.save('Insurance-Analysis.pdf')
        } catch (err) {
            console.error("Failed to export PDF", err)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" ref={targetRef}>
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-bold tracking-tight">Insurance Mix Analysis</h1>
                <Button onClick={exportPdf} disabled={isExporting} variant="outline" size="sm">
                    {isExporting ? "Exporting..." : "Download PDF"}
                </Button>
            </div>
            <GlobalFilters />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Insurance Category Mix</CardTitle>
                        <CardDescription>Distribution by insurance category</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4 flex flex-col items-center justify-center">
                        <ChartContainer config={dynamicPieConfig} className="mx-auto w-full max-w-[400px] h-[350px]">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Claims by Insurance Company</CardTitle>
                        <CardDescription>Total volume of claims per payer</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                        <ChartContainer config={barConfig} className="min-h-[400px] w-full">
                            <BarChart accessibilityLayer data={companyStats.slice(0, 10)} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis
                                    type="category"
                                    dataKey="company"
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        const u = val.toUpperCase();
                                        if (u.includes("PROGRESSIVE")) return "Progressive";
                                        if (u.includes("NJ MANUFACTUR")) return "NJM";
                                        if (u.includes("STATE FARM")) return "State Farm";
                                        if (u.includes("HORIZON BCBS")) return "Horizon OOS";
                                        if (u.includes("PLYMOUTH ROCK")) return "Plymouth Rock";
                                        return val.length > 14 ? val.substring(0, 14) + "..." : val;
                                    }}
                                    style={{ fontSize: "11px" }}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="total" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
