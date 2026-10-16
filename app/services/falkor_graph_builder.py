"""FalkorDB Financial Knowledge Graph Builder & Ingestion Service.

This service transforms extracted financial metrics, calculated financial ratios,
qualitative risk factors, and auditor disclosures into a fully connected,
multi-hop Knowledge Graph in FalkorDB using high-performance Cypher statements.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.falkordb_client import falkor_client
from app.models.analysis_result import AnalysisResult
from app.models.document import Document
from app.models.financial_metric import FinancialMetric

logger = logging.getLogger(__name__)

# Mapping standardized metric names to canonical financial statements
STATEMENT_MAPPING: Dict[str, str] = {
    # Income Statement
    "REVENUE": "IncomeStatement",
    "TOTAL_REVENUE": "IncomeStatement",
    "NET_SALES": "IncomeStatement",
    "OPERATING_INCOME": "IncomeStatement",
    "EBIT": "IncomeStatement",
    "EBITDA": "IncomeStatement",
    "NET_INCOME": "IncomeStatement",
    "PROFIT_AFTER_TAX": "IncomeStatement",
    "INTEREST_EXPENSE": "IncomeStatement",
    "TAX_EXPENSE": "IncomeStatement",
    "EPS": "IncomeStatement",
    
    # Balance Sheet
    "TOTAL_ASSETS": "BalanceSheet",
    "CURRENT_ASSETS": "BalanceSheet",
    "CASH_EQUIVALENTS": "BalanceSheet",
    "CASH_AND_EQUIVALENTS": "BalanceSheet",
    "TOTAL_LIABILITIES": "BalanceSheet",
    "CURRENT_LIABILITIES": "BalanceSheet",
    "TOTAL_DEBT": "BalanceSheet",
    "SHORT_TERM_DEBT": "BalanceSheet",
    "LONG_TERM_DEBT": "BalanceSheet",
    "SHAREHOLDERS_EQUITY": "BalanceSheet",
    "RETAINED_EARNINGS": "BalanceSheet",
    
    # Cash Flow Statement
    "OPERATING_CASH_FLOW": "CashFlow",
    "FREE_CASH_FLOW": "CashFlow",
    "INVESTING_CASH_FLOW": "CashFlow",
    "FINANCING_CASH_FLOW": "CashFlow",
    "CAPEX": "CashFlow",
}

# Line items that directly feed specific financial ratios
RATIO_LINE_ITEM_FEEDS: Dict[str, List[str]] = {
    "OperatingMargin": ["OPERATING_INCOME", "REVENUE"],
    "NetProfitMargin": ["NET_INCOME", "REVENUE"],
    "ReturnOnEquity": ["NET_INCOME", "SHAREHOLDERS_EQUITY"],
    "CurrentRatio": ["CURRENT_ASSETS", "CURRENT_LIABILITIES"],
    "QuickRatio": ["CASH_EQUIVALENTS", "CURRENT_LIABILITIES"],
    "DebtToEquity": ["TOTAL_DEBT", "SHAREHOLDERS_EQUITY"],
    "InterestCoverage": ["OPERATING_INCOME", "INTEREST_EXPENSE"],
}


class FalkorFinancialGraphBuilder:
    """Orchestrates creation and maintenance of Financial Knowledge Graphs in FalkorDB."""

    def __init__(self, client=None) -> None:
        self.client = client or falkor_client

    def ensure_indices(self, graph_name: Optional[str] = None) -> None:
        """Create indices on primary node keys to guarantee O(1) multi-hop traversals."""
        indices = [
            "CREATE INDEX FOR (c:Company) ON (c.name)",
            "CREATE INDEX FOR (fy:FiscalYear) ON (fy.year)",
            "CREATE INDEX FOR (li:LineItem) ON (li.canonical_name)",
            "CREATE INDEX FOR (rf:RiskFactor) ON (rf.category)",
            "CREATE INDEX FOR (fr:FinancialRatio) ON (fr.name)",
        ]
        for query in indices:
            try:
                self.client.query(query, graph_name=graph_name)
            except Exception as exc:
                # FalkorDB may raise if index already exists
                logger.debug("Index creation notice: %s", exc)

    def sync_document_to_graph(
        self,
        document_id: UUID,
        db: Session,
        graph_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Convert a document's extracted metrics, ratios, and risk flags into a connected graph."""
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise ValueError(f"Document {document_id} not found.")

        company_name = doc.company_name or doc.filename.replace(".pdf", "").strip()
        fiscal_year = doc.fiscal_year or 2024
        fiscal_period = doc.fiscal_period or "FY"

        self.ensure_indices(graph_name)

        # 1. Merge Company Node
        company_query = """
        MERGE (c:Company {name: $company_name})
        ON CREATE SET c.id = $doc_id, c.created_at = timestamp()
        RETURN c.name AS name
        """
        self.client.query(
            company_query,
            {"company_name": company_name, "doc_id": str(doc.id)},
            graph_name=graph_name,
        )

        # 2. Merge Fiscal Year & Link to Company
        fy_query = """
        MATCH (c:Company {name: $company_name})
        MERGE (fy:FiscalYear {company: $company_name, year: $fiscal_year, period: $fiscal_period})
        MERGE (c)-[:FILES]->(fy)
        RETURN fy.year AS year
        """
        self.client.query(
            fy_query,
            {
                "company_name": company_name,
                "fiscal_year": int(fiscal_year),
                "fiscal_period": fiscal_period,
            },
            graph_name=graph_name,
        )

        # 3. Create Statement Containers
        statements = {"IncomeStatement", "BalanceSheet", "CashFlow"}
        for stmt in statements:
            stmt_query = """
            MATCH (fy:FiscalYear {company: $company_name, year: $fiscal_year, period: $fiscal_period})
            MERGE (s:FinancialStatement {company: $company_name, year: $fiscal_year, statement_type: $stmt_type})
            MERGE (fy)-[:CONTAINS_STATEMENT]->(s)
            """
            self.client.query(
                stmt_query,
                {
                    "company_name": company_name,
                    "fiscal_year": int(fiscal_year),
                    "fiscal_period": fiscal_period,
                    "stmt_type": stmt,
                },
                graph_name=graph_name,
            )

        # 4. Ingest Metrics as LineItems attached to their FinancialStatement
        metrics: List[FinancialMetric] = db.query(FinancialMetric).filter(
            FinancialMetric.document_id == document_id
        ).all()

        ingested_metrics_count = 0
        for m in metrics:
            val = float(m.value) if m.value is not None else 0.0
            canonical_name = m.metric_name.upper().strip()
            stmt_type = STATEMENT_MAPPING.get(canonical_name, "IncomeStatement")

            li_query = """
            MATCH (s:FinancialStatement {company: $company_name, year: $fiscal_year, statement_type: $stmt_type})
            MERGE (li:LineItem {
                company: $company_name,
                year: $fiscal_year,
                canonical_name: $canonical_name
            })
            SET li.value = $val,
                li.unit = $unit,
                li.source_page = $source_page,
                li.confidence = $confidence
            MERGE (s)-[:REPORTS_METRIC]->(li)
            """
            self.client.query(
                li_query,
                {
                    "company_name": company_name,
                    "fiscal_year": int(fiscal_year),
                    "stmt_type": stmt_type,
                    "canonical_name": canonical_name,
                    "val": val,
                    "unit": m.unit or "INR_CR",
                    "source_page": m.source_page or 1,
                    "confidence": float(m.confidence or 1.0),
                },
                graph_name=graph_name,
            )
            ingested_metrics_count += 1

        # 5. Ingest Calculated Ratios & Link LineItems to Ratios
        analysis: Optional[AnalysisResult] = db.query(AnalysisResult).filter(
            AnalysisResult.document_id == document_id
        ).first()

        ratios_count = 0
        if analysis:
            ratio_map = {
                "OperatingMargin": analysis.opm,
                "NetProfitMargin": analysis.npm,
                "ReturnOnEquity": analysis.roe,
                "ReturnOnCapitalEmployed": analysis.roce,
                "CurrentRatio": analysis.current_ratio,
                "QuickRatio": analysis.quick_ratio,
                "DebtToEquity": analysis.debt_to_equity,
                "InterestCoverage": analysis.interest_coverage,
            }

            for ratio_name, ratio_val in ratio_map.items():
                if ratio_val is not None:
                    # Determine benchmark status
                    status = "HEALTHY"
                    if ratio_name in ["CurrentRatio", "QuickRatio"] and ratio_val < 1.0:
                        status = "CRITICAL"
                    elif ratio_name == "DebtToEquity" and ratio_val > 2.0:
                        status = "HIGH_LEVERAGE"
                    elif ratio_name == "InterestCoverage" and ratio_val < 2.0:
                        status = "DISTRESS_RISK"

                    ratio_query = """
                    MATCH (fy:FiscalYear {company: $company_name, year: $fiscal_year, period: $fiscal_period})
                    MERGE (fr:FinancialRatio {
                        company: $company_name,
                        year: $fiscal_year,
                        name: $ratio_name
                    })
                    SET fr.value = $val, fr.benchmark_status = $status
                    MERGE (fy)-[:HAS_RATIO]->(fr)
                    """
                    self.client.query(
                        ratio_query,
                        {
                            "company_name": company_name,
                            "fiscal_year": int(fiscal_year),
                            "fiscal_period": fiscal_period,
                            "ratio_name": ratio_name,
                            "val": float(ratio_val),
                            "status": status,
                        },
                        graph_name=graph_name,
                    )
                    ratios_count += 1

                    # Connect LineItems that feed this ratio
                    feed_items = RATIO_LINE_ITEM_FEEDS.get(ratio_name, [])
                    for feed_metric in feed_items:
                        feed_query = """
                        MATCH (li:LineItem {company: $company_name, year: $fiscal_year, canonical_name: $feed_metric}),
                              (fr:FinancialRatio {company: $company_name, year: $fiscal_year, name: $ratio_name})
                        MERGE (li)-[:FEEDS_RATIO]->(fr)
                        """
                        self.client.query(
                            feed_query,
                            {
                                "company_name": company_name,
                                "fiscal_year": int(fiscal_year),
                                "feed_metric": feed_metric,
                                "ratio_name": ratio_name,
                            },
                            graph_name=graph_name,
                        )

            # 6. Ingest Corporate Health Node
            health_query = """
            MATCH (fy:FiscalYear {company: $company_name, year: $fiscal_year, period: $fiscal_period})
            MERGE (h:CorporateHealth {company: $company_name, year: $fiscal_year})
            SET h.overall_score = $overall,
                h.growth_score = $growth,
                h.profitability_score = $profit,
                h.liquidity_score = $liquidity,
                h.leverage_score = $leverage,
                h.cash_flow_score = $cash
            MERGE (fy)-[:SCORED_AS]->(h)
            """
            self.client.query(
                health_query,
                {
                    "company_name": company_name,
                    "fiscal_year": int(fiscal_year),
                    "fiscal_period": fiscal_period,
                    "overall": float(analysis.overall_score or 0.0),
                    "growth": float(analysis.growth_score or 0.0),
                    "profit": float(analysis.profitability_score or 0.0),
                    "liquidity": float(analysis.liquidity_score or 0.0),
                    "leverage": float(analysis.leverage_score or 0.0),
                    "cash": float(analysis.cash_flow_score or 0.0),
                },
                graph_name=graph_name,
            )

            # 7. Ingest Risk Factors & Link to Threatened LineItems
            raw_flags = analysis.risk_flags if isinstance(analysis.risk_flags, list) else []
            for flag in raw_flags:
                category = "General"
                severity = "MEDIUM"
                desc = str(flag)
                if ":" in desc:
                    parts = desc.split(":", 1)
                    category = parts[0].strip()
                    desc = parts[1].strip()

                if any(w in desc.lower() for w in ["default", "critical", "covenant", "insolvency"]):
                    severity = "CRITICAL"
                elif any(w in desc.lower() for w in ["liquidity", "debt", "interest", "decline"]):
                    severity = "HIGH"

                risk_query = """
                MATCH (c:Company {name: $company_name})
                MERGE (rf:RiskFactor {company: $company_name, category: $category, description: $desc})
                SET rf.severity = $severity
                MERGE (c)-[:EXPOSED_TO]->(rf)
                """
                self.client.query(
                    risk_query,
                    {
                        "company_name": company_name,
                        "category": category,
                        "desc": desc,
                        "severity": severity,
                    },
                    graph_name=graph_name,
                )

                # Link risks to line items they threaten
                if category.lower() in ["liquidity", "cash"]:
                    threat_query = """
                    MATCH (rf:RiskFactor {company: $company_name, category: $category, description: $desc}),
                          (li:LineItem {company: $company_name, year: $fiscal_year})
                    WHERE li.canonical_name IN ['CASH_EQUIVALENTS', 'CURRENT_LIABILITIES', 'OPERATING_CASH_FLOW']
                    MERGE (rf)-[:THREATENS]->(li)
                    """
                    self.client.query(
                        threat_query,
                        {
                            "company_name": company_name,
                            "category": category,
                            "desc": desc,
                            "fiscal_year": int(fiscal_year),
                        },
                        graph_name=graph_name,
                    )
                elif category.lower() in ["debt", "leverage", "solvency"]:
                    threat_query = """
                    MATCH (rf:RiskFactor {company: $company_name, category: $category, description: $desc}),
                          (li:LineItem {company: $company_name, year: $fiscal_year})
                    WHERE li.canonical_name IN ['TOTAL_DEBT', 'INTEREST_EXPENSE']
                    MERGE (rf)-[:THREATENS]->(li)
                    """
                    self.client.query(
                        threat_query,
                        {
                            "company_name": company_name,
                            "category": category,
                            "desc": desc,
                            "fiscal_year": int(fiscal_year),
                        },
                        graph_name=graph_name,
                    )

        # 8. Cross-Statement Reconciliations
        self.reconcile_cross_statements(company_name, int(fiscal_year), graph_name)

        return {
            "status": "success",
            "company_name": company_name,
            "fiscal_year": fiscal_year,
            "metrics_ingested": ingested_metrics_count,
            "ratios_ingested": ratios_count,
        }

    def reconcile_cross_statements(
        self,
        company_name: str,
        fiscal_year: int,
        graph_name: Optional[str] = None,
    ) -> None:
        """Create explicit reconciliation edges between interconnected financial statements.
        
        Example: Net Income (Income Statement) reconciles into Operating Cash Flow (Cash Flow)
        and Retained Earnings (Balance Sheet).
        """
        reconciliation_cypher = """
        MATCH (ni:LineItem {company: $company, year: $year, canonical_name: 'NET_INCOME'}),
              (ocf:LineItem {company: $company, year: $year, canonical_name: 'OPERATING_CASH_FLOW'})
        MERGE (ni)-[:RECONCILES_TO {reconciliation_type: 'CashFlowBridge'}]->(ocf)
        """
        try:
            self.client.query(
                reconciliation_cypher,
                {"company": company_name, "year": fiscal_year},
                graph_name=graph_name,
            )
        except Exception as exc:
            logger.debug("Reconciliation edge notice: %s", exc)

    def link_year_over_year(
        self,
        company_name: str,
        current_year: int,
        prior_year: int,
        graph_name: Optional[str] = None,
    ) -> int:
        """Connect historical line items to calculate growth trajectories across consecutive years."""
        yoy_cypher = """
        MATCH (curr:LineItem {company: $company, year: $curr_year}),
              (prev:LineItem {company: $company, year: $prev_year, canonical_name: curr.canonical_name})
        WHERE prev.value > 0
        WITH curr, prev, ((curr.value - prev.value) / prev.value) * 100.0 AS growth_pct
        MERGE (curr)-[r:YEAR_OVER_YEAR]->(prev)
        SET r.growth_pct = growth_pct
        RETURN count(r) AS links_created
        """
        res = self.client.query(
            yoy_cypher,
            {
                "company": company_name,
                "curr_year": current_year,
                "prev_year": prior_year,
            },
            graph_name=graph_name,
        )
        return res[0]["links_created"] if res and "links_created" in res[0] else 0


graph_builder = FalkorFinancialGraphBuilder()
