import { apiClient } from "@/lib/api-client";

export interface GraphQueryRequest {
  query: string;
  company_name?: string;
  year?: number;
  graph_name?: string;
}

export interface GraphQueryResponse {
  answer: string;
  tool_used: string;
  company_analyzed: string;
  cypher_executed: string;
  subgraph_results: Record<string, unknown>[];
  traversal_path: string[];
  explainability: {
    engine: string;
    execution_time_ms: number;
    nodes_evaluated: number;
    is_graph_grounded: boolean;
  };
}

export interface SubgraphNode {
  id: string;
  label: string;
  group: string;
  properties: Record<string, unknown>;
}

export interface SubgraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface SubgraphResponse {
  company_name: string;
  nodes: SubgraphNode[];
  links: SubgraphLink[];
}

export const graphService = {
  async queryGraph(payload: GraphQueryRequest): Promise<GraphQueryResponse> {
    const { data } = await apiClient.post<GraphQueryResponse>("/graph/query", payload);
    return data;
  },

  async getSubgraph(companyName: string, year?: number): Promise<SubgraphResponse> {
    const { data } = await apiClient.get<SubgraphResponse>(`/graph/subgraph/${encodeURIComponent(companyName)}`, {
      params: year ? { year } : {},
    });
    return data;
  },

  async getRiskPageRank(companyName: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.post<Record<string, unknown>>(`/graph/pagerank/risks/${encodeURIComponent(companyName)}`);
    return data;
  },

  async checkHealth(): Promise<{ status: string; host: string; port: number }> {
    const { data } = await apiClient.get("/graph/health");
    return data;
  },
};
