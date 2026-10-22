# Interactive Shortest Path Simulator

A small, interactive graph project built with **Python (Flask)** and **HTML, CSS, and JavaScript**. It uses **Dijkstra's algorithm** to find the minimum-total-weight path between two nodes.

## Features

- Start with a sample graph, or create your own.
- Add nodes by selecting **Add node** and clicking the graph canvas.
- Connect two nodes with a weighted, undirected edge.
- Move nodes by dragging them in **Select / move** mode.
- Choose a start node and a destination, then calculate the shortest path.
- Highlight the best path and view its total cost and the order in which nodes were visited.
- Remove nodes or edges, clear the graph, or reload the example graph.
- The shortest-path calculation runs on the Python backend.

## Requirements

- Python 3.10 or newer
- pip

## Run locally

1. Extract the ZIP file, then open a terminal in the `shortest_path_simulator` folder.
2. (Recommended) Create and activate a virtual environment:

   **Windows**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

   **macOS / Linux**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the app:

   ```bash
   python app.py
   ```

5. Open the local URL printed by Flask, usually **http://127.0.0.1:5000**.

## How to use it

1. Pick **Select / move**, **Add node**, **Connect**, or **Delete** from the toolbar above the graph.
2. To add a node, choose **Add node** and click an empty area of the graph.
3. To connect nodes, choose **Connect**, click the first node and then the second node, and enter a weight. Edges are undirected and weights must be non-negative.
4. Choose the start and destination from the dropdowns in the left panel.
5. Click **Find shortest path**. The route is highlighted in green and the total weight is shown in the results panel.
6. To delete an edge, choose **Delete** and click its line or weight label. To delete a node, choose **Delete** and click the node.

## Project structure

```text
shortest_path_simulator/
├── app.py                 # Flask routes and Dijkstra algorithm
├── requirements.txt       # Python dependency
├── README.md              # Setup and usage instructions
├── templates/
│   └── index.html         # Page structure
└── static/
    ├── style.css          # Layout and visual styling
    └── app.js             # Interactive SVG graph editor
```

## Algorithm overview

Dijkstra's algorithm keeps the best-known distance from the start node to every other node. It repeatedly visits the unprocessed node with the smallest known distance and relaxes its outgoing edges. When the destination is reached, predecessor links are followed backward to rebuild the route.

With an adjacency list and a priority queue, the typical time complexity is **O((V + E) log V)**, where `V` is the number of vertices and `E` is the number of edges. Dijkstra's algorithm requires **non-negative edge weights**.

## API

`POST /api/shortest-path`

Example request body:

```json
{
  "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}],
  "edges": [
    {"from": "A", "to": "B", "weight": 4},
    {"from": "B", "to": "C", "weight": 2},
    {"from": "A", "to": "C", "weight": 9}
  ],
  "start": "A",
  "end": "C"
}
```

The example response has a path of `A → B → C` with total distance `6`.
