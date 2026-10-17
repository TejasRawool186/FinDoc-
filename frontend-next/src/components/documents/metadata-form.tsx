"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Calendar, Clock, Loader2, ArrowRight } from "lucide-react";

interface MetadataFormProps {
  selectedFile: File | null;
  onSubmit: (metadata: {
    company_name?: string;
    fiscal_year?: number;
    fiscal_period?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const COMMON_COMPANIES = [
  "Reliance Industries",
  "Tata Consultancy Services",
  "Infosys Ltd",
  "HDFC Bank",
  "Tata Motors",
  "ICICI Bank",
];

export function MetadataForm({
  selectedFile,
  onSubmit,
  isLoading,
}: MetadataFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [fiscalYear, setFiscalYear] = useState<number>(2024);
  const [fiscalPeriod, setFiscalPeriod] = useState("Annual");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    await onSubmit({
      company_name: companyName.trim() || undefined,
      fiscal_year: fiscalYear || undefined,
      fiscal_period: fiscalPeriod || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border-b-2 border-black dark:border-white pb-2 flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-black dark:text-white flex items-center gap-2">
          <span className="text-[#FF0000]">[ 02 / METADATA ]</span> CORPUS METRIC SPECIFICATION
        </h4>
        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">REQUIRED FOR RAG NORMALIZATION</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Company Name */}
        <div className="sm:col-span-1 space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-black dark:text-white" />
            Company Name
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Reliance Industries"
            disabled={isLoading}
            className="rounded-none border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-xs font-mono placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF]"
          />
        </div>

        {/* Fiscal Year */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-black dark:text-white" />
            Fiscal Year
          </label>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            disabled={isLoading}
            className="flex h-9 w-full rounded-none border-2 border-black dark:border-white bg-white dark:bg-black px-3 py-1.5 text-xs font-mono font-bold text-black dark:text-white focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] cursor-pointer"
          >
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
              <option key={yr} value={yr} className="bg-white dark:bg-black text-black dark:text-white font-mono">
                FY {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Fiscal Period */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-black dark:text-white" />
            Period / Scope
          </label>
          <select
            value={fiscalPeriod}
            onChange={(e) => setFiscalPeriod(e.target.value)}
            disabled={isLoading}
            className="flex h-9 w-full rounded-none border-2 border-black dark:border-white bg-white dark:bg-black px-3 py-1.5 text-xs font-mono font-bold text-black dark:text-white focus:outline-none shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] cursor-pointer"
          >
            <option value="Annual" className="bg-white dark:bg-black text-black dark:text-white font-mono">Annual (Full Year 10-K)</option>
            <option value="Q1" className="bg-white dark:bg-black text-black dark:text-white font-mono">Q1 (First Quarter)</option>
            <option value="Q2" className="bg-white dark:bg-black text-black dark:text-white font-mono">Q2 (Second Quarter / H1)</option>
            <option value="Q3" className="bg-white dark:bg-black text-black dark:text-white font-mono">Q3 (Third Quarter / 9M)</option>
            <option value="Q4" className="bg-white dark:bg-black text-black dark:text-white font-mono">Q4 (Fourth Quarter)</option>
          </select>
        </div>
      </div>

      {/* Quick Select Company Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mr-1">
          SUGGESTIONS:
        </span>
        {COMMON_COMPANIES.map((company) => (
          <button
            key={company}
            type="button"
            onClick={() => setCompanyName(company)}
            disabled={isLoading}
            className="border border-black dark:border-white bg-white dark:bg-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF]"
          >
            {company}
          </button>
        ))}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF0000] hover:text-white dark:hover:bg-[#FF0000] dark:hover:text-white rounded-none border-2 border-black dark:border-white font-black uppercase tracking-wider text-xs px-8 py-3 shadow-[4px_4px_0px_#FF0000] gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#FF0000]" />
              <span>INGESTING &amp; VECTORIZING...</span>
            </>
          ) : (
            <>
              <span>START EXTRACTION &amp; VECTOR PIPELINE</span>
              <ArrowRight className="h-4 w-4 text-[#FF0000]" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
