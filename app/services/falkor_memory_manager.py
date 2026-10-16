"""FalkorDB Cross-Session Agent Memory Manager.

Implements episodic, semantic, and procedural memory storage for AI agents,
persisting conversation state, reasoning chains, and entity references in FalkorDB.
Fulfills Graph Hacks Track 02 (Agent Memory & Coordination).
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.db.falkordb_client import falkor_client

logger = logging.getLogger("falkor_memory")


class FalkorAgentMemoryManager:
    """Manages persistent agent memory topologies inside FalkorDB."""

    def __init__(self, client=None):
        self.client = client or falkor_client

    def record_interaction(
        self,
        session_id: str,
        user_query: str,
        agent_answer: str,
        cypher_executed: Optional[str] = None,
        company_name: Optional[str] = None,
        memory_type: str = "episodic",
    ) -> Dict[str, Any]:
        """Persist an agent interaction episode and link to graph entities."""
        episode_id = f"mem_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Sanitize text for Cypher string injection
        safe_query = user_query.replace("'", "\\'").replace('"', '\\"')[:500]
        safe_answer = agent_answer.replace("'", "\\'").replace('"', '\\"')[:1000]
        safe_cypher = (cypher_executed or "").replace("'", "\\'").replace('"', '\\"')[:500]
        safe_company = (company_name or "General").replace("'", "\\'").strip()

        cypher = f"""
        MERGE (s:AgentSession {{session_id: '{session_id}'}})
        ON CREATE SET s.created_at = '{now_iso}', s.last_active = '{now_iso}'
        ON MATCH SET s.last_active = '{now_iso}'

        CREATE (m:AgentMemory {{
            id: '{episode_id}',
            memory_type: '{memory_type}',
            query: '{safe_query}',
            answer: '{safe_answer}',
            cypher_executed: '{safe_cypher}',
            timestamp: '{now_iso}',
            company: '{safe_company}'
        }})

        CREATE (s)-[:HAS_MEMORY]->(m)
        """

        if company_name and company_name.strip():
            cypher += f"""
            WITH m
            MERGE (c:Company {{name: '{safe_company}'}})
            MERGE (m)-[:ANCHORS_TO]->(c)
            """

        cypher += " RETURN m.id AS memory_id, m.timestamp AS timestamp"

        try:
            res = self.client.execute_query(cypher)
            record_id = res[0]["memory_id"] if res else episode_id
            logger.info("agent_memory_recorded session_id=%s memory_id=%s", session_id, record_id)
            return {"memory_id": record_id, "timestamp": now_iso, "status": "persisted"}
        except Exception as e:
            logger.warning("falkor_memory_persist_error: %s", e)
            return {"status": "error", "error": str(e)}

    def recall_recent_memories(self, session_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve recent interaction memories for a session to maintain conversational continuity."""
        cypher = f"""
        MATCH (s:AgentSession {{session_id: '{session_id}'}})-[:HAS_MEMORY]->(m:AgentMemory)
        RETURN m.id AS id, m.query AS query, m.answer AS answer,
               m.cypher_executed AS cypher, m.timestamp AS timestamp,
               m.company AS company
        ORDER BY m.timestamp DESC
        LIMIT {limit}
        """
        try:
            records = self.client.execute_query(cypher)
            return records
        except Exception as e:
            logger.warning("falkor_memory_recall_error", error=str(e))
            return []

    def recall_entity_episodes(self, company_name: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Recall all historical agent analyses and decisions made on a specific company across sessions."""
        safe_company = company_name.replace("'", "\\'").strip()
        cypher = f"""
        MATCH (m:AgentMemory)-[:ANCHORS_TO]->(c:Company {{name: '{safe_company}'}})
        OPTIONAL MATCH (s:AgentSession)-[:HAS_MEMORY]->(m)
        RETURN m.id AS id, m.query AS query, m.answer AS answer,
               m.cypher_executed AS cypher, m.timestamp AS timestamp,
               s.session_id AS session_id
        ORDER BY m.timestamp DESC
        LIMIT {limit}
        """
        try:
            return self.client.execute_query(cypher)
        except Exception as e:
            logger.warning("falkor_entity_recall_error", error=str(e))
            return []


# Global memory manager instance
falkor_memory = FalkorAgentMemoryManager()
