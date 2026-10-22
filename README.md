# Interactive Shortest Path Simulator

An interactive web application that visualizes the shortest path between
two nodes in a weighted graph using **Dijkstra's algorithm**. The
project is built with Python and Flask, with HTML, CSS, and JavaScript
for the user interface.

## Live Demo

**Try the deployed application:**
<https://shortest-path-simulator.onrender.com/>

> Note: On a free hosting plan, the first visit after a period of
> inactivity may take a little longer while the service wakes up.

## Source Code

GitHub repository:
[sandipnakum/shortest-path-simulator](https://github.com/sandipnakum/shortest-path-simulator)

## Features

-   Create and edit graph nodes and weighted edges.
-   Select a start node and a destination node.
-   Find the shortest path using Dijkstra's algorithm.
-   View the calculated path and its total weight.
-   Explore the graph through an interactive browser interface.

## Technologies Used

-   **Python** --- application logic
-   **Flask** --- Python web framework
-   **HTML** --- page structure
-   **CSS** --- styling and layout
-   **JavaScript** --- interactive graph interface
-   **Dijkstra's algorithm** --- shortest-path calculation
-   **Render** --- web deployment

## Run Locally

### 1. Requirements

Install Python 3.10 or newer.

### 2. Download the project

Clone the repository:

``` bash
git clone https://github.com/sandipnakum/shortest-path-simulator.git
cd shortest-path-simulator
```

Alternatively, download the repository as a ZIP file from GitHub and
extract it.

### 3. Install dependencies

``` bash
python -m pip install -r requirements.txt
```

### 4. Start the application

``` bash
python app.py
```

Open the local address printed in the terminal. It is usually:

<http://127.0.0.1:5000>

Keep the terminal open while using the local application.

## How Dijkstra's Algorithm Works

Dijkstra's algorithm finds a minimum-total-weight path from a starting
node to other reachable nodes in a graph with **non-negative edge
weights**.

1.  Set the starting node's distance to zero and all other distances to
    infinity.
2.  Select the unvisited node with the smallest known distance.
3.  Check its neighbouring nodes and update distances when a shorter
    route is found.
4.  Mark the selected node as visited and repeat.
5.  Reconstruct the shortest path to the destination from the recorded
    predecessor nodes.

## Project Structure

``` text
shortest-path-simulator/
├── app.py
├── requirements.txt
├── README.md
├── run_windows.bat
├── templates/
│   └── index.html
└── static/
    ├── app.js
    └── style.css
```

## Deployment

The application is deployed on Render:

<https://shortest-path-simulator.onrender.com/>

The Render service uses the repository's `requirements.txt` to install
dependencies and the start command `gunicorn app:app` to run the Flask
application in production.

## Author

**Sandip Nakum**

## License

This project is intended for learning and educational demonstration. Add
a license file if you want to specify formal reuse and distribution
permissions.
