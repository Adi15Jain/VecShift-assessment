"""Pure graph utilities for pipeline analysis.

Kept free of FastAPI/Pydantic so the core logic is trivially unit-testable and
reusable. Operates on plain primitives (ids and (source, target) pairs).
"""

from collections import defaultdict, deque
from typing import Iterable, Tuple


def is_dag(node_ids: Iterable[str], edges: Iterable[Tuple[str, str]]) -> bool:
    """Return True if the directed graph has no cycles (i.e. is a DAG).

    Uses Kahn's algorithm (topological sort): repeatedly remove nodes with no
    remaining incoming edges. If every node is removed, there is no cycle.

    Complexity: O(V + E) time, O(V + E) space — linear, so it scales to large
    pipelines. Edges referencing unknown nodes are ignored, and self-loops are
    correctly reported as cycles.
    """
    ids = set(node_ids)

    indegree = {node_id: 0 for node_id in ids}
    adjacency = defaultdict(list)

    for source, target in edges:
        # Ignore edges whose endpoints aren't real nodes in this pipeline.
        if source in ids and target in ids:
            adjacency[source].append(target)
            indegree[target] += 1

    # Seed the queue with every node that has no incoming edges.
    queue = deque(node_id for node_id, deg in indegree.items() if deg == 0)
    visited = 0

    while queue:
        current = queue.popleft()
        visited += 1
        for neighbour in adjacency[current]:
            indegree[neighbour] -= 1
            if indegree[neighbour] == 0:
                queue.append(neighbour)

    # If we couldn't visit every node, the leftover nodes form a cycle.
    return visited == len(ids)
