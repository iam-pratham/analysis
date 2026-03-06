"use client"

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Claim {
    id: string; // generated internally for table rows
    claimId?: string;
    providerName: string;
    doctorName: string;
    cptCode: string; // single string or comma separated
    insuranceCompany?: string;
    insuranceType: string;
    payerId?: string;
    patientName?: string;
    serviceDate: Date;
    claimSentDate?: Date | null;
    billedAmt?: number;
    paidAmt?: number;
    claimStatus: string;
    paymentStatus: string;
    arbFlag: boolean;
    denialIndicator: boolean;
}

export interface FilterState {
    provider: string | null;
    doctor: string | null;
    insuranceType: string | null;
    cptCode: string | null;
    dateStart: Date | null;
    dateEnd: Date | null;
}

interface DataContextProps {
    claims: Claim[];
    setClaims: React.Dispatch<React.SetStateAction<Claim[]>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    filteredClaims: Claim[];
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterState>({
        provider: null,
        doctor: null,
        insuranceType: null,
        cptCode: null,
        dateStart: null,
        dateEnd: null,
    });

    const filteredClaims = React.useMemo(() => {
        const cleanedClaims = claims.map(c => {
            // Apply naming fixes according to user request
            let newIns = c.insuranceType;
            if (
                newIns?.toLowerCase().includes("workers compensation") ||
                newIns?.toLowerCase().includes("worker\'s compensation") ||
                newIns?.toLowerCase() === "wc" ||
                newIns?.toLowerCase().includes("motor vehicle") ||
                newIns?.toLowerCase() === "mva" ||
                newIns?.toLowerCase() === "mva/wc" ||
                newIns?.toLowerCase() === "mva / wc" ||
                newIns?.toLowerCase().includes("mva/wc") ||
                newIns?.toLowerCase().includes("mva / wc")
            ) {
                newIns = "MVA/WC";
            } else if (newIns?.toLowerCase() === "medicaid" || newIns?.toLowerCase() === "lop") {
                newIns = "LOP";
            } else if (newIns?.toLowerCase().includes("commercial")) {
                newIns = "Commercial";
            } else if (newIns?.toLowerCase().includes("medicare")) {
                newIns = "Medicare";
            }

            const rawDoc = c.doctorName ? c.doctorName.split(',')[0].trim() : "Unknown Doctor";
            const nameLower = rawDoc.toLowerCase();
            let docSuffix = "";

            // Centralized Specialty Mapping
            if (nameLower.includes('jay e brecker') || nameLower.includes('peter j berger') || nameLower.includes('marzili')) {
                docSuffix = " - Chiro";
            } else if (
                nameLower.includes('bruce j buckman') ||
                nameLower.includes('christian s gartner') ||
                nameLower.includes('monroe castro') ||
                nameLower.includes('monreo castro') || // Handle previous typo if it exists in raw data
                nameLower.includes('sridhar yalamanchili') ||
                nameLower.includes('marianne decastro') ||
                nameLower.includes('andy koser') ||
                nameLower.includes('sferra') ||
                nameLower.includes('sferry')
            ) {
                docSuffix = " - PT";
            } else if (nameLower.includes('david adin') || nameLower.includes('billy ford')) {
                docSuffix = " - Pain Mgmt";
            } else if (nameLower.includes('madison lynn smith') || nameLower.includes('sclafani')) {
                docSuffix = " - OT";
            } else if (nameLower.includes('chiro')) {
                docSuffix = " - Chiro";
            } else if (nameLower.includes('physical therapy') || nameLower.includes('pt')) {
                docSuffix = " - PT";
            } else if (nameLower.includes('occupational therapy') || nameLower.includes('ot')) {
                docSuffix = " - OT";
            }

            // Cleanup name string from degrees and existing suffixes
            // Remove common degree suffixes like MS, Ms. and existing specialty markers
            const cleanRaw = rawDoc
                .replace(/\s+(MS|Ms\.?|PT|OT|CHIRO|MD|DPT)$/i, '')
                .replace(/\s+-\s+(Chiro|PT|OT|CHIRO)$/i, '')
                .trim();

            const cleanDoc = docSuffix ? `${cleanRaw}${docSuffix}` : cleanRaw;

            return {
                ...c,
                doctorName: cleanDoc,
                providerName: c.providerName ? c.providerName.split(',')[0].trim() : "Unknown Provider",
                insuranceType: newIns
            };
        });

        return cleanedClaims.filter((claim) => {
            if (filters.provider && claim.doctorName !== filters.provider) return false;
            if (filters.doctor && claim.doctorName !== filters.doctor) return false;
            if (filters.insuranceType && claim.insuranceType !== filters.insuranceType) return false;
            if (filters.cptCode && !claim.cptCode.includes(filters.cptCode)) return false;
            if (filters.dateStart && claim.serviceDate < filters.dateStart) return false;
            if (filters.dateEnd && claim.serviceDate > filters.dateEnd) return false;
            return true;
        });
    }, [claims, filters]);

    return (
        <DataContext.Provider
            value={{
                claims,
                setClaims,
                isLoading,
                setIsLoading,
                filters,
                setFilters,
                filteredClaims,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}
