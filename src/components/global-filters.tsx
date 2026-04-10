"use client"

import { useData } from "@/context/data-context"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { Search, FilterX } from "lucide-react"
import React, { useState } from "react"
import { GlobalSearchModal } from "./global-search-modal"

export function GlobalFilters() {
    const { claims, filteredClaims, filters, setFilters } = useData()
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

    if (claims.length === 0) return null

    const providers = Array.from(new Set(filteredClaims.map((c: any) => c.doctorName as string))).sort()
    const insurances = Array.from(new Set(claims.map((c) => {
        let newIns = c.insuranceType || "Unknown Insurance";
        const low = newIns.toLowerCase();
        const compLow = (c.insuranceCompany || "").toLowerCase();
        if (
            low.includes("workers compensation") ||
            low.includes("worker's compensation") ||
            low === "wc" ||
            low.includes("motor vehicle") ||
            low === "mva" ||
            low === "mva/wc" ||
            low === "mva / wc" ||
            low.includes("mva/wc") ||
            low.includes("mva / wc") ||
            low.includes("mva oc") ||
            compLow.includes("nj manufactur") ||
            compLow.includes("njm") ||
            compLow.includes("geico")
        ) {
            newIns = "MVA/WC";
        } else if (low === "medicaid" || low === "lop" || compLow.includes("friedland")) {
            newIns = "LOP";
        } else if (
            low.includes("commercial") || 
            low.includes("health") || 
            compLow.includes("horizon") || 
            compLow.includes("umr")
        ) {
            newIns = "Commercial";
        } else if (low.includes("medicare")) {
            newIns = "Medicare";
        }
        return newIns;
    }))).filter(i => i && i !== "Unknown Insurance").sort()

    const monthsKeys = Array.from(new Set(claims.map((c) => {
        if (!c.serviceDate) return null;
        const d = new Date(c.serviceDate);
        if (isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean))).sort((a, b) => (a as string).localeCompare(b as string)) as string[];

    const formatMonth = (monthKey: string) => {
        const [y, m] = monthKey.split('-');
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const years = Array.from(new Set(monthsKeys.map(m => m.split('-')[0]))).sort();

    const handleProvider = (v: string) => setFilters((prev) => ({ ...prev, provider: v === "all" ? null : v }))
    const handleInsurance = (v: string) => setFilters((prev) => ({ ...prev, insuranceType: v === "all" ? null : v }))
    const handleMonth = (v: string) => setFilters((prev) => ({ ...prev, month: v === "all" ? null : v }))

    return (
        <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm mb-6 transition-all duration-300 hover:border-primary/20">
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">Global Filters:</span>

                <div className="flex items-center gap-4">
                    <div className="w-auto min-w-[150px] max-w-[250px]">
                        <Select value={filters.provider || "all"} onValueChange={handleProvider}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Providers</SelectItem>
                                {providers.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-auto min-w-[150px] max-w-[250px]">
                        <Select value={filters.insuranceType || "all"} onValueChange={handleInsurance}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Insurance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Insurances</SelectItem>
                                {insurances.map((i) => (
                                    <SelectItem key={i} value={i}>
                                        {i}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-auto min-w-[150px] max-w-[250px]">
                        <Select value={filters.month || "all"} onValueChange={handleMonth}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {years.map((year) => (
                                    <SelectGroup key={year}>
                                        <SelectLabel className="font-bold text-primary">{year}</SelectLabel>
                                        {monthsKeys.filter(m => m.split('-')[0] === year).map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {formatMonth(m)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    className="gap-2 bg-background/50 backdrop-blur-md"
                    onClick={() => setIsSearchModalOpen(true)}
                >
                    <Search className="h-4 w-4" /> Global Search
                </Button>

                <Button
                    variant="ghost"
                    className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors h-auto py-2"
                    onClick={() => setFilters({
                        provider: null,
                        doctor: null,
                        insuranceType: null,
                        cptCode: null,
                        month: null,
                        dateStart: null,
                        dateEnd: null,
                    })}
                >
                    Clear Filters
                </Button>
            </div>
            
            <GlobalSearchModal isOpen={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} />
        </div>
    )
}
