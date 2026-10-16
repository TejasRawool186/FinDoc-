"""FalkorDB Cypher Query Templates & Analytical Multi-Hop Patterns.

This module provides certified, high-performance Cypher query templates
for financial multi-hop reasoning, cross-statement reconciliations,
risk contagion paths, and ratio lineage verification.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from app.db.falkordb_client import falkor_client


class FinancialGraphQueries:
    """Pre-built multi-hop Cypher queries for financial reasoning."""

    @staticmethod
    def get_company_full_topology(company_name: str, year: Optional[int] = None) -> str:
        """Returns the full connected graph for a company."""
        year_filter = f"WHERE fy.year = {year}" if year else ""
        return f"""
        MATCH (c:Company {{name: '{company_name}'}})-[:FILES]->(fy:FiscalYear)
        {year_filter}
        OPTIONAL MATCH (fy)-[:CONTAINS_STATEMENT]->(s:FinancialStatement)-[:REPORTS_METRIC]->(li:LineItem)
        OPTIONAL MATCH (fy)-[:HAS_RATIO]->(fr:FinancialRatio)
        OPTIONAL MATCH (li)-[:FEEDS_RATIO]->(fr)
        OPTIONAL MATCH (c)-[:EXPOSED_TO]->(rf:RiskFactor)
        OPTIONAL MATCH (rf)-[:THREATENS]->(li)
        OPTIONAL MATCH (fy)-[:SCORED_AS]->(h:CorporateHealth)
        RETURN c, fy, s, li, fr, rf, h
        """

    @staticmethod
    def multi_hop_risk_to_metric_path(company_name: str, risk_category: str) -> str:
        """Traces multi-hop paths from a qualitative risk factor to the balance sheet lines it threatens."""
        return f"""
        MATCH path = (rf:RiskFactor {{company: '{company_name}'}})-[:THREATENS]->(li:LineItem)-[:FEEDS_RATIO]->(fr:FinancialRatio)
        WHERE rf.category =~ '(?i).*{risk_category}.*'
        RETURN rf.category AS risk,
               rf.severity AS severity,
               rf.description AS risk_description,
               li.canonical_name AS impacted_metric,
               li.value AS metric_value,
               li.unit AS unit,
               fr.name AS triggered_ratio,
               fr.value AS ratio_value,
               fr.benchmark_status AS benchmark
        ORDER BY rf.severity DESC
        """

    @staticmethod
    def cross_statement_reconciliation(company_name: str, year: int) -> str:
        """Inspects reconciliation between Net Income (Income Statement) and Operating Cash Flow (Cash Flow)."""
        return f"""
        MATCH (ni:LineItem {{company: '{company_name}', year: {year}, canonical_name: 'NET_INCOME'}}),
              (ocf:LineItem {{company: '{company_name}', year: {year}, canonical_name: 'OPERATING_CASH_FLOW'}})
        OPTIONAL MATCH (ni)-[r:RECONCILES_TO]->(ocf)
        RETURN ni.value AS net_income,
               ocf.value AS operating_cash_flow,
               (ocf.value - ni.value) AS accrual_delta,
               CASE WHEN ocf.value < ni.value THEN 'High Accruals / Earnings Quality Warning'
                    ELSE 'Solid Cash Conversion' END AS earnings_quality_flag
        """

    @staticmethod
    def distressed_leverage_cascade(company_name: str) -> str:
        """Finds debt vulnerabilities where high leverage connects to interest burden and liquidity risks."""
        return f"""
        MATCH (c:Company {{name: '{company_name}'}})-[:FILES]->(fy:FiscalYear)
        MATCH (fy)-[:HAS_RATIO]->(de:FinancialRatio {{name: 'DebtToEquity'}})
        OPTIONAL MATCH (fy)-[:HAS_RATIO]->(ic:FinancialRatio {{name: 'InterestCoverage'}})
        OPTIONAL MATCH (li:LineItem {{company: '{company_name}', year: fy.year}})-[:FEEDS_RATIO]->(de)
        OPTIONAL MATCH (c)-[:EXPOSED_TO]->(rf:RiskFactor)
        WHERE de.value > 1.5 OR ic.value < 2.5
        RETURN fy.year AS year,
               de.value AS debt_to_equity,
               ic.value AS interest_coverage,
               collect(DISTINCT li.canonical_name) AS driver_metrics,
               collect(DISTINCT rf.description) AS active_risks
        ORDER BY fy.year DESC
        """

    @staticmethod
    def yoy_trajectory_traversal(company_name: str, metric_name: str) -> str:
        """Traverses consecutive year-over-year growth edges for a given line item."""
        return f"""
        MATCH (curr:LineItem {{company: '{company_name}', canonical_name: '{metric_name.upper()}'}})
        OPTIONAL MATCH (curr)-[r:YEAR_OVER_YEAR]->(prev:LineItem)
        RETURN curr.year AS current_year,
               curr.value AS current_value,
               prev.year AS prior_year,
               prev.value AS prior_value,
               r.growth_pct AS yoy_growth_percentage
        ORDER BY curr.year DESC
        """


class FalkorGraphAlgorithms:
    """Graph algorithm implementations leveraging FalkorDB connectivity."""

    def __init__(self, client=None) -> None:
        self.client = client or falkor_client

    def calculate_systemic_risk_centrality(
        self,
        company_name: str,
        graph_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Computes degree & impact centrality to identify the #1 systemic risk node.
        
        Evaluates how many financial line items and ratios each risk threatens.
        """
        cypher = """
        MATCH (rf:RiskFactor {company: $company})
        OPTIONAL MATCH (rf)-[:THREATENS]->(li:LineItem)
        OPTIONAL MATCH (li)-[:FEEDS_RATIO]->(fr:FinancialRatio)
        WITH rf, count(DISTINCT li) AS threatened_metrics_count,
             count(DISTINCT fr) AS affected_ratios_count,
             collect(DISTINCT li.canonical_name) AS threatened_metrics,
             collect(DISTINCT fr.name) AS affected_ratios
        WITH rf, threatened_metrics_count, affected_ratios_count, threatened_metrics, affected_ratios,
             (threatened_metrics_count * 2.0 + affected_ratios_count * 3.0 +
              CASE rf.severity WHEN 'CRITICAL' THEN 10.0 WHEN 'HIGH' THEN 5.0 ELSE 2.0 END) AS centrality_score
        RETURN rf.category AS category,
               rf.description AS description,
               rf.severity AS severity,
               threatened_metrics_count,
               affected_ratios_count,
               threatened_metrics,
               affected_ratios,
               centrality_score
        ORDER BY centrality_score DESC
        """
        return self.client.query(
            cypher,
            {"company": company_name},
            graph_name=graph_name,
        )

    def find_shortest_contagion_path(
        self,
        company_name: str,
        start_node_type: str,
        start_identifier: str,
        end_node_type: str,
        end_identifier: str,
        graph_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Finds shortest path between any two financial entities in FalkorDB."""
        # Using shortest path traversal
        cypher = f"""
        MATCH (start:{start_node_type}), (target:{end_node_type})
        WHERE (start.name = $start_id OR start.category = $start_id OR start.canonical_name = $start_id)
          AND (target.name = $target_id OR target.canonical_name = $target_id OR target.category = $target_id)
        MATCH path = shortestPath((start)-[*..5]-(target))
        RETURN [node in nodes(path) | coalesce(node.canonical_name, node.name, node.category, labels(node)[0])] AS path_nodes,
               [rel in relationships(path) | type(rel)] AS relationship_types,
               length(path) AS hops
        """
        return self.client.query(
            cypher,
            {"start_id": start_identifier, "target_id": end_identifier},
            graph_name=graph_name,
        )


graph_algorithms = FalkorGraphAlgorithms()
