"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { graphService, SubgraphResponse, SubgraphNode, SubgraphLink } from "@/lib/services/graph-service";
import {
  Network,
  Activity,
  Zap,
  Terminal,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Search,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Share2,
  Info,
  Code2,
} from "lucide-react";

export default function KnowledgeGraphPage() {
  const { activeDocument } = useWorkspaceStore();
  const [companyName, setCompanyName] = useState<string>(
    activeDocument?.company_name || "Tesla Inc"
  );
  const [subgraph, setSubgraph] = useState<SubgraphResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<"healthy" | "unreachable" | "checking">("checking");
  const [activeTab, setActiveTab] = useState<"topology" | "algorithms" | "console">("topology");
  const [viewMode, setViewMode] = useState<"visual" | "grid">("visual");

  // Selection & Filter states
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Algorithm states
  const [algoResults, setAlgoResults] = useState<any[] | null>(null);
  const [algoLoading, setAlgoLoading] = useState<boolean>(false);
  const [algoLatency, setAlgoLatency] = useState<number | null>(null);

  // Cypher console states
  const [cypherQuery, setCypherQuery] = useState<string>(
    "MATCH (rf:RiskFactor)-[:THREATENS]->(li)-[:FEEDS_RATIO]->(fr) RETURN rf.category, li.canonical_name, fr.name, fr.value LIMIT 10"
  );
  const [consoleResult, setConsoleResult] = useState<any | null>(null);
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeDocument?.company_name) {
      setCompanyName(activeDocument.company_name);
    }
  }, [activeDocument]);

  // Load health & subgraph data
  const fetchData = async (targetCompany: string) => {
    setLoading(true);
    try {
      const health = await graphService.checkHealth();
      setHealthStatus(health.status === "healthy" ? "healthy" : "unreachable");
    } catch {
      setHealthStatus("unreachable");
    }

    if (targetCompany.trim()) {
      try {
        const data = await graphService.getSubgraph(targetCompany.trim());
        setSubgraph(data);
        if (data.nodes.length > 0 && !selectedNodeId) {
          setSelectedNodeId(data.nodes[0].id);
        }
      } catch (err) {
        console.error("Subgraph fetch error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setSubgraph(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(companyName);
  }, [companyName]);

  // Execute PageRank / Risk Centrality
  const handleRunPageRank = async () => {
    setAlgoLoading(true);
    const t0 = performance.now();
    try {
      const res = await graphService.getRiskPageRank(companyName);
      setAlgoLatency(Math.round(performance.now() - t0));
      setAlgoResults((res as any)?.ranked_systemic_risks || []);
    } catch (err) {
      console.error("PageRank error:", err);
    } finally {
      setAlgoLoading(false);
    }
  };

  // Run Cypher Console Query
  const handleRunConsole = async () => {
    setConsoleLoading(true);
    try {
      const res = await graphService.queryGraph({
        query: cypherQuery,
        company_name: companyName,
      });
      setConsoleResult(res);
    } catch (err) {
      setConsoleResult({ error: String(err) });
    } finally {
      setConsoleLoading(false);
    }
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!subgraph?.nodes) return [];
    return subgraph.nodes.filter((node) => {
      const matchesGroup = selectedGroup === "ALL" || node.group === selectedGroup;
      const matchesSearch =
        searchQuery === "" ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.group.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [subgraph, selectedGroup, searchQuery]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !subgraph?.nodes) return null;
    return subgraph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, subgraph]);

  // Connected links for selected node
  const connectedLinks = useMemo(() => {
    if (!selectedNodeId || !subgraph?.links) return [];
    return subgraph.links.filter(
      (link) => link.source === selectedNodeId || link.target === selectedNodeId
    );
  }, [selectedNodeId, subgraph]);

  // SVG Topology Layout calculation
  const svgLayout = useMemo(() => {
    if (!subgraph?.nodes || subgraph.nodes.length === 0) return null;

    const width = 860;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;

    const coords: Record<string, { x: number; y: number }> = {};

    // Group nodes
    const companies = subgraph.nodes.filter((n) => n.group === "Company");
    const years = subgraph.nodes.filter((n) => n.group === "FiscalYear");
    const statements = subgraph.nodes.filter((n) => n.group === "Statement");
    const lineItems = subgraph.nodes.filter((n) => n.group === "LineItem");
    const ratios = subgraph.nodes.filter((n) => n.group === "Ratio");
    const risks = subgraph.nodes.filter((n) => n.group === "Risk");

    // Center company
    companies.forEach((c) => {
      coords[c.id] = { x: centerX, y: centerY };
    });

    // Years & Statements placed to the left
    years.forEach((y, i) => {
      coords[y.id] = { x: centerX - 180, y: centerY - 60 + i * 80 };
    });
    statements.forEach((s, i) => {
      coords[s.id] = { x: centerX - 320, y: centerY - 80 + i * 70 };
    });

    // Risks placed to the top
    risks.forEach((r, i) => {
      const step = (width - 240) / Math.max(risks.length, 1);
      coords[r.id] = { x: 120 + i * step + step / 2, y: 70 };
    });

    // Line items placed on right middle
    lineItems.forEach((li, i) => {
      const count = Math.max(lineItems.length, 1);
      const angle = -Math.PI / 3 + (i / count) * (2 * Math.PI / 3);
      coords[li.id] = {
        x: centerX + 180 + Math.cos(angle) * 80,
        y: centerY - 100 + (i / count) * 260,
      };
    });

    // Ratios placed on the far right / bottom
    ratios.forEach((ra, i) => {
      const count = Math.max(ratios.length, 1);
      coords[ra.id] = {
        x: width - 130,
        y: 110 + (i / count) * 280,
      };
    });

    return { width, height, coords };
  }, [subgraph]);

  // Group Color / Style helper
  const getGroupBadgeClass = (group: string) => {
    switch (group) {
      case "Company":
        return "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white";
      case "FiscalYear":
        return "bg-blue-600 text-white border-blue-600";
      case "Statement":
        return "bg-purple-600 text-white border-purple-600";
      case "LineItem":
        return "bg-emerald-600 text-white border-emerald-600";
      case "Ratio":
        return "bg-amber-500 text-black border-amber-500";
      case "Risk":
        return "bg-[#FF0000] text-white border-[#FF0000]";
      default:
        return "bg-neutral-800 text-white border-neutral-700";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* ── 1. Monumental Exaggerated Minimalist Header ── */}
        <div className="border-b-2 border-black dark:border-white pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-xs font-mono font-black uppercase tracking-widest text-[#FF0000]">
                  [ 07 / KNOWLEDGE GRAPH ]
                </span>
                <span className="h-4 w-px bg-black dark:bg-white" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  FALKORDB CONTEXT LAYER FOR AI AGENTS
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
                Graph Intelligence &amp; Multi-Hop Traversal
              </h1>
              <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300 mt-2 max-w-3xl">
                Multi-hop relational reasoning across corporate financial statements, Ind AS metric lineage, causal risk contagion tracing, and topological graph algorithms.
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* FalkorDB Live Status */}
              <div className="flex items-center gap-2.5 px-3 py-2 border border-black dark:border-white bg-white dark:bg-black font-mono text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF]">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    healthStatus === "healthy"
                      ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"
                      : "bg-[#FF0000]"
                  }`}
                />
                <span className="font-bold text-black dark:text-white">
                  FalkorDB: {healthStatus === "healthy" ? "ONLINE" : "UNREACHABLE"}
                </span>
              </div>

              {/* Corporation Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] focus:outline-none"
                >
                  <option value="Tesla Inc">Tesla Inc (TSLA)</option>
                  <option value="Tata Motors">Tata Motors (TATAMOTORS)</option>
                  <option value="Reliance Industries">Reliance Industries (RELIANCE)</option>
                  {activeDocument?.company_name &&
                    !["Tesla Inc", "Tata Motors", "Reliance Industries"].includes(activeDocument.company_name) && (
                      <option value={activeDocument.company_name}>
                        {activeDocument.company_name} (Current Upload)
                      </option>
                    )}
                </select>

                <button
                  onClick={() => fetchData(companyName)}
                  disabled={loading}
                  className="px-3 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white dark:hover:bg-[#FF0000] dark:hover:text-white transition-all cursor-pointer shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF]"
                  title="Refresh Graph Data"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Top Metric Cards ── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Target Entity */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF0000] block mb-1">
                [ 01 / TARGET ENTITY ]
              </span>
              <div className="text-xl font-black uppercase text-black dark:text-white truncate">
                {companyName || "No Company"}
              </div>
              <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mt-1">
                Primary Root Node
              </p>
            </div>

            {/* Card 2: Connected Nodes */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black dark:text-neutral-400 block mb-1">
                [ 02 / GRAPH NODES ]
              </span>
              <div className="text-2xl font-black text-black dark:text-white">
                {subgraph?.nodes.length ?? 0}
              </div>
              <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mt-1">
                Statements, Items, Ratios &amp; Risks
              </p>
            </div>

            {/* Card 3: Relational Edges */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black dark:text-neutral-400 block mb-1">
                [ 03 / MULTI-HOP EDGES ]
              </span>
              <div className="text-2xl font-black text-[#FF0000]">
                {subgraph?.links.length ?? 0}
              </div>
              <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mt-1">
                Directed Causal &amp; Reporting Edges
              </p>
            </div>

            {/* Card 4: Graph Engine */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black dark:text-neutral-400 block mb-1">
                [ 04 / ENGINE ]
              </span>
              <div className="text-xl font-black uppercase text-black dark:text-white">
                FalkorDB In-Memory
              </div>
              <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mt-1">
                Cypher 9.0 • HNSW Linear-Algebra
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. High-Contrast Neo-Brutalist Tabs ── */}
        <div className="flex flex-wrap border-b-2 border-black dark:border-white gap-2">
          <button
            onClick={() => setActiveTab("topology")}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-b-0 ${
              activeTab === "topology"
                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white translate-y-[2px]"
                : "bg-white dark:bg-black text-black dark:text-white border-transparent hover:border-black dark:hover:border-white"
            }`}
          >
            [ 01 ] Graph Topology Explorer
          </button>
          <button
            onClick={() => setActiveTab("algorithms")}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-b-0 ${
              activeTab === "algorithms"
                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white translate-y-[2px]"
                : "bg-white dark:bg-black text-black dark:text-white border-transparent hover:border-black dark:hover:border-white"
            }`}
          >
            [ 02 ] Graph Algorithms &amp; Risk Contagion
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-b-0 ${
              activeTab === "console"
                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white translate-y-[2px]"
                : "bg-white dark:bg-black text-black dark:text-white border-transparent hover:border-black dark:hover:border-white"
            }`}
          >
            [ 03 ] Live Cypher Query Console
          </button>
        </div>

        {/* ── TAB 1: TOPOLOGY EXPLORER ── */}
        {activeTab === "topology" && (
          <div className="space-y-6">
            {/* Visual Graph View / Controls Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-black uppercase text-black dark:text-white mr-2">
                  Filter Nodes:
                </span>
                {["ALL", "Company", "Statement", "LineItem", "Ratio", "Risk"].map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-3 py-1 text-xs font-mono uppercase font-bold border cursor-pointer transition-all ${
                      selectedGroup === group
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                        : "bg-white dark:bg-black text-black dark:text-white border-black dark:border-neutral-700 hover:border-[#FF0000]"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search in graph */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search node..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-black dark:border-white bg-white dark:bg-black text-xs font-mono text-black dark:text-white focus:outline-none"
                  />
                </div>

                {/* View Mode Switcher */}
                <div className="flex border border-black dark:border-white">
                  <button
                    onClick={() => setViewMode("visual")}
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                      viewMode === "visual"
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-white dark:bg-black text-black dark:text-white"
                    }`}
                    title="Interactive Topology Map"
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-white dark:bg-black text-black dark:text-white"
                    }`}
                    title="Entities & Links Tables"
                  >
                    Tables
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State warning if 0 nodes returned */}
            {(!subgraph || subgraph.nodes.length === 0) && !loading && (
              <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-10 text-center space-y-4 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
                <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-black dark:border-white bg-[#FF0000] text-white">
                  <Network className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black uppercase text-black dark:text-white">
                  No Knowledge Graph Nodes Found for {companyName}
                </h3>
                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                  The in-memory FalkorDB database currently holds no entity relations for this corporate title. Ingest a financial document or seed the sample test dataset.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCompanyName("Tesla Inc")}
                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#FF0000] hover:text-white transition-all cursor-pointer shadow-[3px_3px_0px_#FF0000]"
                  >
                    Load Seeded Test Corporation (Tesla Inc) →
                  </button>
                </div>
              </div>
            )}

            {/* VISUAL SVG TOPOLOGY CANVAS */}
            {viewMode === "visual" && subgraph && subgraph.nodes.length > 0 && svgLayout && (
              <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
                <div className="flex items-center justify-between mb-4 border-b border-black/20 dark:border-white/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black uppercase text-black dark:text-white">
                      [ VISUAL TOPOLOGY CANVAS ]
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      Click any node to view entity properties and multi-hop relationships
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-black dark:bg-white" /> Company
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Line Items
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Ratios
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#FF0000]" /> Risks
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgLayout.width} ${svgLayout.height}`}
                    className="w-full min-w-[760px] h-[480px] bg-neutral-50 dark:bg-neutral-950 border border-black dark:border-neutral-800"
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="18"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#888888" />
                      </marker>
                      <marker
                        id="arrow-red"
                        viewBox="0 0 10 10"
                        refX="18"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF0000" />
                      </marker>
                    </defs>

                    {/* Links */}
                    {subgraph.links.map((link, idx) => {
                      const src = svgLayout.coords[link.source];
                      const tgt = svgLayout.coords[link.target];
                      if (!src || !tgt) return null;

                      const isSelected =
                        selectedNodeId === link.source || selectedNodeId === link.target;
                      const isRisk = link.relation === "THREATENS" || link.relation === "EXPOSED_TO";

                      return (
                        <g key={idx}>
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke={isSelected ? "#FF0000" : isRisk ? "#EF4444" : "#A3A3A3"}
                            strokeWidth={isSelected ? 2.5 : isRisk ? 1.5 : 1}
                            strokeDasharray={isRisk ? "4 3" : undefined}
                            markerEnd={isRisk || isSelected ? "url(#arrow-red)" : "url(#arrow)"}
                            opacity={selectedNodeId && !isSelected ? 0.25 : 0.85}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {subgraph.nodes.map((node) => {
                      const pos = svgLayout.coords[node.id];
                      if (!pos) return null;

                      const isSelected = selectedNodeId === node.id;
                      const isCompany = node.group === "Company";
                      const isRisk = node.group === "Risk";
                      const isRatio = node.group === "Ratio";
                      const isLineItem = node.group === "LineItem";

                      let fill = "#000000";
                      let stroke = "#000000";
                      let textFill = "#FFFFFF";

                      if (isCompany) {
                        fill = "#FF0000";
                        stroke = "#000000";
                        textFill = "#FFFFFF";
                      } else if (isRisk) {
                        fill = "#DC2626";
                        stroke = "#991B1B";
                      } else if (isRatio) {
                        fill = "#F59E0B";
                        stroke = "#D97706";
                        textFill = "#000000";
                      } else if (isLineItem) {
                        fill = "#10B981";
                        stroke = "#059669";
                      } else {
                        fill = "#4F46E5";
                        stroke = "#3730A3";
                      }

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${pos.x}, ${pos.y})`}
                          onClick={() => setSelectedNodeId(node.id)}
                          className="cursor-pointer"
                        >
                          {/* Node Shape */}
                          {isCompany ? (
                            <rect
                              x="-50"
                              y="-20"
                              width="100"
                              height="40"
                              fill={fill}
                              stroke={isSelected ? "#000000" : stroke}
                              strokeWidth={isSelected ? 3 : 1.5}
                              className="transition-all hover:scale-105"
                            />
                          ) : (
                            <rect
                              x="-40"
                              y="-15"
                              width="80"
                              height="30"
                              fill={fill}
                              stroke={isSelected ? "#FF0000" : stroke}
                              strokeWidth={isSelected ? 3 : 1}
                              className="transition-all hover:scale-105"
                            />
                          )}

                          {/* Node Label */}
                          <text
                            textAnchor="middle"
                            dy=".3em"
                            fill={textFill}
                            fontSize={isCompany ? "11" : "9"}
                            fontFamily="monospace"
                            fontWeight="bold"
                            pointerEvents="none"
                          >
                            {node.label.length > 12 ? `${node.label.slice(0, 10)}..` : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* Selected Node Details Drawer */}
            {selectedNode && (
              <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-5 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black dark:border-white pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border ${getGroupBadgeClass(selectedNode.group)}`}>
                      {selectedNode.group}
                    </span>
                    <h3 className="text-lg font-black uppercase text-black dark:text-white">
                      {selectedNode.label}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase">
                    ID: {selectedNode.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Entity Properties */}
                  <div>
                    <h4 className="text-xs font-mono font-black uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                      [ PROPERTIES ]
                    </h4>
                    <div className="border border-black dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900 font-mono text-xs space-y-1.5">
                      {Object.keys(selectedNode.properties).length === 0 ? (
                        <span className="text-neutral-500 italic">No custom properties</span>
                      ) : (
                        Object.entries(selectedNode.properties).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1 last:border-b-0">
                            <span className="text-neutral-500 uppercase font-semibold">{k}:</span>
                            <span className="text-black dark:text-white font-bold">{String(v)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Connected Links */}
                  <div>
                    <h4 className="text-xs font-mono font-black uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                      [ ADJACENT GRAPH EDGES ({connectedLinks.length}) ]
                    </h4>
                    <div className="border border-black dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900 max-h-48 overflow-y-auto space-y-2 font-mono text-xs">
                      {connectedLinks.length === 0 ? (
                        <span className="text-neutral-500 italic">No adjacent edges</span>
                      ) : (
                        connectedLinks.map((link, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 border border-black/10 dark:border-white/10 bg-white dark:bg-black text-[11px]"
                          >
                            <span className="font-bold text-black dark:text-white truncate max-w-[35%]">
                              {link.source}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#FF0000] text-white font-black text-[9px] uppercase tracking-wider">
                              {link.relation} →
                            </span>
                            <span className="font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[35%] text-right">
                              {link.target}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid & Entities Table View */}
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-5 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
              <div className="flex items-center justify-between mb-4 border-b border-black dark:border-white pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-white">
                    [ KNOWLEDGE ENTITIES ({filteredNodes.length}) ]
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">
                  Showing {selectedGroup} Nodes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 border cursor-pointer transition-all ${
                        isSelected
                          ? "border-2 border-[#FF0000] bg-neutral-100 dark:bg-neutral-900 shadow-[2px_2px_0px_#FF0000]"
                          : "border-black dark:border-neutral-800 bg-white dark:bg-black hover:border-black dark:hover:border-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${getGroupBadgeClass(node.group)}`}>
                          {node.group}
                        </span>
                        {Boolean(node.properties.value) && (
                          <span className="text-xs font-mono font-bold text-black dark:text-white">
                            {Number(node.properties.value).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-black uppercase text-black dark:text-white truncate">
                        {node.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: GRAPH ALGORITHMS & RISK CONTAGION ── */}
        {activeTab === "algorithms" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Algorithm 1: Systemic Risk Centrality */}
              <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 flex items-center justify-center bg-[#FF0000] text-white">
                      <ShieldAlert className="h-4 w-4" />
                    </span>
                    <h3 className="text-base font-black uppercase text-black dark:text-white tracking-tight">
                      Systemic Risk PageRank &amp; Centrality
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    Runs network centrality algorithms over the relational topology to compute which corporate risk factors threaten the highest volume of financial metrics and solvency ratios.
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleRunPageRank}
                    disabled={algoLoading}
                    className="w-full py-3 bg-[#FF0000] hover:bg-[#D90429] text-white font-mono text-xs font-black uppercase tracking-widest border border-[#FF0000] shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#FFFFFF] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                  >
                    {algoLoading ? "Executing Topological PageRank..." : "Run Risk Centrality Algorithm →"}
                  </button>

                  {algoLatency !== null && (
                    <div className="p-2 border border-black dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-center font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      Calculated on FalkorDB in <span className="font-bold text-emerald-500">{algoLatency}ms</span>
                    </div>
                  )}

                  {algoResults && (
                    <div className="space-y-3 pt-2">
                      {algoResults.map((r, i) => (
                        <div
                          key={i}
                          className="p-3 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm uppercase text-black dark:text-white">
                              {r.category}
                            </span>
                            <span className="px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-[10px]">
                              Score: {r.centrality_score?.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-300 font-mono italic">
                            "{r.description}"
                          </p>
                          <div className="text-[11px] font-mono text-neutral-700 dark:text-neutral-400">
                            <strong>Threatened Metrics:</strong>{" "}
                            {r.threatened_metrics?.join(", ") || "None"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Algorithm 2: Cross-Statement Cash Reconciliation */}
              <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <h3 className="text-base font-black uppercase text-black dark:text-white tracking-tight">
                      Cross-Statement Cash Reconciliation Bridge
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Traverses <code className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 font-bold">:RECONCILES_TO</code> edges between Net Income (Income Statement) and Operating Cash Flow (Cash Flow Statement) to detect earnings manipulation.
                  </p>

                  <div className="border border-black dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900 font-mono text-xs space-y-2">
                    <div className="text-neutral-500 uppercase font-bold text-[10px]">
                      Cypher Traversal Pattern:
                    </div>
                    <code className="block p-2 bg-black text-emerald-400 dark:text-emerald-300 border border-neutral-700 overflow-x-auto text-[11px]">
                      MATCH (ni:LineItem)-[r:RECONCILES_TO]-&gt;(ocf:LineItem) RETURN ni, ocf
                    </code>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      setCypherQuery(
                        `MATCH (ni:LineItem {company: '${companyName}', canonical_name: 'NET_INCOME'}), (ocf:LineItem {company: '${companyName}', canonical_name: 'OPERATING_CASH_FLOW'}) RETURN ni.value, ocf.value`
                      );
                      setActiveTab("console");
                    }}
                    className="w-full py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-mono text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#FFFFFF] transition-all cursor-pointer"
                  >
                    Load in Cypher Console →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: CYPHER QUERY CONSOLE ── */}
        {activeTab === "console" && (
          <div className="space-y-6">
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF]">
              <div className="flex items-center justify-between mb-3 border-b border-black dark:border-white pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#FF0000]" />
                  <span className="text-xs font-mono font-black uppercase text-black dark:text-white">
                    [ INTERACTIVE CYPHER CONSOLE ]
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">
                  Connected to: {companyName}
                </span>
              </div>

              {/* Editor */}
              <div className="space-y-4">
                <textarea
                  value={cypherQuery}
                  onChange={(e) => setCypherQuery(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-900 border-2 border-black dark:border-neutral-700 p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-[#FF0000]"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setCypherQuery(
                          `MATCH (c:Company {name: '${companyName}'})-[:FILES]->(fy) RETURN c, fy LIMIT 10`
                        )
                      }
                      className="px-3 py-1.5 border border-black dark:border-white bg-white dark:bg-black text-xs font-mono font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer"
                    >
                      Preset: Topology
                    </button>
                    <button
                      onClick={() =>
                        setCypherQuery(
                          `MATCH (rf:RiskFactor {company: '${companyName}'})-[:THREATENS]->(li)-[:FEEDS_RATIO]->(fr) RETURN rf, li, fr LIMIT 10`
                        )
                      }
                      className="px-3 py-1.5 border border-black dark:border-white bg-white dark:bg-black text-xs font-mono font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer"
                    >
                      Preset: Risk Contagion
                    </button>
                    <button
                      onClick={() =>
                        setCypherQuery(
                          `MATCH (c:Company {name: '${companyName}'})-[:EXPOSED_TO]->(rf:RiskFactor) RETURN rf.category, rf.severity, rf.description`
                        )
                      }
                      className="px-3 py-1.5 border border-black dark:border-white bg-white dark:bg-black text-xs font-mono font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer"
                    >
                      Preset: Risk Exposure
                    </button>
                  </div>

                  <button
                    onClick={handleRunConsole}
                    disabled={consoleLoading}
                    className="px-6 py-2 bg-[#FF0000] hover:bg-[#D90429] text-white font-mono text-xs font-black uppercase tracking-wider border border-[#FF0000] shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#FFFFFF] cursor-pointer transition-all"
                  >
                    {consoleLoading ? "Executing Cypher..." : "Execute Cypher →"}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Console */}
            {consoleResult && (
              <div className="border-2 border-black dark:border-white bg-neutral-950 p-5 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#FFFFFF] font-mono text-xs text-white">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
                  <span className="text-neutral-400 uppercase font-black text-xs">
                    [ EXECUTION TELEMETRY ]
                  </span>
                  {consoleResult?.explainability && (
                    <span className="text-emerald-400 font-bold">
                      {consoleResult.explainability.execution_time_ms}ms latency • {consoleResult.explainability.nodes_evaluated ?? 0} nodes evaluated
                    </span>
                  )}
                </div>
                <pre className="p-3 bg-black border border-neutral-800 overflow-x-auto text-neutral-300 max-h-96 text-xs">
                  {JSON.stringify(consoleResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
