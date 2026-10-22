(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const START_NODES = [
    { id: 'A', x: 118, y: 186 },
    { id: 'B', x: 285, y: 105 },
    { id: 'C', x: 300, y: 292 },
    { id: 'D', x: 488, y: 165 },
    { id: 'E', x: 610, y: 310 },
    { id: 'F', x: 783, y: 202 },
  ];
  const START_EDGES = [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'D', weight: 8 },
    { from: 'C', to: 'E', weight: 10 },
    { from: 'D', to: 'E', weight: 2 },
    { from: 'D', to: 'F', weight: 6 },
    { from: 'E', to: 'F', weight: 3 },
  ];

  const svg = document.getElementById('graph-canvas');
  const edgeLayer = document.getElementById('edge-layer');
  const nodeLayer = document.getElementById('node-layer');
  const startSelect = document.getElementById('start-node');
  const endSelect = document.getElementById('end-node');
  const findButton = document.getElementById('find-path');
  const statusMessage = document.getElementById('status-message');
  const resultState = document.getElementById('result-state');
  const pathCost = document.getElementById('path-cost');
  const pathSequence = document.getElementById('path-sequence');
  const visitedList = document.getElementById('visited-list');
  const visitedCount = document.getElementById('visited-count');
  const nodeCount = document.getElementById('node-count');
  const edgeCount = document.getElementById('edge-count');
  const toolHint = document.getElementById('tool-hint');
  const canvasCaption = document.getElementById('canvas-caption-text');
  const emptyState = document.getElementById('empty-state');
  const weightDialog = document.getElementById('weight-dialog');
  const weightForm = document.getElementById('weight-form');
  const weightInput = document.getElementById('edge-weight');
  const connectionDescription = document.getElementById('connection-description');
  const cancelWeightButton = document.getElementById('cancel-weight');

  let nodes = clone(START_NODES);
  let edges = clone(START_EDGES);
  let mode = 'select';
  let connectFirst = null;
  let pendingEdge = null;
  let selectedNode = null;
  let dragNodeId = null;
  let dragPointerId = null;
  let dragStart = null;
  let dragMoved = false;
  let usingExample = true;
  let solution = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nodeById(id) {
    return nodes.find((node) => node.id === id);
  }

  function formatWeight(value) {
    const numeric = Number(value);
    return Number.isInteger(numeric) ? String(numeric) : String(Number(numeric.toFixed(3)));
  }

  function setStatus(message, kind = '') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('error', 'success');
    if (kind) statusMessage.classList.add(kind);
  }

  function edgeKey(a, b) {
    return [a, b].sort().join('::');
  }

  function edgeIsOnPath(edge) {
    if (!solution || !solution.reachable || !solution.path) return false;
    for (let i = 0; i < solution.path.length - 1; i += 1) {
      if (edgeKey(solution.path[i], solution.path[i + 1]) === edgeKey(edge.from, edge.to)) return true;
    }
    return false;
  }

  function clearSolution(message = 'Graph changed. Run the simulator to calculate a new route.') {
    solution = null;
    pathCost.textContent = '—';
    pathSequence.textContent = 'Choose a route to begin';
    visitedList.replaceChildren(makeText('span', 'Results will appear here.', 'muted-small'));
    visitedCount.textContent = '0';
    resultState.textContent = 'WAITING';
    resultState.className = 'result-state';
    setStatus(message);
    renderGraph();
  }

  function makeText(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function populateSelects() {
    const oldStart = startSelect.value;
    const oldEnd = endSelect.value;
    startSelect.replaceChildren();
    endSelect.replaceChildren();

    if (nodes.length === 0) {
      startSelect.add(new Option('No nodes available', ''));
      endSelect.add(new Option('No nodes available', ''));
      startSelect.disabled = true;
      endSelect.disabled = true;
      return;
    }

    startSelect.disabled = false;
    endSelect.disabled = false;
    nodes.forEach((node) => {
      startSelect.add(new Option(node.id, node.id));
      endSelect.add(new Option(node.id, node.id));
    });
    startSelect.value = nodes.some((node) => node.id === oldStart) ? oldStart : nodes[0].id;
    endSelect.value = nodes.some((node) => node.id === oldEnd)
      ? oldEnd
      : nodes[Math.min(1, nodes.length - 1)].id;
  }

  function updateStats() {
    nodeCount.textContent = String(nodes.length);
    edgeCount.textContent = String(edges.length);
    emptyState.classList.toggle('hidden', nodes.length > 0);
    canvasCaption.textContent = nodes.length === 0
      ? 'EMPTY NETWORK'
      : (usingExample ? 'SAMPLE NETWORK LOADED' : 'CUSTOM NETWORK · LIVE EDIT');
  }

  function nodeTag(node) {
    const start = startSelect.value;
    const end = endSelect.value;
    if (node.id === start && node.id === end) return 'BOTH';
    if (node.id === start) return 'START';
    if (node.id === end) return 'END';
    return '';
  }

  function addEdgeVisual(edge, index) {
    const from = nodeById(edge.from);
    const to = nodeById(edge.to);
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const offset = 12;
    const midX = (from.x + to.x) / 2 + (-dy / length) * offset;
    const midY = (from.y + to.y) / 2 + (dx / length) * offset;
    const isPath = edgeIsOnPath(edge);

    const group = svgElement('g', { class: 'edge-group', 'data-edge-index': index });
    const hitLine = svgElement('line', {
      x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: 'edge-hit',
    });
    const visibleLine = svgElement('line', {
      x1: from.x, y1: from.y, x2: to.x, y2: to.y,
      class: `edge-line${isPath ? ' path-edge' : ''}`,
    });
    const labelBackground = svgElement('rect', {
      x: midX - 13, y: midY - 9, width: 26, height: 18, rx: 5,
      class: `edge-weight-bg${isPath ? ' path-label' : ''}`,
    });
    const label = svgElement('text', {
      x: midX, y: midY + 0.5,
      class: `edge-weight-text${isPath ? ' path-label' : ''}`,
    });
    label.textContent = formatWeight(edge.weight);

    group.append(hitLine, visibleLine, labelBackground, label);
    if (mode === 'delete') {
      group.addEventListener('pointerenter', () => visibleLine.classList.add('delete-hover'));
      group.addEventListener('pointerleave', () => visibleLine.classList.remove('delete-hover'));
    }
    edgeLayer.appendChild(group);
  }

  function addNodeVisual(node) {
    const isStart = node.id === startSelect.value;
    const isEnd = node.id === endSelect.value;
    const onPath = Boolean(solution && solution.reachable && solution.path.includes(node.id));
    const classNames = ['node-group'];
    if (isStart) classNames.push('start-node');
    if (isEnd) classNames.push('end-node');
    if (onPath) classNames.push('path-node');
    if (node.id === selectedNode) classNames.push('selected-node');
    if (node.id === connectFirst) classNames.push('connect-first');

    const group = svgElement('g', {
      class: classNames.join(' '),
      'data-node-id': node.id,
      transform: `translate(${node.x} ${node.y})`,
    });
    group.appendChild(svgElement('circle', { class: 'node-halo', r: 30 }));
    group.appendChild(svgElement('circle', { class: 'node-circle', r: 21 }));
    const label = svgElement('text', { class: 'node-label', x: 0, y: 1 });
    label.textContent = node.id;
    group.appendChild(label);

    const tagText = nodeTag(node);
    if (tagText) {
      const tag = svgElement('text', {
        class: `node-tag ${isStart ? 'start-tag' : 'end-tag'}`,
        x: 0, y: -33,
      });
      tag.textContent = tagText;
      group.appendChild(tag);
    }
    nodeLayer.appendChild(group);
  }

  function renderGraph() {
    edgeLayer.replaceChildren();
    nodeLayer.replaceChildren();
    edges.forEach(addEdgeVisual);
    nodes.forEach(addNodeVisual);
    svg.classList.remove('mode-add', 'mode-connect', 'mode-delete');
    if (mode === 'add') svg.classList.add('mode-add');
    if (mode === 'connect') svg.classList.add('mode-connect');
    if (mode === 'delete') svg.classList.add('mode-delete');
    updateStats();
    updateToolHint();
  }

  function updateToolHint() {
    const hints = {
      select: 'Drag nodes to arrange your network.',
      add: 'Click an empty area to add a node.',
      connect: connectFirst ? `Now choose a second node (first: ${connectFirst}).` : 'Click two nodes to create a connection.',
      delete: 'Click a node or edge label to remove it.',
    };
    toolHint.textContent = hints[mode];
  }

  function setMode(nextMode) {
    mode = nextMode;
    if (mode !== 'connect') connectFirst = null;
    document.querySelectorAll('.tool-button[data-mode]').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const labels = {
      select: 'Select / move mode active',
      add: 'Add node mode active',
      connect: 'Connect mode active',
      delete: 'Delete mode active',
    };
    setStatus(labels[mode]);
    renderGraph();
  }

  function nextNodeId() {
    for (let code = 65; code <= 90; code += 1) {
      const candidate = String.fromCharCode(code);
      if (!nodes.some((node) => node.id === candidate)) return candidate;
    }
    let number = 1;
    while (nodes.some((node) => node.id === `N${number}`)) number += 1;
    return `N${number}`;
  }

  function pointFromEvent(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  function addNodeAt(event) {
    if (nodes.length >= 50) {
      setStatus('This demo supports up to 50 nodes.', 'error');
      return;
    }
    const point = pointFromEvent(event);
    const node = {
      id: nextNodeId(),
      x: Math.max(40, Math.min(860, point.x)),
      y: Math.max(48, Math.min(520, point.y)),
    };
    nodes.push(node);
    usingExample = false;
    populateSelects();
    clearSolution(`Node ${node.id} added. Connect it to build your graph.`);
    selectedNode = node.id;
    renderGraph();
  }

  function hasEdge(a, b) {
    return edges.some((edge) => edgeKey(edge.from, edge.to) === edgeKey(a, b));
  }

  function handleNodeClick(id) {
    if (mode === 'connect') {
      if (connectFirst === null) {
        connectFirst = id;
        setStatus(`Node ${id} selected. Now click another node.`);
        renderGraph();
        return;
      }
      if (connectFirst === id) {
        connectFirst = null;
        setStatus('Connection cancelled. Choose two different nodes.');
        renderGraph();
        return;
      }
      if (hasEdge(connectFirst, id)) {
        const pair = `${connectFirst} and ${id}`;
        connectFirst = null;
        setStatus(`Nodes ${pair} are already connected.`, 'error');
        renderGraph();
        return;
      }
      pendingEdge = { from: connectFirst, to: id };
      connectFirst = null;
      connectionDescription.textContent = `Set a non-negative weight for ${pendingEdge.from} ↔ ${pendingEdge.to}.`;
      weightInput.value = '4';
      renderGraph();
      weightDialog.showModal();
      weightInput.focus();
      return;
    }

    if (mode === 'delete') {
      const countBefore = nodes.length;
      nodes = nodes.filter((node) => node.id !== id);
      edges = edges.filter((edge) => edge.from !== id && edge.to !== id);
      if (selectedNode === id) selectedNode = null;
      if (connectFirst === id) connectFirst = null;
      usingExample = false;
      populateSelects();
      if (nodes.length === countBefore) return;
      clearSolution(`Node ${id} and its connections were removed.`);
      return;
    }

    if (mode === 'select') {
      selectedNode = id;
      renderGraph();
    }
  }

  function handleCanvasClick(event) {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    const nodeGroup = event.target.closest('.node-group');
    const edgeGroup = event.target.closest('.edge-group');

    if (mode === 'add') {
      if (!nodeGroup && !edgeGroup) addNodeAt(event);
      return;
    }

    if (nodeGroup) {
      handleNodeClick(nodeGroup.dataset.nodeId);
      return;
    }

    if (mode === 'delete' && edgeGroup) {
      const index = Number(edgeGroup.dataset.edgeIndex);
      const deletedEdge = edges[index];
      if (!deletedEdge) return;
      edges.splice(index, 1);
      usingExample = false;
      clearSolution(`Connection ${deletedEdge.from} ↔ ${deletedEdge.to} removed.`);
      return;
    }
  }

  function showVisited(order) {
    visitedList.replaceChildren();
    order.forEach((id) => visitedList.appendChild(makeText('span', id, 'visited-node')));
    if (order.length === 0) visitedList.appendChild(makeText('span', 'No nodes explored.', 'muted-small'));
    visitedCount.textContent = String(order.length);
  }

  function showPath(path) {
    pathSequence.replaceChildren();
    path.forEach((id, index) => {
      if (index > 0) {
        const arrow = makeText('span', '→', 'path-arrow');
        pathSequence.appendChild(arrow);
      }
      pathSequence.appendChild(makeText('span', id));
    });
  }

  async function findShortestPath() {
    if (!nodes.length) {
      setStatus('Add at least one node before running the simulator.', 'error');
      return;
    }
    if (!startSelect.value || !endSelect.value) {
      setStatus('Choose both a start node and a destination.', 'error');
      return;
    }

    findButton.disabled = true;
    findButton.querySelector('.button-arrow').textContent = '…';
    setStatus('Running Dijkstra’s algorithm…');
    resultState.textContent = 'WORKING';
    resultState.className = 'result-state';

    try {
      const response = await fetch('/api/shortest-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map(({ id }) => ({ id })),
          edges,
          start: startSelect.value,
          end: endSelect.value,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The shortest path could not be calculated.');

      solution = data;
      showVisited(data.visitedOrder || []);
      if (data.reachable) {
        pathCost.textContent = formatWeight(data.distance);
        showPath(data.path);
        resultState.textContent = 'PATH FOUND';
        resultState.className = 'result-state solved';
        setStatus(`Optimal route found from ${startSelect.value} to ${endSelect.value}.`, 'success');
      } else {
        pathCost.textContent = '∞';
        pathSequence.textContent = 'No route connects these nodes';
        resultState.textContent = 'NO ROUTE';
        resultState.className = 'result-state no-route';
        setStatus('These nodes are not connected by any route.', 'error');
      }
      renderGraph();
    } catch (error) {
      solution = null;
      resultState.textContent = 'ERROR';
      resultState.className = 'result-state no-route';
      setStatus(error.message || 'Could not contact the Python server. Is Flask running?', 'error');
      renderGraph();
    } finally {
      findButton.disabled = false;
      findButton.querySelector('.button-arrow').textContent = '↗';
    }
  }

  function resetExample() {
    nodes = clone(START_NODES);
    edges = clone(START_EDGES);
    usingExample = true;
    selectedNode = null;
    connectFirst = null;
    pendingEdge = null;
    populateSelects();
    startSelect.value = 'A';
    endSelect.value = 'F';
    clearSolution('Sample graph restored. Choose endpoints and find a route.');
    setMode('select');
  }

  function clearGraph() {
    nodes = [];
    edges = [];
    usingExample = false;
    selectedNode = null;
    connectFirst = null;
    pendingEdge = null;
    populateSelects();
    clearSolution('Canvas cleared. Choose Add node to start again.');
    renderGraph();
  }

  function savePendingEdge(event) {
    event.preventDefault();
    if (!pendingEdge) {
      weightDialog.close();
      return;
    }
    const weight = Number(weightInput.value);
    if (!Number.isFinite(weight) || weight < 0 || weightInput.value.trim() === '') {
      weightInput.setCustomValidity('Enter a finite number greater than or equal to zero.');
      weightInput.reportValidity();
      return;
    }
    weightInput.setCustomValidity('');
    edges.push({ from: pendingEdge.from, to: pendingEdge.to, weight });
    const connection = `${pendingEdge.from} ↔ ${pendingEdge.to}`;
    pendingEdge = null;
    usingExample = false;
    weightDialog.close();
    clearSolution(`Connection ${connection} added with weight ${formatWeight(weight)}.`);
    setMode('connect');
  }

  svg.addEventListener('pointerdown', (event) => {
    if (mode !== 'select') return;
    const nodeGroup = event.target.closest('.node-group');
    if (!nodeGroup) return;
    const id = nodeGroup.dataset.nodeId;
    if (!nodeById(id)) return;
    dragNodeId = id;
    dragPointerId = event.pointerId;
    dragStart = pointFromEvent(event);
    dragMoved = false;
    selectedNode = id;
    try { svg.setPointerCapture(event.pointerId); } catch (_) { /* Capture may be unavailable in older browsers. */ }
    renderGraph();
  });

  svg.addEventListener('pointermove', (event) => {
    if (dragNodeId === null || event.pointerId !== dragPointerId) return;
    const point = pointFromEvent(event);
    if (dragStart && Math.hypot(point.x - dragStart.x, point.y - dragStart.y) > 2) dragMoved = true;
    const node = nodeById(dragNodeId);
    if (!node) return;
    node.x = Math.max(35, Math.min(865, point.x));
    node.y = Math.max(42, Math.min(525, point.y));
    renderGraph();
  });

  function finishDrag(event) {
    if (dragNodeId === null || (event && event.pointerId !== dragPointerId)) return;
    dragNodeId = null;
    dragPointerId = null;
    dragStart = null;
    if (!dragMoved) {
      // Pointer-down already selected the node; leave its selection visible.
      renderGraph();
    } else {
      usingExample = false;
      clearSolution('Node position changed. Run the simulator to refresh the route.');
    }
    try {
      if (event && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    } catch (_) { /* Ignore browser-specific pointer-capture errors. */ }
  }

  svg.addEventListener('pointerup', finishDrag);
  svg.addEventListener('pointercancel', finishDrag);
  svg.addEventListener('click', handleCanvasClick);

  document.querySelectorAll('.tool-button[data-mode]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });
  findButton.addEventListener('click', findShortestPath);
  document.getElementById('reset-example').addEventListener('click', resetExample);
  document.getElementById('clear-graph').addEventListener('click', clearGraph);

  startSelect.addEventListener('change', () => clearSolution('Start node updated. Run the simulator to refresh the route.'));
  endSelect.addEventListener('change', () => clearSolution('Destination updated. Run the simulator to refresh the route.'));
  weightForm.addEventListener('submit', savePendingEdge);
  cancelWeightButton.addEventListener('click', () => {
    pendingEdge = null;
    connectFirst = null;
    weightDialog.close();
    renderGraph();
    setStatus('Connection cancelled.');
  });
  weightDialog.addEventListener('cancel', () => {
    pendingEdge = null;
    connectFirst = null;
    renderGraph();
  });
  weightInput.addEventListener('input', () => weightInput.setCustomValidity(''));

  populateSelects();
  startSelect.value = 'A';
  endSelect.value = 'F';
  renderGraph();
})();
