"""Seed script to populate FalkorDB with multi-hop corporate financial graphs.

Run via:
    python scripts/seed_falkordb.py

Creates rich graph topologies for test corporate entities (Tesla, Tata Motors, Reliance)
with cross-statement line items, calculated ratios, risk contagion edges, and year-over-year links.
"""

import sys
import logging
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.falkordb_client import falkor_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_falkordb")


SAMPLE_CORPORATIONS = [
    {
        "name": "Tesla Inc",
        "ticker": "TSLA",
        "sector": "Automotive & Energy",
        "years": [
            {
                "year": 2024,
                "metrics": {
                    "REVENUE": (96770.0, "USD_M", "IncomeStatement"),
                    "OPERATING_INCOME": (8890.0, "USD_M", "IncomeStatement"),
                    "NET_INCOME": (14997.0, "USD_M", "IncomeStatement"),
                    "TOTAL_DEBT": (9500.0, "USD_M", "BalanceSheet"),
                    "CASH_EQUIVALENTS": (29094.0, "USD_M", "BalanceSheet"),
                    "CURRENT_ASSETS": (49616.0, "USD_M", "BalanceSheet"),
                    "CURRENT_LIABILITIES": (28748.0, "USD_M", "BalanceSheet"),
                    "OPERATING_CASH_FLOW": (13256.0, "USD_M", "CashFlow"),
                    "CAPEX": (8898.0, "USD_M", "CashFlow"),
                },
                "ratios": {
                    "CurrentRatio": (1.73, "HEALTHY"),
                    "QuickRatio": (1.01, "HEALTHY"),
                    "DebtToEquity": (0.15, "HEALTHY"),
                    "OperatingMargin": (9.18, "HEALTHY"),
                    "InterestCoverage": (24.5, "HEALTHY"),
                },
            },
            {
                "year": 2023,
                "metrics": {
                    "REVENUE": (81462.0, "USD_M", "IncomeStatement"),
                    "OPERATING_INCOME": (13656.0, "USD_M", "IncomeStatement"),
                    "NET_INCOME": (12583.0, "USD_M", "IncomeStatement"),
                    "TOTAL_DEBT": (5748.0, "USD_M", "BalanceSheet"),
                    "CASH_EQUIVALENTS": (22185.0, "USD_M", "BalanceSheet"),
                    "CURRENT_ASSETS": (40917.0, "USD_M", "BalanceSheet"),
                    "CURRENT_LIABILITIES": (26709.0, "USD_M", "BalanceSheet"),
                    "OPERATING_CASH_FLOW": (14724.0, "USD_M", "CashFlow"),
                },
                "ratios": {
                    "CurrentRatio": (1.53, "HEALTHY"),
                    "QuickRatio": (0.83, "WARNING"),
                    "DebtToEquity": (0.13, "HEALTHY"),
                    "OperatingMargin": (16.76, "HEALTHY"),
                    "InterestCoverage": (35.2, "HEALTHY"),
                },
            },
        ],
        "risks": [
            ("Supply Chain", "CRITICAL", "Lithium and rare earth battery metal export curbs threat to vehicle margins"),
            ("Regulatory", "HIGH", "Autonomous driving regulatory inquiries and tariff impositions in EU/China"),
            ("Price War", "HIGH", "Aggressive EV price reductions pressuring automotive gross margins"),
        ],
    },
    {
        "name": "Tata Motors",
        "ticker": "TATAMOTORS",
        "sector": "Automotive",
        "years": [
            {
                "year": 2024,
                "metrics": {
                    "REVENUE": (437928.0, "INR_CR", "IncomeStatement"),
                    "OPERATING_INCOME": (44275.0, "INR_CR", "IncomeStatement"),
                    "NET_INCOME": (31807.0, "INR_CR", "IncomeStatement"),
                    "TOTAL_DEBT": (84000.0, "INR_CR", "BalanceSheet"),
                    "CASH_EQUIVALENTS": (45000.0, "INR_CR", "BalanceSheet"),
                    "CURRENT_ASSETS": (155000.0, "INR_CR", "BalanceSheet"),
                    "CURRENT_LIABILITIES": (162000.0, "INR_CR", "BalanceSheet"),
                    "OPERATING_CASH_FLOW": (56000.0, "INR_CR", "CashFlow"),
                },
                "ratios": {
                    "CurrentRatio": (0.95, "CRITICAL"),
                    "QuickRatio": (0.58, "CRITICAL"),
                    "DebtToEquity": (1.12, "HIGH_LEVERAGE"),
                    "OperatingMargin": (10.1, "HEALTHY"),
                    "InterestCoverage": (4.2, "HEALTHY"),
                },
            }
        ],
        "risks": [
            ("Liquidity", "CRITICAL", "Current liabilities exceed current assets requiring short-term commercial paper rollover"),
            ("Interest Rate", "HIGH", "High floating-rate foreign currency borrowing exposed to central bank rate changes"),
            ("Commodity Inflation", "MEDIUM", "Rising steel and aluminium input costs impacting commercial vehicle profitability"),
        ],
    },
]


