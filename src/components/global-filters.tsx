"use client"

import { useData } from "@/context/data-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { FilterX } from "lucide-react"

export function GlobalFilters() {
    const { claims, filters, setFilters } = useData()

    if (claims.length === 0) return null

    const providers = Array.from(new Set(claims.map((c) => c.doctorName))).sort()
    const insurances = Array.from(new Set(claims.map((c) => c.insuranceType))).sort()

    const handleProvider = (v: string) => setFilters((prev) => ({ ...prev, provider: v === "all" ? null : v }))
    const handleInsurance = (v: string) => setFilters((prev) => ({ ...prev, insuranceType: v === "all" ? null : v }))

    return (
        <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm mb-6 transition-all duration-300 hover:border-primary/20">
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">Global Filters:</span>

                <div className="flex items-center gap-0">
                    <div className="w-[150px]">
                        <Select value={filters.provider || "all"} onValueChange={handleProvider}>
                            <SelectTrigger>
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

                    <div className="w-[150px]">
                        <Select value={filters.insuranceType || "all"} onValueChange={handleInsurance}>
                            <SelectTrigger>
                                <SelectValue placeholder="Insurance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Insurances</SelectItem>
                                {insurances.map((i) => {
                                    let label = i;
                                    const low = i.toLowerCase();
                                    if (
                                        low.includes("workers compensation") ||
                                        low.includes("worker's compensation") ||
                                        low === "wc" ||
                                        low.includes("motor vehicle") ||
                                        low === "mva" ||
                                        low === "mva/wc" ||
                                        low === "mva / wc" ||
                                        low.includes("mva/wc") ||
                                        low.includes("mva / wc")
                                    ) {
                                        label = "MVA/WC";
                                    }
                                    else if (low === "medicaid" || low === "lop") label = "LOP";
                                    else if (low.includes("commercial")) label = "Commercial";
                                    return (
                                        <SelectItem key={i} value={i}>
                                            {label}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                title="Clear Filters"
                onClick={() => setFilters({
                    provider: null,
                    doctor: null,
                    insuranceType: null,
                    cptCode: null,
                    dateStart: null,
                    dateEnd: null,
                })}
            >
                <FilterX className="h-4 w-4" />
            </Button>
        </div>
    )
}
