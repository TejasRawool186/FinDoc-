"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { graphService, SubgraphResponse } from "@/lib/services/graph-service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export default function KnowledgeGraphPage() {
  const { activeDocument } = useWorkspaceStore();
  const [companyName, setCompanyName] = useState<string>(activeDocument?.company_name || "");
  const [subgraph, setSubgraph] = useState<SubgraphResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<string>("checking");
  const [activeTab, setActiveTab] = useState<"topology" | "algorithms" | "console">("topology");

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
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const health = await graphService.checkHealth();
        setHealthStatus(health.status);
      } catch {
        setHealthStatus("unreachable");
      }

      if (companyName.trim()) {
        try {
          const data = await graphService.getSubgraph(companyName.trim());
          setSubgraph(data);
        } catch (err) {
          console.error("Subgraph fetch error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setSubgraph(null);
        setLoading(false);
      }
    }
    loadData();
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Network className="h-5 w-5 text-[#E63946]" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                FalkorDB Knowledge Graph Explorer
              </h1>
              <Badge variant="outline" className="border-[#E63946]/40 text-[#E63946] bg-[#E63946]/10 text-xs">
                Context for AI Agents
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-hop relational reasoning, risk contagion tracing, and topological graph algorithms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-secondary/30 text-xs font-mono">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  healthStatus === "healthy" ? "bg-emerald-500 shadow-[0_0_8px_#10B981]" : "bg-amber-500"
                }`}
              />
              <span className="text-muted-foreground">FalkorDB:</span>
              <span className="text-foreground capitalize font-semibold">{healthStatus}</span>
            </div>

            <select
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-card border border-border/60 rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Tesla Inc">Tesla Inc (TSLA)</option>
              <option value="Tata Motors">Tata Motors (TATAMOTORS)</option>
              <option value="Reliance Industries">Reliance Industries (RELIANCE)</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/40 gap-2">
          <button
            onClick={() => setActiveTab("topology")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "topology"
                ? "border-[#E63946] text-[#E63946]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🕸️ Graph Topology Explorer
          </button>
          <button
            onClick={() => setActiveTab("algorithms")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "algorithms"
                ? "border-[#E63946] text-[#E63946]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            ⚡ Graph Algorithms & Contagion
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "console"
                ? "border-[#E63946] text-[#E63946]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            💻 Live Cypher Console
          </button>
        </div>

        {/* TAB 1: TOPOLOGY EXPLORER */}
        {activeTab === "topology" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Target Corporation</div>
                  <div className="text-lg font-bold text-foreground mt-1">{companyName}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Connected Nodes</div>
                  <div className="text-lg font-bold text-[#E63946] mt-1">{subgraph?.nodes.length ?? 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Relational Edges</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{subgraph?.links.length ?? 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Isolation Engine</div>
                  <div className="text-lg font-bold text-sky-400 mt-1">Multigraph</div>
                </CardContent>
              </Card>
            </div>

            {/* Nodes Breakdown */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Knowledge Graph Entities</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {subgraph?.nodes.length || 0} Entities
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subgraph?.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-3 rounded-lg border border-border/40 bg-secondary/20 hover:border-[#E63946]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            node.group === "Company"
                              ? "text-red-400 border-red-500/30"
                              : node.group === "Statement"
                              ? "text-purple-400 border-purple-500/30"
                              : node.group === "LineItem"
                              ? "text-emerald-400 border-emerald-500/30"
                              : node.group === "Ratio"
                              ? "text-amber-400 border-amber-500/30"
                              : "text-pink-400 border-pink-500/30"
                          }`}
                        >
                          {node.group}
                        </Badge>
                        {Boolean(node.properties.value) && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {Number(node.properties.value).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-2 truncate">{node.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Relationships Table */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Causal & Relational Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subgraph?.links.slice(0, 15).map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded bg-secondary/15 border border-border/30 font-mono"
                    >
                      <span className="text-foreground truncate max-w-[40%]">{link.source}</span>
                      <span className="text-[#E63946] px-2 py-0.5 rounded bg-[#E63946]/10 font-bold text-[10px]">
                        -{link.relation}→
                      </span>
                      <span className="text-muted-foreground truncate max-w-[40%] text-right">{link.target}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: GRAPH ALGORITHMS */}
        {activeTab === "algorithms" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Algorithm 1: Systemic Risk Centrality */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#E63946]" />
                    <span>Systemic Risk PageRank / Centrality</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Evaluates graph connectivity to identify which risk factors threaten the most line items and ratios.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleRunPageRank}
                    disabled={algoLoading}
                    className="w-full bg-[#E63946] hover:bg-[#D90429] text-white"
                  >
                    {algoLoading ? "Executing PageRank..." : "Run Risk Centrality Algorithm"}
                  </Button>

                  {algoLatency !== null && (
                    <div className="text-xs text-muted-foreground text-center font-mono">
                      Algorithm executed in <span className="text-emerald-400 font-bold">{algoLatency}ms</span> on FalkorDB.
                    </div>
                  )}

                  {algoResults && (
                    <div className="space-y-3 pt-2">
                      {algoResults.map((r, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-border/50 bg-secondary/20 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-sm">{r.category}</span>
                            <Badge variant="outline" className="text-red-400 border-red-500/40">
                              Score: {r.centrality_score?.toFixed(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground italic">"{r.description}"</p>
                          <div className="text-[11px] text-muted-foreground">
                            <strong>Threatened Metrics:</strong> {r.threatened_metrics?.join(", ") || "None"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Algorithm 2: Cross-Statement Reconciliation */}
              <Card className="bg-card/40 border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Cross-Statement Cash Reconciliation</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Traverses RECONCILES_TO edges connecting Net Income (Income Statement) to Operating Cash Flow.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/20 border border-border/40 space-y-2 text-xs font-mono">
                    <div className="text-muted-foreground">Cypher Traversal Pattern:</div>
                    <code className="text-emerald-400 block p-2 rounded bg-black/40">
                      MATCH (ni:LineItem)-[r:RECONCILES_TO]-&gt;(ocf:LineItem) RETURN ni, ocf
                    </code>
                  </div>

                  <Button
                    onClick={() => {
                      setCypherQuery(
                        `MATCH (ni:LineItem {company: '${companyName}', canonical_name: 'NET_INCOME'}), (ocf:LineItem {company: '${companyName}', canonical_name: 'OPERATING_CASH_FLOW'}) RETURN ni.value, ocf.value`
                      );
                      setActiveTab("console");
                    }}
                    variant="outline"
                    className="w-full border-border/50"
                  >
                    Load in Cypher Console →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: CYPHER CONSOLE */}
        {activeTab === "console" && (
          <div className="space-y-4">
            <Card className="bg-card/40 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#E63946]" />
                  <span>Interactive Cypher Statement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={cypherQuery}
                  onChange={(e) => setCypherQuery(e.target.value)}
                  rows={4}
                  className="w-full bg-black/60 border border-border/60 rounded-md p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-border/40"
                      onClick={() =>
                        setCypherQuery(`MATCH (c:Company {name: '${companyName}'})-[:FILES]->(fy) RETURN c, fy LIMIT 10`)
                      }
                    >
                      Preset: Topology
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-border/40"
                      onClick={() =>
                        setCypherQuery(
                          `MATCH (rf:RiskFactor {company: '${companyName}'})-[:THREATENS]->(li)-[:FEEDS_RATIO]->(fr) RETURN rf, li, fr LIMIT 10`
                        )
                      }
                    >
                      Preset: Risk Contagion
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleRunConsole}
                    disabled={consoleLoading}
                    className="bg-[#E63946] hover:bg-[#D90429] text-white"
                  >
                    {consoleLoading ? "Running..." : "Execute Cypher"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {consoleResult && (
              <Card className="bg-card/40 border-border/40 font-mono text-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Execution Result</span>
                    {consoleResult?.explainability && (
                      <span className="text-emerald-400">
                        {consoleResult.explainability.execution_time_ms}ms latency
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-3 rounded bg-black/70 overflow-x-auto text-muted-foreground max-h-96">
                    {JSON.stringify(consoleResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
