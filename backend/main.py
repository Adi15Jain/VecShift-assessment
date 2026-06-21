"""VectorShift Pipeline API.

Parses a pipeline (nodes + edges) and reports its size and whether it forms a
valid DAG. Built to be robust under load rather than a throwaway demo:

  * Request-size limits guard against pathological / abusive payloads (DoS).
  * Pure, linear-time graph logic lives in graph.py and is unit-tested.
  * CORS origins are configurable via env for real deployments.
  * A /health endpoint supports load-balancer / container health checks.
"""

import logging
import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from graph import is_dag

logger = logging.getLogger("vectorshift.pipeline")

# --- limits -------------------------------------------------------------
# Bound the work any single request can ask the server to do. The graph
# algorithm is O(V+E), so these caps keep worst-case latency and memory
# predictable under concurrent load.
MAX_NODES = int(os.getenv("MAX_NODES", "5000"))
MAX_EDGES = int(os.getenv("MAX_EDGES", "20000"))

app = FastAPI(title="VectorShift Pipeline API", version="1.0.0")

# CORS. Exact origins come from CORS_ORIGINS (comma-separated), defaulting to the
# local dev server on both common ports. The deployed frontend lives on Vercel,
# whose preview/production URLs vary, so a regex (CORS_ORIGIN_REGEX) allows any
# *.vercel.app origin. An origin is accepted if it's in the list OR matches the
# regex. Set CORS_ORIGINS="*" to allow everything.
_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,"
    "http://127.0.0.1:3000,http://127.0.0.1:3001",
).split(",")
_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()] or ["*"],
    allow_origin_regex=_origin_regex,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --- schema -------------------------------------------------------------
class Node(BaseModel):
    id: str
    # Nodes carry many other fields (type, position, data); we only need the id.
    model_config = {"extra": "allow"}


class Edge(BaseModel):
    source: str
    target: str
    model_config = {"extra": "allow"}


class Pipeline(BaseModel):
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)


class PipelineAnalysis(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


# --- routes -------------------------------------------------------------
@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.get("/health")
def health():
    """Liveness probe for orchestrators / load balancers."""
    return {"status": "ok"}


@app.post("/pipelines/parse", response_model=PipelineAnalysis)
def parse_pipeline(pipeline: Pipeline) -> PipelineAnalysis:
    num_nodes = len(pipeline.nodes)
    num_edges = len(pipeline.edges)

    # Reject oversized payloads before doing any graph work.
    if num_nodes > MAX_NODES or num_edges > MAX_EDGES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Pipeline too large: max {MAX_NODES} nodes and "
                f"{MAX_EDGES} edges."
            ),
        )

    node_ids = [n.id for n in pipeline.nodes]
    edges = [(e.source, e.target) for e in pipeline.edges]
    dag = is_dag(node_ids, edges)

    logger.info(
        "parsed pipeline nodes=%d edges=%d is_dag=%s",
        num_nodes,
        num_edges,
        dag,
    )

    return PipelineAnalysis(
        num_nodes=num_nodes,
        num_edges=num_edges,
        is_dag=dag,
    )
