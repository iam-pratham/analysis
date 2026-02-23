"use client"

import React, { useState, useMemo } from "react"
import { useData } from "@/context/data-context"
import { GlobalFilters } from "@/components/global-filters"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

export default function ReportsPage() {
    const { filteredClaims, claims } = useData()
    const [page, setPage] = useState(1)
    const rowsPerPage = 50

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

    const sortedClaims = useMemo(() => {
        let sortableItems = [...filteredClaims]
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a] ?? ''
                const bValue = b[sortConfig.key as keyof typeof b] ?? ''
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1
                }
                return 0
            })
        }
        return sortableItems
    }, [filteredClaims, sortConfig])

    const totalPages = Math.ceil(sortedClaims.length / rowsPerPage)
    const paginatedClaims = sortedClaims.slice((page - 1) * rowsPerPage, page * rowsPerPage)

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
        setPage(1)
    }

    const exportCSV = () => {
        const headers = ["claimId", "serviceDate", "patientName", "insuranceCompany", "insuranceType", "payerId", "providerName", "doctorName", "cptCode", "claimSentDate", "billedAmt", "paidAmt", "claimStatus"];
        const rows = sortedClaims.map(claim => {
            return headers.map(header => {
                let val = claim[header as keyof typeof claim] || "";
                if (header.includes("Date") && val) {
                    try { val = format(new Date(String(val)), "yyyy-MM-dd") } catch (e) { }
                }
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(",");
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Raw-Claims-Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportPDF = () => {
        window.print();
    }

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-bold tracking-tight">Raw Claims Report</h1>
                <div className="flex gap-2">
                    <Button onClick={exportCSV} variant="outline" size="sm">Download CSV</Button>
                    <Button onClick={exportPDF} variant="outline" size="sm">Print to PDF</Button>
                </div>
            </div>
            <GlobalFilters />

            <Card className="bg-card/50">
                <CardContent className="p-0">
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {["claimId", "serviceDate", "patientName", "insuranceCompany", "insuranceType", "payerId", "providerName", "doctorName", "cptCode", "claimSentDate", "billedAmt", "paidAmt", "claimStatus"].map((key) => (
                                        <TableHead key={key} className="cursor-pointer whitespace-nowrap text-xs" onClick={() => handleSort(key)}>
                                            <div className="flex items-center gap-1">
                                                {key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedClaims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-mono text-xs whitespace-nowrap">{claim.claimId || claim.id.slice(0, 8)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{format(new Date(claim.serviceDate), "yyyy-MM-dd")}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.patientName || "N/A"}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.insuranceCompany || "N/A"}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.insuranceType}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.payerId || "N/A"}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.providerName}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.doctorName}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">{claim.cptCode}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{claim.claimSentDate ? format(new Date(claim.claimSentDate), "yyyy-MM-dd") : "N/A"}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-right">${claim.billedAmt?.toFixed(2) || "0.00"}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-right">${claim.paidAmt?.toFixed(2) || "0.00"}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs font-semibold">{claim.claimStatus}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, sortedClaims.length)} of {sortedClaims.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
