"""Interactive Shortest Path Simulator - Flask backend."""
from __future__ import annotations

import heapq
import math
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def dijkstra(node_ids: list[str], edges: list[dict], start: str, end: str) -> dict:
    """Find the lowest-cost path in an undirected graph using Dijkstra's algorithm."""
    adjacency: dict[str, list[tuple[str, float]]] = {node_id: [] for node_id in node_ids}

    for edge in edges:
        a = edge["from"]
        b = edge["to"]
        weight = float(edge["weight"])
        adjacency[a].append((b, weight))
        adjacency[b].append((a, weight))

    distances = {node_id: math.inf for node_id in node_ids}
    previous: dict[str, str] = {}
    distances[start] = 0.0
    queue: list[tuple[float, str]] = [(0.0, start)]
    visited_order: list[str] = []
    settled: set[str] = set()

    while queue:
        current_distance, current = heapq.heappop(queue)
        if current in settled:
            continue
        if current_distance > distances[current]:
            continue

        settled.add(current)
        visited_order.append(current)
        if current == end:
            break

        for neighbor, weight in adjacency[current]:
            candidate = current_distance + weight
            if candidate < distances[neighbor]:
                distances[neighbor] = candidate
                previous[neighbor] = current
                heapq.heappush(queue, (candidate, neighbor))

    if math.isinf(distances[end]):
        return {
            "reachable": False,
            "path": [],
            "distance": None,
            "visitedOrder": visited_order,
        }

    path = [end]
    while path[-1] != start:
        parent = previous.get(path[-1])
        if parent is None:  # Defensive guard for unexpected malformed graphs.
            return {
                "reachable": False,
                "path": [],
                "distance": None,
                "visitedOrder": visited_order,
            }
        path.append(parent)
    path.reverse()

    # Avoid returning values such as 12.0 for simple integer-weight examples.
    total_distance: float | int = distances[end]
    if total_distance.is_integer():
        total_distance = int(total_distance)

    return {
        "reachable": True,
        "path": path,
        "distance": total_distance,
        "visitedOrder": visited_order,
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/shortest-path")
def shortest_path():
    """Validate the submitted graph and return a shortest path."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Send the graph as a JSON object."}), 400

    nodes = payload.get("nodes")
    edges = payload.get("edges")
    start = payload.get("start")
    end = payload.get("end")

    if not isinstance(nodes, list) or not nodes:
        return jsonify({"error": "Add at least one node to the graph."}), 400
    if not isinstance(edges, list):
        return jsonify({"error": "The edges field must be a list."}), 400

    node_ids: list[str] = []
    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get("id"), str):
            return jsonify({"error": "Each node must have a string id."}), 400
        node_id = node["id"]
        if not node_id.strip():
            return jsonify({"error": "Node IDs cannot be empty."}), 400
        if node_id in node_ids:
            return jsonify({"error": f"Duplicate node ID: {node_id}."}), 400
        node_ids.append(node_id)

    if start not in node_ids or end not in node_ids:
        return jsonify({"error": "Choose a valid start node and destination."}), 400

    clean_edges: list[dict] = []
    for index, edge in enumerate(edges, start=1):
        if not isinstance(edge, dict):
            return jsonify({"error": f"Edge {index} is invalid."}), 400
        a, b = edge.get("from"), edge.get("to")
        weight = edge.get("weight")
        if a not in node_ids or b not in node_ids:
            return jsonify({"error": f"Edge {index} refers to a node that does not exist."}), 400
        if a == b:
            return jsonify({"error": f"Edge {index} cannot connect a node to itself."}), 400
        try:
            numeric_weight = float(weight)
        except (TypeError, ValueError):
            return jsonify({"error": f"Edge {index} must have a numeric weight."}), 400
        if not math.isfinite(numeric_weight) or numeric_weight < 0:
            return jsonify({"error": f"Edge {index} weight must be a finite, non-negative number."}), 400
        clean_edges.append({"from": a, "to": b, "weight": numeric_weight})

    return jsonify(dijkstra(node_ids, clean_edges, start, end))


if __name__ == "__main__":
    # Run with: python app.py
    app.run(debug=True)