def seed_falkordb_graphs():
    """Populates FalkorDB knowledge graph with corporate nodes and multi-hop relationships."""
    logger.info("Connecting to FalkorDB on %s:%s...", falkor_client.host, falkor_client.port)
    
    # 1. Clear existing graph to ensure deterministic demo seed
    try:
        falkor_client.clear_graph()
        logger.info("Cleared prior graph data.")
    except Exception as exc:
        logger.warning("Could not clear prior graph (might be new instance): %s", exc)

    # 2. Iterate through sample corporations
    total_nodes = 0
    total_edges = 0

    for corp in SAMPLE_CORPORATIONS:
        c_name = corp["name"]
        ticker = corp.get("ticker", "")
        sector = corp.get("sector", "")

        # Create Company Node
        falkor_client.query(
            "MERGE (c:Company {name: $name}) SET c.ticker = $ticker, c.sector = $sector",
            {"name": c_name, "ticker": ticker, "sector": sector},
        )
        total_nodes += 1

        # Ingest Risks
        for cat, sev, desc in corp.get("risks", []):
            falkor_client.query(
                """
                MATCH (c:Company {name: $name})
                MERGE (rf:RiskFactor {company: $name, category: $cat, description: $desc})
                SET rf.severity = $sev
                MERGE (c)-[:EXPOSED_TO]->(rf)
                """,
                {"name": c_name, "cat": cat, "sev": sev, "desc": desc},
            )
            total_nodes += 1
            total_edges += 2

        # Ingest Fiscal Years & Line Items
        for y_data in corp.get("years", []):
            yr = y_data["year"]
            falkor_client.query(
                """
                MATCH (c:Company {name: $name})
                MERGE (fy:FiscalYear {company: $name, year: $yr})
                MERGE (c)-[:FILES]->(fy)
                """,
                {"name": c_name, "yr": yr},
            )
            total_nodes += 1
            total_edges += 1

            # Ingest Statements & Metrics
            for m_name, (m_val, m_unit, m_stmt) in y_data.get("metrics", []).items():
                falkor_client.query(
                    """
                    MATCH (fy:FiscalYear {company: $name, year: $yr})
                    MERGE (s:FinancialStatement {company: $name, year: $yr, statement_type: $stmt})
                    MERGE (fy)-[:CONTAINS_STATEMENT]->(s)
                    MERGE (li:LineItem {company: $name, year: $yr, canonical_name: $m_name})
                    SET li.value = $val, li.unit = $unit
                    MERGE (s)-[:REPORTS_METRIC]->(li)
                    """,
                    {"name": c_name, "yr": yr, "stmt": m_stmt, "m_name": m_name, "val": m_val, "unit": m_unit},
                )
                total_nodes += 2
                total_edges += 2

            # Ingest Ratios
            for r_name, (r_val, r_stat) in y_data.get("ratios", []).items():
                falkor_client.query(
                    """
                    MATCH (fy:FiscalYear {company: $name, year: $yr})
                    MERGE (fr:FinancialRatio {company: $name, year: $yr, name: $r_name})
                    SET fr.value = $val, fr.benchmark_status = $status
                    MERGE (fy)-[:HAS_RATIO]->(fr)
                    """,
                    {"name": c_name, "yr": yr, "r_name": r_name, "val": r_val, "status": r_stat},
                )
                total_nodes += 1
                total_edges += 1

                # Connect LineItems to Ratios
                falkor_client.query(
                    """
                    MATCH (li:LineItem {company: $name, year: $yr}), (fr:FinancialRatio {company: $name, year: $yr, name: $r_name})
                    WHERE (fr.name = 'CurrentRatio' AND li.canonical_name IN ['CURRENT_ASSETS', 'CURRENT_LIABILITIES'])
                       OR (fr.name = 'QuickRatio' AND li.canonical_name IN ['CASH_EQUIVALENTS', 'CURRENT_LIABILITIES'])
                       OR (fr.name = 'DebtToEquity' AND li.canonical_name IN ['TOTAL_DEBT'])
                       OR (fr.name = 'OperatingMargin' AND li.canonical_name IN ['OPERATING_INCOME', 'REVENUE'])
                    MERGE (li)-[:FEEDS_RATIO]->(fr)
                    """,
                    {"name": c_name, "yr": yr, "r_name": r_name},
                )
                total_edges += 1

            # Connect Risks to Threatened Line Items
            falkor_client.query(
                """
                MATCH (rf:RiskFactor {company: $name}), (li:LineItem {company: $name, year: $yr})
                WHERE (toLower(rf.category) CONTAINS 'liquidity' AND li.canonical_name IN ['CASH_EQUIVALENTS', 'CURRENT_LIABILITIES'])
                   OR (toLower(rf.category) CONTAINS 'interest' AND li.canonical_name IN ['TOTAL_DEBT'])
                   OR (toLower(rf.category) CONTAINS 'supply' AND li.canonical_name IN ['REVENUE', 'OPERATING_INCOME'])
                   OR (toLower(rf.category) CONTAINS 'price' AND li.canonical_name IN ['OPERATING_INCOME'])
                MERGE (rf)-[:THREATENS]->(li)
                """,
                {"name": c_name, "yr": yr},
            )
            total_edges += 2

            # Connect Cash Flow Reconciliation Bridge
            falkor_client.query(
                """
                MATCH (ni:LineItem {company: $name, year: $yr, canonical_name: 'NET_INCOME'}),
                      (ocf:LineItem {company: $name, year: $yr, canonical_name: 'OPERATING_CASH_FLOW'})
                MERGE (ni)-[:RECONCILES_TO {reconciliation_type: 'CashConversion'}]->(ocf)
                """,
                {"name": c_name, "yr": yr},
            )
            total_edges += 1

        # Link Year-over-Year Trajectory
        falkor_client.query(
            """
            MATCH (curr:LineItem {company: $name, year: 2024}),
                  (prev:LineItem {company: $name, year: 2023, canonical_name: curr.canonical_name})
            WHERE prev.value > 0
            WITH curr, prev, ((curr.value - prev.value) / prev.value) * 100.0 AS growth_pct
            MERGE (curr)-[r:YEAR_OVER_YEAR]->(prev)
            SET r.growth_pct = growth_pct
            """,
            {"name": c_name},
        )
        total_edges += 3

    logger.info(
        "Successfully seeded FalkorDB! Ingested %d companies with rich multi-hop graphs.",
        len(SAMPLE_CORPORATIONS),
    )


if __name__ == "__main__":
    try:
        seed_falkordb_graphs()
    except Exception as exc:
        logger.error("Seeding failed: %s", exc)
        sys.exit(1)
