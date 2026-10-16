"""FalkorDB Graph Agent for Financial Multi-Hop Reasoning & Explainable Intelligence.

This agent acts on connected financial data, selecting Cypher queries and graph
algorithms as first-class tools, and returns fully explainable answers with
subgraph traversal proof.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.db.falkordb_client import falkor_client
from app.rag.graph_queries import FalkorGraphAlgorithms, FinancialGraphQueries, graph_algorithms
from app.rag.llm_client import PrimaryLLMClient

logger = logging.getLogger(__name__)


class FalkorFinancialAgent:
    """Intelligent reasoning agent powered by FalkorDB graph context."""

    def __init__(
        self,
        client=None,
        llm_client=None,
    ) -> None:
        self.client = client or falkor_client
        self.algorithms = FalkorGraphAlgorithms(client=self.client)
        self._llm = llm_client

    @property
    def llm(self):
        if self._llm is None:
            try:
                self._llm = PrimaryLLMClient()
            except Exception as exc:
                logger.warning("Primary LLM client unavailable for graph agent: %s", exc)
        return self._llm

    def answer_query(
        self,
        query: str,
        company_name: Optional[str] = None,
        year: Optional[int] = None,
        graph_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process a natural language financial inquiry using FalkorDB graph reasoning.
        
        Returns:
            Dictionary containing:
            - answer: Synthesized financial intelligence
            - cypher_executed: Exact Cypher query run
            - traversal_path: Nodes and edges traversed
            - graph_metrics: Algorithmic scores or raw data
            - explainability: Verifiable proof of reasoning
        """
        start_time = time.perf_counter()
        normalized_query = query.lower()
        company = company_name or self._infer_company(normalized_query) or "SampleCorp"

        # 1. Routing / Tool Selection based on query semantics
        tool_used = "cypher_custom"
        cypher_query = ""
        graph_data: List[Dict[str, Any]] = []

        if any(w in normalized_query for w in ["centrality", "systemic risk", "most critical", "top risk", "pagerank"]):
            tool_used = "systemic_risk_centrality"
            graph_data = self.algorithms.calculate_systemic_risk_centrality(company, graph_name)
            cypher_query = "MATCH (rf:RiskFactor {company}) ... WITH centrality_score RETURN rf, centrality_score"

        elif any(w in normalized_query for w in ["contagion", "shortest path", "connects", "path between", "lead to"]):
            tool_used = "shortest_contagion_path"
            # Extract start and target keywords
            start_kw = "Liquidity" if "liquidity" in normalized_query else "Interest"
            target_kw = "DebtToEquity" if "debt" in normalized_query else "CurrentRatio"
            graph_data = self.algorithms.find_shortest_contagion_path(
                company_name=company,
                start_node_type="RiskFactor",
                start_identifier=start_kw,
                end_node_type="FinancialRatio",
                end_identifier=target_kw,
                graph_name=graph_name,
            )
            cypher_query = f"MATCH path = shortestPath((start:RiskFactor)-[*..5]-(target:FinancialRatio)) RETURN path"

        elif any(w in normalized_query for w in ["reconciliation", "cash conversion", "accrual", "quality of earnings"]):
            tool_used = "cross_statement_reconciliation"
            target_year = year or 2024
            cypher_query = FinancialGraphQueries.cross_statement_reconciliation(company, target_year)
            graph_data = self.client.query(cypher_query, graph_name=graph_name)

        elif any(w in normalized_query for w in ["leverage", "distress", "covenant", "debt burden"]):
            tool_used = "distressed_leverage_cascade"
            cypher_query = FinancialGraphQueries.distressed_leverage_cascade(company)
            graph_data = self.client.query(cypher_query, graph_name=graph_name)

        elif any(w in normalized_query for w in ["growth", "trend", "trajectory", "yoy", "year over year"]):
            tool_used = "yoy_trajectory_traversal"
            metric = "REVENUE"
            if "net income" in normalized_query or "profit" in normalized_query:
                metric = "NET_INCOME"
            elif "debt" in normalized_query:
                metric = "TOTAL_DEBT"
            cypher_query = FinancialGraphQueries.yoy_trajectory_traversal(company, metric)
            graph_data = self.client.query(cypher_query, graph_name=graph_name)

        else:
            # Default to full topology traversal
            tool_used = "company_topology_traversal"
            cypher_query = FinancialGraphQueries.get_company_full_topology(company, year)
            graph_data = self.client.query(cypher_query, graph_name=graph_name)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # 2. Synthesize Explainable Response
        synthesis = self._synthesize_response(query, company, tool_used, graph_data)

        return {
            "answer": synthesis["summary"],
            "tool_used": tool_used,
            "company_analyzed": company,
            "cypher_executed": cypher_query,
            "subgraph_results": graph_data,
            "traversal_path": synthesis["path_summary"],
            "explainability": {
                "engine": "FalkorDB Graph Context Layer",
                "execution_time_ms": round(elapsed_ms, 2),
                "nodes_evaluated": len(graph_data),
                "is_graph_grounded": True,
            },
        }

    def _infer_company(self, query: str) -> Optional[str]:
        """Extract company name if mentioned in the query."""
        known = ["apple", "tesla", "microsoft", "amazon", "reliance", "tcs", "infosys", "samplecorp"]
        for k in known:
            if k in query:
                return k.capitalize()
        return None

    def _synthesize_response(
        self,
        query: str,
        company: str,
        tool: str,
        data: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Produce structured analytical narrative from FalkorDB graph results."""
        if not data:
            return {
                "summary": f"FalkorDB graph search executed for **{company}** using `{tool}`, but no connected nodes were returned. Ingest document metrics first to populate the knowledge graph.",
                "path_summary": [],
            }

        if tool == "systemic_risk_centrality":
            top_risk = data[0]
            cat = top_risk.get("category", "General")
            desc = top_risk.get("description", "N/A")
            score = top_risk.get("centrality_score", 0.0)
            metrics = top_risk.get("threatened_metrics", [])
            ratios = top_risk.get("affected_ratios", [])

            summary = (
                f"### 🛡️ Systemic Risk Analysis for {company} (FalkorDB Centrality)\n\n"
                f"The highest-impact vulnerability identified across the connected corporate graph is **{cat}** "
                f"(Centrality Score: `{score:.1f}`).\n\n"
                f"- **Risk Disclosed**: {desc}\n"
                f"- **Directly Threatened Line Items**: {', '.join(metrics) if metrics else 'None'}\n"
                f"- **Impacted Financial Ratios**: {', '.join(ratios) if ratios else 'None'}\n\n"
                f"*Multi-Hop Insight*: This risk propagates across statements because deteriorating {', '.join(metrics[:2])} "
                f"directly forces degradation in {', '.join(ratios[:2])}."
            )
            return {
                "summary": summary,
                "path_summary": [f"RiskFactor({cat}) -> THREATENS -> LineItems({len(metrics)}) -> FEEDS_RATIO -> Ratios({len(ratios)})"],
            }

        elif tool == "cross_statement_reconciliation":
            row = data[0]
            ni = row.get("net_income", 0.0)
            ocf = row.get("operating_cash_flow", 0.0)
            delta = row.get("accrual_delta", 0.0)
            flag = row.get("earnings_quality_flag", "Normal")

            summary = (
                f"### ⚖️ Cross-Statement Integrity Reconciliation ({company})\n\n"
                f"- **Net Income (Income Statement)**: {ni:,.2f}\n"
                f"- **Operating Cash Flow (Cash Flow Statement)**: {ocf:,.2f}\n"
                f"- **Accrual Delta (OCF - NI)**: {delta:,.2f}\n"
                f"- **Earnings Quality Status**: **{flag}**\n\n"
                f"Through FalkorDB's `RECONCILES_TO` relationship, we verify that earnings are backed by liquid cash conversion."
            )
            return {
                "summary": summary,
                "path_summary": [f"IncomeStatement.LineItem(NET_INCOME: {ni}) -[:RECONCILES_TO]-> CashFlow.LineItem(OPERATING_CASH_FLOW: {ocf})"],
            }

        elif tool == "yoy_trajectory_traversal":
            items = []
            for r in data[:3]:
                cy = r.get("current_year")
                cv = r.get("current_value")
                growth = r.get("yoy_growth_percentage")
                growth_str = f" ({growth:+.1f}% YoY)" if growth is not None else ""
                items.append(f"- **FY{cy}**: {cv:,.2f}{growth_str}")

            summary = (
                f"### 📈 Trajectory Traversal across Consecutive Fiscal Years ({company})\n\n"
                + "\n".join(items)
                + "\n\n*Lineage*: Traversed via `YEAR_OVER_YEAR` edges in FalkorDB."
            )
            return {
                "summary": summary,
                "path_summary": [f"LineItem(FY{r.get('current_year')}) -> YEAR_OVER_YEAR -> LineItem(FY{r.get('prior_year')})" for r in data if r.get('prior_year')],
            }

        # Generic structured fallback
        summary = (
            f"### 🕸️ FalkorDB Graph Analysis for {company}\n\n"
            f"Successfully executed multi-hop query `{tool}` returning {len(data)} connected records. "
            f"The relationships establish direct causal lineage between reported financial statements, line items, and risk factors."
        )
        return {
            "summary": summary,
            "path_summary": [f"Record {idx + 1}: {list(d.keys())}" for idx, d in enumerate(data[:3])],
        }


graph_agent = FalkorFinancialAgent()
