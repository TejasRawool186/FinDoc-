"""Model Context Protocol (MCP) HTTP REST endpoints.

Allows AI agents and frontends to discover and execute FalkorDB graph tools
via standard MCP schemas over HTTP.
Fulfills Graph Hacks Track 01 (Tool Selection through MCP).
"""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.mcp.falkor_mcp_server import falkor_mcp

router = APIRouter(prefix="/mcp", tags=["Model Context Protocol (MCP)"])


class MCPToolCallRequest(BaseModel):
    tool_name: str = Field(..., description="Name of the MCP tool to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments for the tool")


@router.get("/tools", summary="List all FalkorDB MCP tools")
def list_mcp_tools() -> Dict[str, Any]:
    """Return all available FalkorDB tools formatted according to the MCP specification."""
    return {"tools": falkor_mcp.list_tools()}


@router.post("/call", summary="Execute an MCP tool against FalkorDB")
def execute_mcp_tool(payload: MCPToolCallRequest) -> Dict[str, Any]:
    """Invoke an MCP graph tool and return the resulting graph context."""
    res = falkor_mcp.execute_tool(payload.tool_name, payload.arguments)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res
