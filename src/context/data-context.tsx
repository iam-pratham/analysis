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
        const cleanedClaims = claims.map(c => ({
            ...c,
            doctorName: c.doctorName ? c.doctorName.split(',')[0].trim() : "Unknown Doctor",
            providerName: c.providerName ? c.providerName.split(',')[0].trim() : "Unknown Provider"
        }))

        return cleanedClaims.filter((claim) => {
            if (filters.provider && claim.doctorName !== filters.provider) return false;
            if (filters.doctor && claim.doctorName !== filters.doctor) return false;
            if (filters.insuranceType && claim.insuranceType !== filters.insuranceType) return false;
            if (filters.cptCode && !claim.cptCode.includes(filters.cptCode)) return false;
            if (filters.dateStart && claim.serviceDate < filters.dateStart) return false;
            if (filters.dateEnd && claim.serviceDate > filters.dateEnd) return false;
            return true;
        }).map(claim => {
            // Apply naming fixes according to user request
            let newIns = claim.insuranceType;
            if (newIns?.toLowerCase().includes("workers compensation") || newIns?.toLowerCase().includes("worker\'s compensation") || newIns?.toLowerCase() === "wc") {
                newIns = "WC";
            } else if (newIns?.toLowerCase() === "medicaid" || newIns?.toLowerCase() === "lop") {
                newIns = "LOP";
            } else if (newIns?.toLowerCase().includes("motor vehicle") || newIns?.toLowerCase() === "mva") {
                newIns = "MVA";
            }
            return {
                ...claim,
                insuranceType: newIns
            }
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
