"use client"

import React, { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import { useData, Claim } from "@/context/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, CheckCircle2, AlertCircle, Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
    const { setClaims, setIsLoading } = useData()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const processWorkbook = (workbook: XLSX.WorkBook) => {
        const groupedClaimsMap = new Map<string, Claim>()

        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const json = XLSX.utils.sheet_to_json(worksheet, {
                defval: "",
                raw: true
            }) as Record<string, unknown>[]

            json.forEach((row, index) => {
                const getVal = (possibleKeys: string[]) => {
                    const keys = Object.keys(row).filter((k) =>
                        possibleKeys.some((pk) => k.toLowerCase().includes(pk.toLowerCase()))
                    )
                    for (const k of keys) {
                        const val = row[k]
                        if (val !== undefined && val !== null && String(val).trim() !== "") return val
                    }
                    return keys.length > 0 ? row[keys[0]] : ""
                }

                const claimId = String(getVal(["claim id", "claim #", "claim number"]) || "")
                const providerName = String(getVal(["service location", "location", "service provider", "provider"]) || "").split(',')[0].trim()
                const doctorName = String(getVal(["attending physician", "attending", "doctor", "physician"]) || "").split(',')[0].trim()
                const insuranceCompany = String(getVal(["insurance company", "company", "insurance name"]) || "")
                const insuranceType = String(getVal(["insurance category", "category", "insurance type", "payer", "plan"]) || "")
                const cptCode = String(getVal(["cpt codes", "cpt code", "cpt", "procedure", "hcpcs"]) || "")
                const serviceDateRaw = getVal(["dos", "service date", "date", "service"])
                const claimSentDateRaw = getVal(["claim date", "claim sent date", "claim sent", "sent date", "billed date"])
                const billedAmtRaw = getVal(["billed amount", "billed amt", "billed", "charge", "charges"])
                const paidAmtRaw = getVal(["total payments", "total payment", "paid amt", "paid amount", "payment", "paid"])
                const claimStatus = getVal(["status", "claim status", "report", "deductible", "payment status"])
                const arbFlagRaw = getVal(["arb", "arbitration"])

                if (!providerName && !doctorName && !cptCode && !claimId && !insuranceCompany) return

                const parseDate = (raw: unknown) => {
                    if (!raw) return null
                    if (typeof raw === "number") return new Date(Math.round((raw - 25569) * 86400 * 1000))
                    return new Date(raw as string)
                }

                const serviceDate = parseDate(serviceDateRaw) || new Date()
                const claimSentDate = parseDate(claimSentDateRaw)

                let isDeni = false
                let foundPaid = false
                let foundDeductible = false
                let foundLop = false
                let foundPending = false
                let foundMaxLimit = false
                const arbFlagStr = String(arbFlagRaw || "").toLowerCase()
                let isArb = arbFlagStr === "yes" || arbFlagStr === "true" || arbFlagRaw === 1

                for (const val of Object.values(row)) {
                    const strVal = String(val).toLowerCase()
                    if (strVal.includes("deni")) isDeni = true
                    if (strVal.includes("paid")) foundPaid = true
                    if (strVal.includes("towards deductible") || strVal.includes("towards ded") || strVal.includes("self pay") || strVal.includes("self-pay") || strVal.includes("selfpay") || strVal.includes("patient responsibility")) foundDeductible = true
                    if (strVal === "lop" || strVal.includes("lop ") || strVal.includes(" lop")) foundLop = true
                    if (strVal.includes("under arbitration") || strVal.includes("arb")) isArb = true
                    if (strVal.includes("in process") || strVal.includes("pending")) foundPending = true
                    if (strVal.includes("maximum limit") || strVal.includes("reached maximum limit") || strVal.includes("not covered under patient plan") || strVal.includes("not covered")) foundMaxLimit = true
                }

                let stdStatus = String(claimStatus || "Unknown")
                if (isDeni) stdStatus = "Denied"
                else if (foundPaid) stdStatus = "Paid"
                else if (foundMaxLimit) stdStatus = "Max Limit"
                else if (foundDeductible) stdStatus = "Deductible"
                else if (isArb) stdStatus = "Arbitration"
                else if (foundLop) stdStatus = "LOP"
                else if (foundPending) stdStatus = "Pending"

                const uniqueId = claimId && !claimId.startsWith("CLM-UNKNOWN") ? claimId : `${sheetName}-${index}`
                const billedAmt = parseFloat(String(billedAmtRaw).replace(/[^0-9.-]/g, '')) || 0
                const paidAmt = parseFloat(String(paidAmtRaw).replace(/[^0-9.-]/g, '')) || 0

                if (groupedClaimsMap.has(uniqueId)) {
                    const existing = groupedClaimsMap.get(uniqueId)!
                    const existingCpts = existing.cptCode.split(',').map(c => c.trim()).filter(c => c && c !== "N/A")
                    const newCpts = cptCode.split(',').map(c => c.trim()).filter(c => c && c !== "N/A")
                    newCpts.forEach(c => { if (!existingCpts.includes(c)) existingCpts.push(c) })
                    existing.cptCode = existingCpts.join(", ") || "N/A"
                    existing.billedAmt = (existing.billedAmt || 0) + billedAmt
                    existing.paidAmt = (existing.paidAmt || 0) + paidAmt

                    const statusPriority = (s: string) => {
                        const low = s.toLowerCase()
                        if (low === 'denied') return 10
                        if (low === 'paid') return 9
                        if (low === 'max limit') return 8
                        if (low === 'deductible') return 7
                        if (low === 'arbitration') return 6
                        if (low === 'lop') return 5
                        if (low === 'pending') return 4
                        return 0
                    }

                    if (statusPriority(stdStatus) > statusPriority(existing.claimStatus)) {
                        existing.claimStatus = stdStatus
                        existing.paymentStatus = stdStatus
                    }
                    if (isArb) existing.arbFlag = true
                    if (isDeni) existing.denialIndicator = true
                } else {
                    groupedClaimsMap.set(uniqueId, {
                        id: `${sheetName}-${index}-${Math.random().toString(36).substring(2, 11)}`,
                        claimId: uniqueId,
                        providerName: providerName || "Unknown Provider",
                        doctorName: doctorName || "Unknown Doctor",
                        cptCode: cptCode || "N/A",
                        insuranceCompany: insuranceCompany || "Unknown Company",
                        insuranceType: insuranceType || "Unknown Insurance",
                        payerId: String(getVal(["payer edi id", "payer edi", "payer id", "payer #", "payer number"]) || ""),
                        patientName: String(getVal(["patient", "patient name", "subscriber"]) || "Unknown Patient"),
                        serviceDate,
                        claimSentDate,
                        billedAmt,
                        paidAmt,
                        claimStatus: stdStatus,
                        paymentStatus: stdStatus,
                        arbFlag: isArb,
                        denialIndicator: isDeni,
                    })
                }
            })
        })

        const allClaims = Array.from(groupedClaimsMap.values())
        if (allClaims.length > 0) {
            setClaims(allClaims)
            setSuccess(`Successfully loaded ${allClaims.length} records across ${workbook.SheetNames.length} sheets.`)
            setTimeout(() => {
                router.push("/")
            }, 2000)
        } else {
            setError("No valid claim records found in the uploaded file.")
        }
    }

    const loadDummyData = async () => {
        setIsLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const res = await fetch('/dummy_claims.xlsx')
            if (!res.ok) throw new Error("Could not fetch dummy file.")
            const arrayBuffer = await res.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer, { type: "array" })
            processWorkbook(workbook)
        } catch (err: unknown) {
            console.error(err)
            const msg = err instanceof Error ? err.message : String(err)
            setError("Error loading dummy data: " + msg)
        } finally {
            setIsLoading(false)
        }
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                processWorkbook(workbook)
            } catch (err: unknown) {
                console.error(err)
                const msg = err instanceof Error ? err.message : String(err)
                setError("Error parsing the Excel file. " + msg)
            } finally {
                setIsLoading(false)
            }
        }

        reader.readAsArrayBuffer(file)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setClaims, setIsLoading, router])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
            "text/csv": [".csv"],
        },
        maxFiles: 1,
    })

    return (
        <div className="p-6 max-w-4xl mx-auto mt-10">
            <Card className="shadow-lg border-0 bg-card">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-bold tracking-tight">Upload Medical Claims</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Upload your Excel spreadsheet (.xlsx, .xls) or CSV file containing claim-level data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="mt-6">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300 ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="mx-auto flex justify-center mb-6">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileSpreadsheet className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        {isDragActive ? (
                            <p className="text-xl font-medium text-primary">Drop the file here ...</p>
                        ) : (
                            <div>
                                <p className="text-xl font-medium mb-2">Drag & drop your file here</p>
                                <p className="text-muted-foreground">or click to browse your files</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mt-6 p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5" />
                            <p className="font-medium">{success}</p>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col items-center border-t pt-8">
                        <p className="text-sm text-muted-foreground mb-4">Or try out the application with generated sample data</p>
                        <Button onClick={loadDummyData} variant="secondary" className="gap-2">
                            <Wand2 className="h-4 w-4" />
                            Load Dummy Data
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
