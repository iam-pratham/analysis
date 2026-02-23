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
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm mb-6">
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
                                {insurances.map((i) => (
                                    <SelectItem key={i} value={i}>
                                        {i}
                                    </SelectItem>
                                ))}
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
