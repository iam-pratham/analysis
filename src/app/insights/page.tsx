"use client"

import React, { useState, useEffect, useRef } from "react"
import { useData } from "@/context/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlobalFilters } from "@/components/global-filters"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, Sparkles } from "lucide-react"

export default function AIInsightsPage() {
    const { filteredClaims, claims } = useData()
    const [insights, setInsights] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const isFetchingRef = useRef(false)

    const generateInsights = async () => {
        if (filteredClaims.length === 0 || isFetchingRef.current) return
        isFetchingRef.current = true
        setLoading(true)

        const providerMap: any = {}
        const doctorMap: any = {}
        const cptMap: any = {}
        const insMap: any = {}

        filteredClaims.forEach(c => {
            providerMap[c.providerName] = (providerMap[c.providerName] || 0) + 1
            doctorMap[c.doctorName] = (doctorMap[c.doctorName] || 0) + 1
            insMap[c.insuranceType] = (insMap[c.insuranceType] || 0) + 1

            const codes = String(c.cptCode || "").split(',').map(s => s.trim()).filter(Boolean)
            codes.forEach(code => {
                cptMap[code] = (cptMap[code] || 0) + 1
            })
        })

        const payload = {
            existingTitles: insights.map((i: any) => i.title),
            providerVolumes: Object.keys(providerMap).map(p => ({ provider: p, count: providerMap[p] })),
            doctorVolumes: Object.keys(doctorMap).map(d => ({ doctor: d, count: doctorMap[d] })).sort((a, b) => b.count - a.count),
            cptUsages: Object.keys(cptMap).map(c => ({ cptCode: c, count: cptMap[c] })).sort((a, b) => b.count - a.count),
            insuranceMix: Object.keys(insMap).map(i => ({ type: i, count: insMap[i] })),
            totalVolume: filteredClaims.length
        }

        try {
            const resp = await fetch("/api/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            const result = await resp.json()
            setInsights(prev => {
                // To be extremely safe about duplicates from fast clicking
                const newInsights = (result.insights || []).filter((ni: any) => !prev.find(p => p.title === ni.title))
                return [...newInsights, ...prev]
            })
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            isFetchingRef.current = false
        }
    }

    useEffect(() => {
        if (claims.length > 0 && insights.length === 0) {
            generateInsights()
        }
    }, [claims])

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    const targetRef = useRef<HTMLDivElement>(null)
    const [isExporting, setIsExporting] = useState(false)

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
            pdf.save('AI-Insights.pdf')
        } catch (err) {
            console.error("Failed to export PDF", err)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" ref={targetRef}>
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    AI Automated Insights
                </h1>
                <div className="flex items-center gap-2">
                    <Button onClick={exportPdf} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? "Exporting..." : "Download PDF"}
                    </Button>
                    <Button onClick={generateInsights} disabled={loading} variant="outline" size="sm" className="gap-2">
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? "Analyzing..." : "Refresh Insights"}
                    </Button>
                </div>
            </div>

            <GlobalFilters />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse bg-card">
                            <CardHeader className="space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                <div className="h-6 bg-muted rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="h-4 bg-muted rounded"></div>
                                <div className="h-4 bg-muted rounded"></div>
                                <div className="h-4 bg-muted rounded w-5/6"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    insights.map((insight) => (
                        <Card key={insight.id} className="relative overflow-hidden bg-card border">
                            <div className={`absolute top-0 left-0 w-full h-1 ${insight.badgeColor}`}></div>
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className={`${insight.type === 'Risk' ? 'text-red-500 border-red-500/50' : insight.type === 'Opportunity' ? 'text-green-500 border-green-500/50' : 'text-blue-500 border-blue-500/50'}`}>
                                        {insight.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {insight.confidence} Confidence
                                    </span>
                                </div>
                                <CardTitle className="text-xl">{insight.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">{insight.description}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
