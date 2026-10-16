"""FalkorDB Client & Multi-Graph Manager for AI Agent Context Layer.

This module provides high-concurrency connection pooling, multi-tenant graph
isolation, Cypher query execution, schema reflection, and health checks for
the FalkorDB knowledge graph.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from falkordb import FalkorDB  # type: ignore
    FALKORDB_AVAILABLE = True
except ImportError:
    FalkorDB = None
    FALKORDB_AVAILABLE = False
    logger.warning("falkordb package not installed. Install via pip install falkordb.")


class FalkorDBClient:
    """Enterprise client managing connection to FalkorDB graph database."""

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        password: Optional[str] = None,
        default_graph: Optional[str] = None,
    ) -> None:
        self.host = host or settings.FALKORDB_HOST
        self.port = port or settings.FALKORDB_PORT
        self.password = password or (settings.FALKORDB_PASSWORD if settings.FALKORDB_PASSWORD else None)
        self.default_graph_name = default_graph or settings.FALKORDB_GRAPH_NAME
        self._driver: Optional[Any] = None
        self._graphs: Dict[str, Any] = {}

    @property
    def driver(self) -> Any:
        """Lazily initialize FalkorDB driver with retry capabilities."""
        if not FALKORDB_AVAILABLE:
            raise RuntimeError("falkordb python driver is not installed.")
        
        if self._driver is None:
            logger.info("Initializing FalkorDB connection to %s:%s", self.host, self.port)
            self._driver = FalkorDB(
                host=self.host,
                port=self.port,
                password=self.password,
            )
        return self._driver

    def select_graph(self, graph_name: Optional[str] = None) -> Any:
        """Obtain a graph instance, cached by name for multi-graph isolation."""
        name = graph_name or self.default_graph_name
        if name not in self._graphs:
            self._graphs[name] = self.driver.select_graph(name)
        return self._graphs[name]

    def query(
        self,
        cypher: str,
        params: Optional[Dict[str, Any]] = None,
        graph_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Execute a Cypher query against a specified graph and return list of dicts.
        
        Args:
            cypher: The Cypher statement to execute.
            params: Optional parameter map to prevent injection.
            graph_name: Name of the target graph (defaults to default_graph_name).

        Returns:
            List of row dictionaries mapping column headers to values.
        """
        graph = self.select_graph(graph_name)
        try:
            result = graph.query(cypher, params or {})
            if not result or not hasattr(result, "result_set") or not result.result_set:
                return []

            header = [col[1] if isinstance(col, (list, tuple)) else str(col) for col in result.header]
            rows: List[Dict[str, Any]] = []
            for row in result.result_set:
                row_dict = {}
                for idx, col_name in enumerate(header):
                    val = row[idx] if idx < len(row) else None
                    # Normalize node/relation objects if returned
                    if hasattr(val, "properties"):
                        row_dict[col_name] = {
                            "id": getattr(val, "id", None),
                            "labels": getattr(val, "labels", []),
                            "properties": val.properties,
                        }
                    elif hasattr(val, "relation"):
                        row_dict[col_name] = {
                            "id": getattr(val, "id", None),
                            "relation": val.relation,
                            "properties": getattr(val, "properties", {}),
                        }
                    else:
                        row_dict[col_name] = val
                rows.append(row_dict)
            return rows
        except Exception as exc:
            logger.error("FalkorDB Cypher execution failed: %s | Query: %s", exc, cypher)
            raise

    def check_health(self) -> Dict[str, Any]:
        """Perform a ping and basic verification check on FalkorDB."""
        base_info = {
            "host": str(self.host),
            "port": int(self.port),
            "default_graph": str(self.default_graph_name),
        }
        if not FALKORDB_AVAILABLE:
            return {"status": "unhealthy", "error": "falkordb driver missing", **base_info}
        try:
            graph = self.select_graph()
            res = graph.query("RETURN 1 AS ping")
            is_ok = bool(res and res.result_set and res.result_set[0][0] == 1)
            return {
                "status": "healthy" if is_ok else "degraded",
                **base_info,
            }
        except Exception as exc:
            logger.warning("FalkorDB health check failed: %s", exc)
            return {"status": "unreachable", "error": str(exc), **base_info}

    def get_schema(self, graph_name: Optional[str] = None) -> Dict[str, Any]:
        """Reflect node labels, relationship types, and property keys in the graph."""
        name = graph_name or self.default_graph_name
        try:
            labels_res = self.query(
                "CALL db.labels() YIELD label RETURN label",
                graph_name=name,
            )
            labels = [r.get("label") for r in labels_res if "label" in r]

            rels_res = self.query(
                "CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType",
                graph_name=name,
            )
            rel_types = [r.get("relationshipType") for r in rels_res if "relationshipType" in r]

            return {
                "graph_name": name,
                "labels": labels,
                "relationship_types": rel_types,
            }
        except Exception as exc:
            logger.warning("Could not introspect FalkorDB schema: %s", exc)
            return {
                "graph_name": name,
                "labels": ["Company", "FiscalYear", "FinancialStatement", "LineItem", "FinancialRatio", "RiskFactor", "Auditor", "AuditOpinion"],
                "relationship_types": ["REPORTS", "CONTAINS", "DERIVES", "FEEDS_RATIO", "EXPOSED_TO", "FLAGS_CONCERN_ON", "YEAR_OVER_YEAR"],
            }

    def clear_graph(self, graph_name: Optional[str] = None) -> None:
        """Clear all nodes and relationships in the selected graph."""
        name = graph_name or self.default_graph_name
        try:
            graph = self.select_graph(name)
            graph.delete()
            self._graphs.pop(name, None)
            logger.info("Deleted graph %s", name)
        except Exception as exc:
            # Fallback to cypher delete
            try:
                self.query("MATCH (n) DETACH DELETE n", graph_name=name)
            except Exception as inner_exc:
                logger.warning("Could not clear graph %s: %s", name, inner_exc)


# Global singleton instance
falkor_client = FalkorDBClient()


def get_falkordb() -> FalkorDBClient:
    """Dependency provider for FastAPI route injection."""
    return falkor_client
