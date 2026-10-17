"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { healthService } from "@/lib/services/health-service";
import { documentService } from "@/lib/services/document-service";
import { AuditTelemetryTable } from "@/components/audit/audit-telemetry-table";
import { ErrorCatalogTable } from "@/components/audit/error-catalog-table";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuditPage() {
  const {
    data: healthData,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const t0 = performance.now();
      const res = await healthService.getHealth();
      const latency = Math.round(performance.now() - t0);
      return { ...res, probeLatency: latency };
    },
    refetchInterval: 15000,
  });

  const {
    data: docsData,
    refetch: refetchDocs,
    isFetching: isFetchingDocs,
  } = useQuery({
    queryKey: ["documents-list"],
    queryFn: () => documentService.listDocuments(1, 100),
  });

  const documents = docsData?.items || [];

  const handleRefresh = () => {
    refetchDocs();
    refetchHealth();
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header Banner */}
        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 sm:p-8 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#FFFFFF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#FF0000]" />
                <span className="text-xs font-mono font-bold tracking-widest text-[#FF0000] uppercase">
                  [ 05 / GOVERNANCE ] SYSTEM OBSERVABILITY
                </span>
                <span className="h-4 w-px bg-black dark:bg-white" />
                <span className="text-xs font-mono font-bold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                  PIPELINE PROVENANCE
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black dark:text-white leading-none mb-2">
                TELEMETRY &amp; <span className="stroke-text-thick">AUDIT LOGS</span>
              </h1>
              <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 uppercase">
                REAL-TIME MONITORING OF PIPELINE EXECUTION TRACES, VECTOR RETRIEVALS, AND ERROR SPECIFICATIONS
              </p>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isFetchingDocs}
              variant="outline"
              size="sm"
              className="border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#FFFFFF] gap-2 px-4 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetchingDocs && "animate-spin")} />
              <span>REFRESH LOGS</span>
            </Button>
          </div>
        </div>

        {/* 1. Audit & Pipeline Execution Traces */}
        <AuditTelemetryTable documents={documents} />

        {/* 2. Standardized Error Catalog */}
        <ErrorCatalogTable />
      </div>
    </AppLayout>
  );
}
