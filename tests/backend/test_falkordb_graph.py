"""Automated unit and integration tests for FalkorDB Knowledge Graph & AI Agent."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.db.falkordb_client import FalkorDBClient
from app.main import app
from app.rag.graph_agent import FalkorFinancialAgent, graph_agent
from app.rag.graph_queries import FinancialGraphQueries, FalkorGraphAlgorithms


@pytest.fixture
def test_client():
    return TestClient(app)


def test_falkordb_client_initialization():
    """Verify FalkorDB client configures host, port, and default graph."""
    client = FalkorDBClient(host="127.0.0.1", port=6379, default_graph="test_graph")
    assert client.host == "127.0.0.1"
    assert client.port == 6379
    assert client.default_graph_name == "test_graph"


def test_cypher_template_generation():
    """Verify Cypher query templates generate valid statements with parameters."""
    topology_cypher = FinancialGraphQueries.get_company_full_topology("Tesla Inc", 2024)
    assert "MATCH (c:Company {name: 'Tesla Inc'})" in topology_cypher
    assert "WHERE fy.year = 2024" in topology_cypher

    risk_path_cypher = FinancialGraphQueries.multi_hop_risk_to_metric_path("Tesla Inc", "Liquidity")
    assert "MATCH path = (rf:RiskFactor {company: 'Tesla Inc'})-[:THREATENS]->" in risk_path_cypher

    recon_cypher = FinancialGraphQueries.cross_statement_reconciliation("Tesla Inc", 2024)
    assert "canonical_name: 'NET_INCOME'" in recon_cypher
    assert "canonical_name: 'OPERATING_CASH_FLOW'" in recon_cypher


def test_graph_agent_tool_selection():
    """Verify the FalkorDB agent correctly routes natural language queries to graph tools."""
    mock_falkor = MagicMock()
    mock_falkor.query.return_value = [
        {"category": "Liquidity", "description": "Short-term debt maturity", "centrality_score": 15.5}
    ]
    agent = FalkorFinancialAgent(client=mock_falkor)

    # 1. Systemic Risk query routing
    res1 = agent.answer_query("What is the top systemic risk across the company's balance sheet?", company_name="Tesla Inc")
    assert res1["tool_used"] == "systemic_risk_centrality"
    assert "Systemic Risk Analysis" in res1["answer"]
    assert res1["explainability"]["is_graph_grounded"] is True

    # 2. Cross-statement reconciliation routing
    mock_falkor.query.return_value = [
        {"net_income": 1000.0, "operating_cash_flow": 1200.0, "accrual_delta": 200.0, "earnings_quality_flag": "Solid Cash Conversion"}
    ]
    res2 = agent.answer_query("Verify Net Income to Operating Cash Flow reconciliation", company_name="Tesla Inc", year=2024)
    assert res2["tool_used"] == "cross_statement_reconciliation"
    assert "Cross-Statement Integrity" in res2["answer"]

    # 3. YoY Growth routing
    mock_falkor.query.return_value = [
        {"current_year": 2024, "current_value": 96770.0, "prior_year": 2023, "prior_value": 81462.0, "yoy_growth_percentage": 18.8}
    ]
    res3 = agent.answer_query("Analyze year over year revenue growth trajectory", company_name="Tesla Inc")
    assert res3["tool_used"] == "yoy_trajectory_traversal"
    assert "Trajectory Traversal" in res3["answer"]


def test_graph_api_endpoints(test_client):
    """Verify FastAPI /api/v1/graph endpoints respond cleanly."""
    # 1. Health check
    resp_health = test_client.get("/api/v1/graph/health")
    assert resp_health.status_code == 200
    data_health = resp_health.json()
    assert "status" in data_health
    assert data_health["port"] == 6379

    # 2. Schema introspection
    resp_schema = test_client.get("/api/v1/graph/schema")
    assert resp_schema.status_code == 200
    data_schema = resp_schema.json()
    assert "labels" in data_schema
    assert "relationship_types" in data_schema

    # 3. Query agent endpoint with mock response
    payload = {
        "query": "Identify top systemic risks using FalkorDB Centrality",
        "company_name": "Tesla Inc",
        "year": 2024,
    }
    mock_answer = {
        "answer": "Systemic risk identified: Liquidity",
        "tool_used": "systemic_risk_centrality",
        "company_analyzed": "Tesla Inc",
        "cypher_executed": "MATCH (rf:RiskFactor) RETURN rf",
        "subgraph_results": [{"category": "Liquidity"}],
        "traversal_path": ["RiskFactor -> LineItem"],
        "explainability": {
            "engine": "FalkorDB Graph Context Layer",
            "execution_time_ms": 12.5,
            "nodes_evaluated": 1,
            "is_graph_grounded": True,
        },
    }
    with patch.object(graph_agent, "answer_query", return_value=mock_answer):
        resp_query = test_client.post("/api/v1/graph/query", json=payload)
        assert resp_query.status_code == 200
        data_query = resp_query.json()
        assert "answer" in data_query
        assert "cypher_executed" in data_query
        assert "explainability" in data_query
        assert data_query["explainability"]["is_graph_grounded"] is True
