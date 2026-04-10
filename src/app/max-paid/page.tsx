"use client"

import React, { useMemo, useState } from "react"
import { useData } from "@/context/data-context"
import { GlobalFilters } from "@/components/global-filters"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, ChevronDown, ChevronUp } from "lucide-react"

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

export default function MaxPaidPage() {
    const { filteredClaims, claims } = useData()
    const [expandedCpt, setExpandedCpt] = useState<string | null>(null)

    const maxPaidData = useMemo(() => {
        // map[cpt][insurance] = maxPaid
        const map: Record<string, Record<string, number>> = {};
        
        const processPayment = (cptCode: string, paidAmt: number, ins: string) => {
            const cpt = (cptCode || "").replace(/\s+total$/i, "").trim() || "Unknown";
            if (paidAmt > 0) {
                if (!map[cpt]) map[cpt] = {};
                if (!map[cpt][ins] || paidAmt > map[cpt][ins]) {
                    map[cpt][ins] = paidAmt;
                }
            }
        };

        filteredClaims.forEach(c => {
            const ins = c.insuranceCompany || "Unknown";
            if (c.cptDetails && c.cptDetails.length > 0) {
                c.cptDetails.forEach(detail => {
                    processPayment(detail.cpt, detail.paid || 0, ins);
                });
            } else {
                const cpts = String(c.cptCode || "").split(',').map(s => s.trim()).filter(Boolean);
                if (cpts.length === 1) {
                    processPayment(cpts[0], c.paidAmt || 0, ins);
                }
            }
        });

        return Object.keys(map).map(cpt => {
            const insurances = map[cpt];
            const sortedInsurances = Object.keys(insurances)
                .map(ins => ({ insurance: ins, maxPaid: insurances[ins] }))
                .sort((a, b) => b.maxPaid - a.maxPaid)
                .slice(0, 10);
            
            return {
                cpt,
                topInsurances: sortedInsurances,
                highestPaid: sortedInsurances[0]?.maxPaid || 0,
            }
        }).sort((a, b) => b.highestPaid - a.highestPaid);
    }, [filteredClaims])

    if (claims.length === 0) {
        return <div className="p-6">Navigate to Upload page to load data.</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Chiro / PT / OT - Max Paid by CPT</h1>
            <GlobalFilters />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                <motion.div variants={itemVariants}>
                    <Card className="flex flex-col border-primary/10 shadow-md">
                        <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <CardTitle>Maximum Reimbursement</CardTitle>
                            </div>
                            <CardDescription>
                                Track the top 10 insurance companies that paid the highest amount for each individual CPT code.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[120px] font-black uppercase tracking-widest text-[#2D3142] py-4 pl-6 text-xs">CPT Code</TableHead>
                                            <TableHead className="font-black uppercase tracking-widest text-[#2D3142] py-4 text-xs">Top Insurance</TableHead>
                                            <TableHead className="text-right font-black uppercase tracking-widest text-[#2D3142] py-4 pr-6 text-xs">Max Amount Paid</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {maxPaidData.length > 0 ? (
                                            maxPaidData.map((row, i) => (
                                                <React.Fragment key={`cpt-${i}`}>
                                                    <TableRow 
                                                        className={`transition-colors border-b border-border/50 cursor-pointer group hover:bg-primary/[0.03] ${expandedCpt === row.cpt ? 'bg-primary/[0.02]' : ''}`}
                                                        onClick={() => setExpandedCpt(expandedCpt === row.cpt ? null : row.cpt)}
                                                    >
                                                        <TableCell className="font-mono font-bold text-[#455A64] py-4 pl-6 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                {expandedCpt === row.cpt ? (
                                                                    <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-primary" />
                                                                )}
                                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                                                                    {row.cpt}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-semibold text-[#2D3142] py-4 text-sm">
                                                            {row.topInsurances[0]?.insurance || "N/A"}
                                                            {row.topInsurances.length > 1 && (
                                                                <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                                    (+{row.topInsurances.length - 1} more)
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-green-600 py-4 pr-6 text-base tracking-tight">
                                                            ${row.highestPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                    </TableRow>
                                                    <AnimatePresence>
                                                        {expandedCpt === row.cpt && (
                                                            <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/50">
                                                                <TableCell colSpan={3} className="p-0">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="px-14 py-4 space-y-3">
                                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                                                                Top 10 Insurances
                                                                            </h4>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                {row.topInsurances.map((ins, idx) => (
                                                                                    <div key={idx} className="bg-background border border-border/50 rounded-md p-3 flex justify-between items-center shadow-sm gap-2">
                                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                            <span className="text-[10px] font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">#{idx + 1}</span>
                                                                                            <span className="text-[11px] font-semibold truncate" title={ins.insurance}>{ins.insurance}</span>
                                                                                        </div>
                                                                                        <span className="text-sm font-bold text-green-600 shrink-0">
                                                                                            ${ins.maxPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground font-medium">
                                                    No payment data found for the current filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
