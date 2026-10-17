"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Check,
  Eye,
  LineChart,
} from "lucide-react";
import { DocumentItem } from "@/types/document";
import { formatBytes, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspaceStore } from "@/stores/workspace-store";
import Link from "next/link";

interface DocumentTableProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export function DocumentTable({
  documents,
  isLoading,
  onDelete,
  onRefresh: _onRefresh,
}: DocumentTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);

  const { activeDocumentId, setActiveDocument } = useWorkspaceStore();

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.company_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete filing "${name}"? This removes all vector chunks and extracted KPIs.`)) {
      setDeletingId(id);
      try {
        await onDelete(id);
        if (activeDocumentId === id) {
          setActiveDocument(null);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER BY COMPANY OR FILENAME..."
            className="pl-9 h-9 text-xs font-mono rounded-none border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF]"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "COMPLETED", "PROCESSING", "FAILED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider border-2 border-black dark:border-white transition-all cursor-pointer",
                statusFilter === status
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_#FF0000]"
                  : "bg-white dark:bg-black text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <Table>
          <TableHeader className="bg-black dark:bg-white text-white dark:text-black border-b-2 border-black dark:border-white">
            <TableRow className="bg-black dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-white border-b-2 border-black dark:border-white">
              <TableHead className="bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-black uppercase tracking-wider">
                DOCUMENT / FILING
              </TableHead>
              <TableHead className="bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-black uppercase tracking-wider">
                ENTITY
              </TableHead>
              <TableHead className="bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-black uppercase tracking-wider">
                PERIOD
              </TableHead>
              <TableHead className="bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-black uppercase tracking-wider">
                SIZE
              </TableHead>
              <TableHead className="bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-black uppercase tracking-wider">
                STATUS
              </TableHead>
              <TableHead className="bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-black uppercase tracking-wider text-right">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <TableRow key={i} className="border-b border-zinc-200 dark:border-neutral-800">
                  <TableCell colSpan={6} className="py-4">
                    <div className="h-5 bg-zinc-200 dark:bg-neutral-800 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400">
                  NO DOCUMENTS MATCHING ACTIVE FILTER CRITERIA
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => {
                const isActive = activeDocumentId === doc.id;
                return (
                  <TableRow
                    key={doc.id}
                    className={cn(
                      "border-b border-black dark:border-neutral-700 transition-colors",
                      isActive
                        ? "bg-zinc-100 dark:bg-neutral-900 border-l-4 border-l-[#FF0000]"
                        : "hover:bg-zinc-50 dark:hover:bg-neutral-950"
                    )}
                  >
                    {/* Filename & Tag */}
                    <TableCell className="py-3 font-mono text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-[#FF0000]" : "text-black dark:text-white")} />
                        <div className="min-w-0">
                          <p className="font-bold text-black dark:text-white truncate max-w-[220px]">
                            {doc.filename}
                          </p>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            ID: {doc.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Company */}
                    <TableCell className="font-mono text-xs font-bold text-black dark:text-white uppercase">
                      {doc.company_name || "—"}
                    </TableCell>

                    {/* Period */}
                    <TableCell className="font-mono text-xs text-neutral-800 dark:text-neutral-200">
                      {doc.fiscal_year ? `FY${doc.fiscal_year}` : "—"}
                      {doc.fiscal_period ? ` (${doc.fiscal_period})` : ""}
                    </TableCell>

                    {/* Size */}
                    <TableCell className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {doc.file_size_bytes ? formatBytes(doc.file_size_bytes) : "—"}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {doc.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                          <Check className="h-3 w-3 text-white dark:text-black" />
                          COMPLETED
                        </span>
                      ) : doc.status === "PROCESSING" ? (
                        <span className="inline-flex items-center gap-1 border border-black dark:border-neutral-700 bg-zinc-200 dark:bg-neutral-800 text-black dark:text-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                          <Loader2 className="h-3 w-3 animate-spin text-black dark:text-white" />
                          PARSING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-black dark:border-white bg-[#FF0000] text-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                          <AlertCircle className="h-3 w-3 text-white" />
                          {doc.status}
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Select as Active Document */}
                        <button
                          type="button"
                          onClick={() => setActiveDocument(doc)}
                          className={cn(
                            "h-7 px-2.5 inline-flex items-center justify-center border border-black dark:border-white text-[10px] font-mono font-black uppercase tracking-wider transition-colors cursor-pointer",
                            isActive
                              ? "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 shadow-[1px_1px_0px_#FF0000]"
                              : "bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                          )}
                        >
                          {isActive ? "ACTIVE" : "SET ACTIVE"}
                        </button>

                        {/* Inspect Metadata */}
                        <button
                          type="button"
                          onClick={() => setInspectDoc(doc)}
                          className="h-7 w-7 p-0 inline-flex items-center justify-center border border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-black dark:text-white transition-colors cursor-pointer"
                          title="Inspect Metadata"
                        >
                          <Eye size={14} strokeWidth={2} className="shrink-0" />
                        </button>

                        {/* Deep link to analysis */}
                        <Link
                          href="/analysis"
                          onClick={() => setActiveDocument(doc)}
                          className="h-7 w-7 p-0 inline-flex items-center justify-center border border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-black dark:text-white transition-colors cursor-pointer"
                          title="Open Analysis"
                        >
                          <LineChart size={14} strokeWidth={2} className="shrink-0" />
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="h-7 w-7 p-0 inline-flex items-center justify-center border border-black bg-white hover:bg-[#FF0000] text-black hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete Filing"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 size={14} strokeWidth={2} className="animate-spin shrink-0" />
                          ) : (
                            <Trash2 size={14} strokeWidth={2} className="shrink-0" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

      {/* Inspect Modal Drawer */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg border-2 border-black bg-white p-6 shadow-[8px_8px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                <span className="text-[#FF0000]">[ METADATA ]</span> {inspectDoc.filename}
              </h3>
              <button
                onClick={() => setInspectDoc(null)}
                className="border border-black bg-black text-white px-2 py-0.5 text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-200 pb-1">
                <span className="text-zinc-600 uppercase">DOCUMENT ID:</span>
                <span className="text-black font-bold select-all">{inspectDoc.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-1">
                <span className="text-zinc-600 uppercase">COMPANY:</span>
                <span className="text-black font-bold">{inspectDoc.company_name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-1">
                <span className="text-zinc-600 uppercase">FISCAL YEAR:</span>
                <span className="text-black font-bold">{inspectDoc.fiscal_year || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-1">
                <span className="text-zinc-600 uppercase">PERIOD:</span>
                <span className="text-black font-bold">{inspectDoc.fiscal_period || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-1">
                <span className="text-zinc-600 uppercase">STATUS:</span>
                <span className="text-black font-bold">{inspectDoc.status}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-1">
                <span className="text-zinc-600 uppercase">FILE SIZE:</span>
                <span className="text-black font-bold">{inspectDoc.file_size_bytes ? formatBytes(inspectDoc.file_size_bytes) : "N/A"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setInspectDoc(null)}
                className="bg-black text-white hover:bg-black/90 rounded-none border border-black font-black uppercase text-xs px-5 shadow-[2px_2px_0px_#000000]"
              >
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
