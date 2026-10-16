"""FastAPI REST Endpoints for FalkorDB Knowledge Graph & AI Agent.

Exposes endpoints for multi-hop graph queries, Cypher explainability,
interactive subgraph visualization data, and graph synchronization.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.falkordb_client import falkor_client, get_falkordb
from app.db.session import get_db
from app.rag.graph_agent import graph_agent
from app.rag.graph_queries import graph_algorithms
from app.services.falkor_graph_builder import graph_builder

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["FalkorDB Knowledge Graph"])


# ── Request / Response Schemas ───────────────────────────────────────────────

class GraphQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language question or Cypher intent")
    company_name: Optional[str] = Field(None, description="Company name filter")
    year: Optional[int] = Field(None, description="Fiscal year filter")
    graph_name: Optional[str] = Field(None, description="Isolated graph/tenant name")


class GraphQueryResponse(BaseModel):
    answer: str
    tool_used: str
    company_analyzed: str
    cypher_executed: str
    subgraph_results: List[Dict[str, Any]]
    traversal_path: List[str]
    explainability: Dict[str, Any]


class SubgraphNode(BaseModel):
    id: str
    label: str
    group: str
    properties: Dict[str, Any] = {}


class SubgraphLink(BaseModel):
    source: str
    target: str
    relation: str


class SubgraphResponse(BaseModel):
    company_name: str
    nodes: List[SubgraphNode]
    links: List[SubgraphLink]


class GraphHealthResponse(BaseModel):
    status: str
    host: str
    port: int
    default_graph: str
    error: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health", response_model=GraphHealthResponse)
def check_graph_health(client=Depends(get_falkordb)):
    """Check connectivity to the FalkorDB graph instance."""
    health = client.check_health()
    return health


@router.get("/schema")
def get_graph_schema(graph_name: Optional[str] = None, client=Depends(get_falkordb)):
    """Reflect all node labels and relationship types in the FalkorDB schema."""
    return client.get_schema(graph_name)


@router.post("/query", response_model=GraphQueryResponse)
def query_graph_agent(req: GraphQueryRequest):
    """Execute natural language multi-hop graph reasoning with full Cypher proof."""
    try:
        result = graph_agent.answer_query(
            query=req.query,
            company_name=req.company_name,
            year=req.year,
            graph_name=req.graph_name,
        )
        return result
    except Exception as exc:
        logger.error("Graph agent query failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"FalkorDB query failed: {str(exc)}",
        )


@router.get("/subgraph/{company_name}", response_model=SubgraphResponse)
def get_company_subgraph(
    company_name: str,
    year: Optional[int] = None,
    client=Depends(get_falkordb),
):
    """Fetch nodes and links formatted for interactive network visualization in Next.js/Streamlit."""
    cypher = f"""
    MATCH (c:Company {{name: '{company_name}'}})-[r1:FILES]->(fy:FiscalYear)
    OPTIONAL MATCH (fy)-[r2:CONTAINS_STATEMENT]->(s:FinancialStatement)
    OPTIONAL MATCH (s)-[r3:REPORTS_METRIC]->(li:LineItem)
    OPTIONAL MATCH (fy)-[r4:HAS_RATIO]->(fr:FinancialRatio)
    OPTIONAL MATCH (li)-[r5:FEEDS_RATIO]->(fr)
    OPTIONAL MATCH (c)-[r6:EXPOSED_TO]->(rf:RiskFactor)
    OPTIONAL MATCH (rf)-[r7:THREATENS]->(li)
    RETURN c, fy, s, li, fr, rf, r1, r2, r3, r4, r5, r6, r7
    LIMIT 100
    """
    try:
        raw_rows = client.query(cypher)
        nodes_dict: Dict[str, SubgraphNode] = {}
        links: List[SubgraphLink] = []

        def add_node(entity: Any, group: str):
            if not entity or not isinstance(entity, dict):
                return
            props = entity.get("properties", {})
            name = props.get("name") or props.get("canonical_name") or props.get("category") or str(props.get("year", ""))
            node_id = f"{group}_{name}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = SubgraphNode(
                    id=node_id,
                    label=name,
                    group=group,
                    properties=props,
                )
            return node_id

        for row in raw_rows:
            c_id = add_node(row.get("c"), "Company")
            fy_id = add_node(row.get("fy"), "FiscalYear")
            s_id = add_node(row.get("s"), "Statement")
            li_id = add_node(row.get("li"), "LineItem")
            fr_id = add_node(row.get("fr"), "Ratio")
            rf_id = add_node(row.get("rf"), "Risk")

            if c_id and fy_id:
                links.append(SubgraphLink(source=c_id, target=fy_id, relation="FILES"))
            if fy_id and s_id:
                links.append(SubgraphLink(source=fy_id, target=s_id, relation="CONTAINS"))
            if s_id and li_id:
                links.append(SubgraphLink(source=s_id, target=li_id, relation="REPORTS"))
            if fy_id and fr_id:
                links.append(SubgraphLink(source=fy_id, target=fr_id, relation="HAS_RATIO"))
            if li_id and fr_id:
                links.append(SubgraphLink(source=li_id, target=fr_id, relation="FEEDS_RATIO"))
            if c_id and rf_id:
                links.append(SubgraphLink(source=c_id, target=rf_id, relation="EXPOSED_TO"))
            if rf_id and li_id:
                links.append(SubgraphLink(source=rf_id, target=li_id, relation="THREATENS"))

        # Deduplicate links
        unique_links = []
        seen = set()
        for link in links:
            key = (link.source, link.target, link.relation)
            if key not in seen:
                seen.add(key)
                unique_links.append(link)

        return SubgraphResponse(
            company_name=company_name,
            nodes=list(nodes_dict.values()),
            links=unique_links,
        )
    except Exception as exc:
        logger.error("Failed to fetch subgraph for %s: %s", company_name, exc)
        return SubgraphResponse(company_name=company_name, nodes=[], links=[])


@router.post("/sync/{document_id}")
def sync_document_to_falkor(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    """Synchronize an analyzed document's metrics, ratios, and risks into FalkorDB."""
    try:
        res = graph_builder.sync_document_to_graph(document_id, db)
        return res
    except Exception as exc:
        logger.error("Failed to sync document %s to FalkorDB: %s", document_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Graph synchronization failed: {str(exc)}",
        )


@router.post("/pagerank/risks/{company_name}")
def calculate_risk_pagerank(company_name: str):
    """Run PageRank centrality algorithm to identify the top systemic vulnerability."""
    try:
        ranked = graph_algorithms.calculate_systemic_risk_centrality(company_name)
        return {"company_name": company_name, "ranked_systemic_risks": ranked}
    except Exception as exc:
        logger.error("Failed to run risk centrality for %s: %s", company_name, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk centrality calculation failed: {str(exc)}",
        )


@router.get("/memory/session/{session_id}")
def recall_session_memories(session_id: str, limit: int = 5):
    """Retrieve episodic memories recorded for a specific conversation session."""
    from app.services.falkor_memory_manager import falkor_memory
    memories = falkor_memory.recall_recent_memories(session_id=session_id, limit=limit)
    return {"session_id": session_id, "memories": memories}


@router.get("/memory/entity/{company_name}")
def recall_entity_episodes(company_name: str, limit: int = 5):
    """Recall all historical agent analyses and decisions made on a specific company across sessions."""
    from app.services.falkor_memory_manager import falkor_memory
    episodes = falkor_memory.recall_entity_episodes(company_name=company_name, limit=limit)
    return {"company_name": company_name, "episodes": episodes}

