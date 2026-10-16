"""Model Context Protocol (MCP) Server for FalkorDB Financial Knowledge Graph.

Exposes FalkorDB graph algorithms and Cypher queries as standardized MCP tools,
enabling autonomous agents (Claude Desktop, Antigravity, LLM agents) to select
and execute graph operations.
Fulfills Graph Hacks Track 01 (Tool Selection through MCP).
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict, List, Optional

from app.db.falkordb_client import falkor_client
from app.rag.graph_queries import FalkorGraphAlgorithms, FinancialGraphQueries

# MCP Tool Catalog
MCP_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "falkor_query_graph",
        "description": "Execute a Cypher query on FalkorDB to traverse financial entities, ratios, and risk factors.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "cypher": {
                    "type": "string",
                    "description": "Read-only Cypher query to execute on the graph.",
                },
                "graph_name": {
                    "type": "string",
                    "description": "Optional FalkorDB graph name (defaults to fin_kg).",
                },
            },
            "required": ["cypher"],
        },
    },
    {
        "name": "falkor_get_risk_pagerank",
        "description": "Compute PageRank centrality on corporate risk factors to identify systemic financial vulnerabilities.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "description": "Name of the target company (e.g. 'Tesla Inc', 'Tata Motors').",
                },
            },
            "required": ["company_name"],
        },
    },
    {
        "name": "falkor_get_shortest_contagion_path",
        "description": "Find the shortest relational contagion path from a qualitative risk disclosure to the company solvency score.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "description": "Target company name.",
                },
                "risk_category": {
                    "type": "string",
                    "description": "Category of risk factor (e.g., 'Supply Chain', 'Commodity Price', 'Regulatory').",
                },
            },
            "required": ["company_name", "risk_category"],
        },
    },
    {
        "name": "falkor_get_company_subgraph",
        "description": "Extract the complete corporate knowledge subgraph for visual rendering or multi-hop context expansion.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "description": "Target corporate entity name.",
                },
            },
            "required": ["company_name"],
        },
    },
    {
        "name": "falkor_reconcile_statements",
        "description": "Traverse cross-statement edges to audit Net Income (Income Statement) against Operating Cash Flow (Cash Flow Statement).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "description": "Company name to reconcile.",
                },
                "year": {
                    "type": "integer",
                    "description": "Fiscal year (optional).",
                },
            },
            "required": ["company_name"],
        },
    },
]


class FalkorMCPServer:
    """Dispatches tool calls using FalkorDB as the context layer."""

    def __init__(self, client=None):
        self.client = client or falkor_client
        self.algorithms = FalkorGraphAlgorithms(client=self.client)

    def list_tools(self) -> List[Dict[str, Any]]:
        """Return registered tool definitions conforming to MCP spec."""
        return MCP_TOOLS

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the specified MCP tool against FalkorDB."""
        if tool_name == "falkor_query_graph":
            cypher = arguments.get("cypher", "")
            graph_name = arguments.get("graph_name")
            data = self.client.query(cypher, graph_name=graph_name)
            return {"status": "success", "tool": tool_name, "results": data}

        elif tool_name == "falkor_get_risk_pagerank":
            company = arguments.get("company_name", "")
            data = self.algorithms.calculate_risk_centrality(company)
            return {"status": "success", "tool": tool_name, "company": company, "pagerank_risks": data}

        elif tool_name == "falkor_get_shortest_contagion_path":
            company = arguments.get("company_name", "")
            category = arguments.get("risk_category", "")
            data = self.algorithms.shortest_path_contagion(company, category)
            return {"status": "success", "tool": tool_name, "contagion_path": data}

        elif tool_name == "falkor_get_company_subgraph":
            company = arguments.get("company_name", "")
            cypher = FinancialGraphQueries.get_company_full_topology(company)
            raw = self.client.query(cypher)
            return {"status": "success", "tool": tool_name, "nodes_and_edges": raw}

        elif tool_name == "falkor_reconcile_statements":
            company = arguments.get("company_name", "")
            year = arguments.get("year")
            cypher = FinancialGraphQueries.cross_statement_reconciliation(company, year)
            data = self.client.query(cypher)
            return {"status": "success", "tool": tool_name, "reconciliation": data}

        else:
            return {"status": "error", "error": f"Unknown MCP tool '{tool_name}'"}


# Global MCP instance
falkor_mcp = FalkorMCPServer()


def main():
    """CLI loop for stdin/stdout JSON-RPC standard MCP interaction."""
    server = FalkorMCPServer()
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
            method = req.get("method")
            msg_id = req.get("id")

            if method == "tools/list":
                resp = {"jsonrpc": "2.0", "id": msg_id, "result": {"tools": server.list_tools()}}
            elif method == "tools/call":
                params = req.get("params", {})
                name = params.get("name")
                args = params.get("arguments", {})
                out = server.execute_tool(name, args)
                resp = {"jsonrpc": "2.0", "id": msg_id, "result": {"content": [{"type": "text", "text": json.dumps(out)}]}}
            else:
                resp = {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": "Method not found"}}

            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            sys.stderr.write(f"MCP error: {e}\n")


if __name__ == "__main__":
    main()
