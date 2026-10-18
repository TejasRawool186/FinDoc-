"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { BookOpen, Search } from "lucide-react";

const ERROR_CATALOG = [
  {
    code: "DOC_001",
    domain: "Document Processing",
    description: "File not found or inaccessible in storage path.",
    remediation: "Verify upload directory permissions and file persistence volume.",
    severity: "destructive" as const,
  },
  {
    code: "DOC_002",
    domain: "Document Processing",
    description: "Unsupported file extension or corrupted magic bytes (supported: PDF, CSV, XLSX, XLS).",
    remediation: "Upload a valid PDF (%PDF-1.x) or spreadsheet file under 50MB.",
    severity: "warning" as const,
  },
  {
    code: "DOC_003",
    domain: "Document Processing",
    description: "Payload size exceeds maximum allowed boundary of 50MB.",
    remediation: "Compress file or split into multi-part financial statements.",
    severity: "warning" as const,
  },
  {
    code: "RAG_001",
    domain: "Vector RAG",
    description: "Zero context chunks found above 0.45 similarity threshold.",
    remediation: "Rephrase query using standard financial terminology or adjust top_k.",
    severity: "secondary" as const,
  },
  {
    code: "RAG_002",
    domain: "Vector RAG",
    description: "LLM inference timeout or hybrid failover trigger.",
    remediation: "Check OpenAI API quota or ensure local Ollama daemon is running.",
    severity: "destructive" as const,
  },
  {
    code: "ANA_001",
    domain: "Financial Analytics",
    description: "Required financial line item missing for ratio formula calculation.",
    remediation: "Inspect statement tables in Source Chunk Drawer or verify Ind AS disclosures.",
    severity: "secondary" as const,
  },
  {
    code: "DB_001",
    domain: "Database",
    description: "PostgreSQL connection pool exhausted or pgvector index locked.",
    remediation: "Review max_connections pool settings in core/database.py.",
    severity: "destructive" as const,
  },
];

export function ErrorCatalogTable() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredErrors = ERROR_CATALOG.filter(
    (e) =>
      e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black dark:border-white pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#FF0000]" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              <span className="text-[#FF0000]">[ 03 / CATALOG ]</span> ERROR &amp; FAULT ISOLATION SPECIFICATION
            </h4>
            <p className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 uppercase mt-0.5">
              STANDARDIZED ERROR CODES, FAILURE DOMAINS, AND REMEDIATION ACTIONS
            </p>
          </div>
        </div>

        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <Input
            placeholder="SEARCH ERROR CODE OR DOMAIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-xs font-mono uppercase rounded-none border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white shadow-[1px_1px_0px_#000000] dark:shadow-[1px_1px_0px_#FFFFFF]"
          />
        </div>
      </div>

      <Table>
        <TableHeader className="bg-black dark:bg-white text-white dark:text-black border-b-2 border-black dark:border-white">
          <TableRow className="bg-black dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-white border-b-2 border-black dark:border-white">
            <TableHead className="bg-black dark:bg-white text-white dark:text-black font-mono font-black text-[11px] uppercase tracking-wider w-28">
              CODE
            </TableHead>
            <TableHead className="bg-black dark:bg-white text-white dark:text-black font-mono font-black text-[11px] uppercase tracking-wider w-48">
              DOMAIN
            </TableHead>
            <TableHead className="bg-black dark:bg-white text-white dark:text-black font-mono font-black text-[11px] uppercase tracking-wider">
              DESCRIPTION &amp; ROOT CAUSE
            </TableHead>
            <TableHead className="bg-black dark:bg-white text-white dark:text-black font-mono font-black text-[11px] uppercase tracking-wider">
              AUDITOR REMEDIATION ACTION
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-200 dark:divide-neutral-800 text-xs font-mono">
          {filteredErrors.map((item) => (
            <TableRow key={item.code} className="hover:bg-zinc-100 dark:hover:bg-neutral-900 transition-colors border-b border-black dark:border-neutral-800">
              <TableCell className="font-mono font-black text-[#FF0000]">
                {item.code}
              </TableCell>
              <TableCell className="font-bold text-black dark:text-white uppercase">
                {item.domain}
              </TableCell>
              <TableCell className="text-black dark:text-white uppercase leading-relaxed">
                {item.description}
              </TableCell>
              <TableCell className="text-neutral-600 dark:text-neutral-400 uppercase text-[11px] leading-relaxed">
                {item.remediation}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
