"""Tests for the pipeline API: pure DAG logic + the HTTP endpoint.

Run with:  cd backend && pip install -r requirements.txt && pytest
"""

from fastapi.testclient import TestClient

from graph import is_dag
from main import app

client = TestClient(app)


# --- pure graph logic ---------------------------------------------------
def test_is_dag_acyclic():
    assert is_dag(["a", "b", "c"], [("a", "b"), ("b", "c")]) is True


def test_is_dag_cycle():
    assert is_dag(["a", "b"], [("a", "b"), ("b", "a")]) is False


def test_is_dag_self_loop():
    assert is_dag(["a"], [("a", "a")]) is False


def test_is_dag_empty():
    assert is_dag([], []) is True


def test_is_dag_disconnected_nodes():
    # No edges → trivially acyclic.
    assert is_dag(["a", "b", "c"], []) is True


def test_is_dag_ignores_unknown_edge_endpoints():
    # Edge references a node that doesn't exist; it should be ignored.
    assert is_dag(["a", "b"], [("a", "b"), ("b", "ghost")]) is True


def test_is_dag_diamond():
    # a -> b -> d, a -> c -> d  (no cycle)
    edges = [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]
    assert is_dag(["a", "b", "c", "d"], edges) is True


def test_is_dag_three_node_cycle():
    # a -> b -> c -> a  (a longer cycle, not just a back-and-forth)
    edges = [("a", "b"), ("b", "c"), ("c", "a")]
    assert is_dag(["a", "b", "c"], edges) is False


def test_is_dag_parallel_edges_no_cycle():
    # Two identical a -> b edges plus b -> c: still acyclic.
    edges = [("a", "b"), ("a", "b"), ("b", "c")]
    assert is_dag(["a", "b", "c"], edges) is True


def test_is_dag_cycle_with_extra_tail():
    # A cycle (b<->c) hanging off an acyclic head (a -> b): not a DAG.
    edges = [("a", "b"), ("b", "c"), ("c", "b")]
    assert is_dag(["a", "b", "c"], edges) is False


def test_is_dag_large_chain_scales():
    n = 10000
    ids = [str(i) for i in range(n)]
    edges = [(str(i), str(i + 1)) for i in range(n - 1)]
    assert is_dag(ids, edges) is True


# --- HTTP endpoint ------------------------------------------------------
def test_parse_counts_and_dag():
    body = {
        "nodes": [{"id": "a"}, {"id": "b"}, {"id": "c"}],
        "edges": [
            {"source": "a", "target": "b"},
            {"source": "b", "target": "c"},
        ],
    }
    res = client.post("/pipelines/parse", json=body)
    assert res.status_code == 200
    assert res.json() == {"num_nodes": 3, "num_edges": 2, "is_dag": True}


def test_parse_detects_cycle():
    body = {
        "nodes": [{"id": "a"}, {"id": "b"}],
        "edges": [
            {"source": "a", "target": "b"},
            {"source": "b", "target": "a"},
        ],
    }
    res = client.post("/pipelines/parse", json=body)
    assert res.json()["is_dag"] is False


def test_parse_ignores_extra_node_fields():
    body = {
        "nodes": [
            {"id": "x", "type": "customInput", "position": {"x": 1, "y": 2}},
        ],
        "edges": [],
    }
    res = client.post("/pipelines/parse", json=body)
    assert res.status_code == 200
    assert res.json()["num_nodes"] == 1


def test_parse_empty_pipeline():
    res = client.post("/pipelines/parse", json={"nodes": [], "edges": []})
    assert res.json() == {"num_nodes": 0, "num_edges": 0, "is_dag": True}


def test_parse_rejects_oversized_pipeline():
    # One node over the default cap → 413, without running graph work.
    from main import MAX_NODES

    body = {"nodes": [{"id": str(i)} for i in range(MAX_NODES + 1)], "edges": []}
    res = client.post("/pipelines/parse", json=body)
    assert res.status_code == 413


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
