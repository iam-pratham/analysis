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
    cptDetails?: { cpt: string; billed: number; paid: number }[];
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
    month: string | null;
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
        month: null,
        dateStart: null,
        dateEnd: null,
    });

    const filteredClaims = React.useMemo(() => {
        const cleanedClaims = claims.map(c => {
            // Apply naming fixes according to user request
            let newIns = c.insuranceType;
            const insLower = (newIns || "").toLowerCase();
            const compLower = (c.insuranceCompany || "").toLowerCase();

            if (
                insLower.includes("workers compensation") ||
                insLower.includes("worker's compensation") ||
                insLower === "wc" ||
                insLower.includes("motor vehicle") ||
                insLower === "mva" ||
                insLower === "mva/wc" ||
                insLower === "mva / wc" ||
                insLower.includes("mva/wc") ||
                insLower.includes("mva / wc") ||
                insLower.includes("mva oc") ||
                compLower.includes("nj manufactur") ||
                compLower.includes("njm") ||
                compLower.includes("geico")
            ) {
                newIns = "MVA/WC";
            } else if (insLower === "medicaid" || insLower === "lop" || compLower.includes("friedland")) {
                newIns = "LOP";
            } else if (
                insLower.includes("commercial") || 
                insLower.includes("health") || 
                compLower.includes("horizon") || 
                compLower.includes("umr")
            ) {
                newIns = "Commercial";
            } else if (insLower.includes("medicare")) {
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

            const cleanCptCode = String(c.cptCode || "")
                .split(',')
                .map(s => s.replace(/\s+total$/i, '').trim())
                .filter(s => s && s.toUpperCase() !== "INPT")
                .join(', ');

            const cleanCptDetails = c.cptDetails ? c.cptDetails
                .map(d => ({ ...d, cpt: (d.cpt || "").replace(/\s+total$/i, '').trim() }))
                .filter(d => d.cpt && d.cpt.toUpperCase() !== "INPT") : undefined;

            return {
                ...c,
                doctorName: cleanDoc,
                providerName: c.providerName ? c.providerName.split(',')[0].trim() : "Unknown Provider",
                insuranceType: newIns,
                cptCode: cleanCptCode,
                cptDetails: cleanCptDetails
            };
        });

        return cleanedClaims.filter((claim) => {
            if (filters.provider && claim.doctorName !== filters.provider) return false;
            if (filters.doctor && claim.doctorName !== filters.doctor) return false;
            if (filters.insuranceType && claim.insuranceType !== filters.insuranceType) return false;
            if (filters.cptCode && !claim.cptCode.includes(filters.cptCode)) return false;
            if (filters.dateStart && claim.serviceDate < filters.dateStart) return false;
            if (filters.dateEnd && claim.serviceDate > filters.dateEnd) return false;
            if (filters.month) {
                if (!claim.serviceDate) return false;
                const d = new Date(claim.serviceDate);
                if (!isNaN(d.getTime())) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (monthKey !== filters.month) return false;
                } else {
                    return false;
                }
            }
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
