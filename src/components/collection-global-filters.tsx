"use client"

import { useData } from "@/context/data-context"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"

export function CollectionGlobalFilters({ 
    collectionMonth, 
    setCollectionMonth,
    fileAvailableMonths 
}: { 
    collectionMonth: string; 
    setCollectionMonth: (val: string) => void;
    fileAvailableMonths: string[];
}) {
    const { claims, cleanedClaims, filters, setFilters } = useData()

    if (claims.length === 0) return null

    const providers = Array.from(new Set(cleanedClaims.map((c: any) => c.doctorName as string))).filter(Boolean).sort()
    const insurances = Array.from(new Set(cleanedClaims.map((c: any) => c.insuranceType as string))).filter(i => i && i !== "Unknown Insurance").sort()

    const handleProvider = (v: string) => setFilters((prev) => ({ ...prev, provider: v === "all" ? null : v }))
    const handleInsurance = (v: string) => setFilters((prev) => ({ ...prev, insuranceType: v === "all" ? null : v }))

    const formatMonthName = (rawMonth: string) => {
        if (!rawMonth || rawMonth === "all") return rawMonth;
        
        let mon = "";
        let yy = "";
        
        if (rawMonth.includes('-')) {
            [mon, yy] = rawMonth.split('-');
        } else if (rawMonth.includes(' ')) {
            const parts = rawMonth.split(' ');
            mon = parts[0];
            yy = parts[1];
        } else {
            return rawMonth;
        }
        
        const monthMapFull: Record<string, string> = {
            "Jan": "January", "Feb": "February", "Mar": "March", "Apr": "April", "May": "May", "Jun": "June",
            "Jul": "July", "Aug": "August", "Sep": "September", "Oct": "October", "Nov": "November", "Dec": "December"
        };
        
        const shortMon = mon.substring(0, 3);
        const fullMon = monthMapFull[shortMon] || mon;
        const fullYear = yy.length === 2 ? `20${yy}` : yy;
        
        return `${fullMon} ${fullYear}`;
    }

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
                        <Select value={collectionMonth} onValueChange={setCollectionMonth}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {fileAvailableMonths.map(m => (
                                    <SelectItem key={m} value={m}>{formatMonthName(m)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors h-auto py-2"
                onClick={() => {
                    setFilters({
                        provider: null,
                        doctor: null,
                        insuranceType: null,
                        cptCode: null,
                        month: null, // Clear this too just in case
                        dateStart: null,
                        dateEnd: null,
                    });
                    setCollectionMonth("all");
                }}
            >
                Clear Filters
            </Button>
        </div>
    )
}
