// GRAPH: Adjacency list representation
const graph = {};

// HASH MAP: Area status mapping
const areaStatus = {};

// TREE: Priority-based victim storage (using heap structure)
class VictimTree {
    constructor() {
        this.victims = [];
    }
    
    insert(victim) {
        this.victims.push(victim);
        this.victims.sort((a, b) => {
            const priority = {high: 3, medium: 2, low: 1};
            return priority[b.priority] - priority[a.priority];
        });
    }
    
    getAll() {
        return this.victims;
    }
    
    remove(id) {
        this.victims = this.victims.filter(v => v.id !== id);
    }
}

const victimTree = new VictimTree();

const GRID_SIZE = 8;
let startNode = 0;
let endNode = 63;
let currentPath = [];

// Initialize graph
function initGraph() {
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        graph[i] = [];
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        
        // Add edges to adjacent cells
        if (col > 0) graph[i].push(i - 1); // left
        if (col < GRID_SIZE - 1) graph[i].push(i + 1); // right
        if (row > 0) graph[i].push(i - GRID_SIZE); // up
        if (row < GRID_SIZE - 1) graph[i].push(i + GRID_SIZE); // down
    }
}

function generateMap() {
    const mapEl = document.getElementById('map');
    mapEl.innerHTML = '';
    
    // Reset area status (Hash Map)
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const rand = Math.random();
        if (rand < 0.15) {
            areaStatus[i] = 'blocked';
        } else if (rand < 0.25) {
            areaStatus[i] = 'caution';
        } else {
            areaStatus[i] = 'safe';
        }
    }
    
    areaStatus[startNode] = 'safe';
    areaStatus[endNode] = 'safe';
    
    // Create cells
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = `cell ${areaStatus[i]}`;
        cell.id = `cell-${i}`;
        cell.textContent = i;
        cell.onclick = () => selectCell(i);
        mapEl.appendChild(cell);
    }
    
    updateDisplay();
    addLog('Map generated with new layout');
}

function selectCell(id) {
    console.log(`Cell ${id} selected`);
}

function showAddVictimForm() {
    const form = document.getElementById('victimForm');
    const cellSelect = document.getElementById('victimCell');
    
    // Populate cell options with available cells
    cellSelect.innerHTML = '';
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        if (areaStatus[i] !== 'blocked') {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Cell ${i} - ${areaStatus[i].toUpperCase()}`;
            cellSelect.appendChild(option);
        }
    }
    
    form.style.display = 'block';
    addLog('Victim addition form opened');
}

function hideAddVictimForm() {
    document.getElementById('victimForm').style.display = 'none';
    document.getElementById('victimName').value = '';
}

function submitVictim() {
    const cellId = parseInt(document.getElementById('victimCell').value);
    const priority = document.getElementById('victimPriority').value;
    const name = document.getElementById('victimName').value.trim() || `Victim-${cellId}`;
    
    // Check if victim already exists at this location
    const existing = victimTree.getAll().find(v => v.id === cellId);
    if (existing) {
        alert('A victim already exists at this location!');
        return;
    }
    
    victimTree.insert({
        id: cellId,
        priority: priority,
        name: name
    });
    
    // Mark cell as victim location
    const cell = document.getElementById(`cell-${cellId}`);
    if (cell) {
        cell.style.background = '#8b5cf6';
        cell.style.boxShadow = '0 0 15px #8b5cf6';
    }
    
    updateVictimList();
    hideAddVictimForm();
    addLog(`✅ ${name} added at cell ${cellId} with ${priority} priority`);
}

function updateVictimList() {
    const list = document.getElementById('victimList');
    list.innerHTML = '<h3 style="margin: 10px 0;">Victims (Priority Tree)</h3>';
    
    victimTree.getAll().forEach(v => {
        const item = document.createElement('div');
        item.className = `victim-item priority-${v.priority}`;
        item.innerHTML = `
            <span>${v.name} (Cell ${v.id})</span>
            <span style="text-transform: uppercase; font-size: 0.8em;">${v.priority}</span>
        `;
        list.appendChild(item);
    });
    
    document.getElementById('victimCount').textContent = victimTree.getAll().length;
    updateEndSelect();
}

function updateEndSelect() {
    const select = document.getElementById('endNode');
    select.innerHTML = '';
    
    victimTree.getAll().forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.name} - ${v.priority.toUpperCase()}`;
        select.appendChild(option);
    });
    
    if (victimTree.getAll().length > 0) {
        endNode = parseInt(select.value);
    }
}

// BFS using QUEUE
function bfs(start, end) {
    const queue = [start];
    const visited = new Set([start]);
    const parent = {};
    
    while (queue.length > 0) {
        const node = queue.shift(); // Dequeue
        
        if (node === end) {
            return reconstructPath(parent, start, end);
        }
        
        for (const neighbor of graph[node]) {
            if (!visited.has(neighbor) && areaStatus[neighbor] !== 'blocked') {
                visited.add(neighbor);
                parent[neighbor] = node;
                queue.push(neighbor); // Enqueue
                
                const cell = document.getElementById(`cell-${neighbor}`);
                if (cell && neighbor !== end) {
                    cell.classList.add('visited');
                }
            }
        }
    }
    
    return null;
}

// DFS using STACK
function dfs(start, end) {
    const stack = [start];
    const visited = new Set([start]);
    const parent = {};
    
    while (stack.length > 0) {
        const node = stack.pop(); // Pop from stack
        
        if (node === end) {
            return reconstructPath(parent, start, end);
        }
        
        for (const neighbor of graph[node]) {
            if (!visited.has(neighbor) && areaStatus[neighbor] !== 'blocked') {
                visited.add(neighbor);
                parent[neighbor] = node;
                stack.push(neighbor); // Push to stack
                
                const cell = document.getElementById(`cell-${neighbor}`);
                if (cell && neighbor !== end) {
                    cell.classList.add('visited');
                }
            }
        }
    }
    
    return null;
}

// Dijkstra using PRIORITY QUEUE
function dijkstra(start, end) {
    const distances = {};
    const parent = {};
    const pq = [{node: start, dist: 0}];
    const visited = new Set();
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        distances[i] = Infinity;
    }
    distances[start] = 0;
    
    while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const {node, dist} = pq.shift();
        
        if (visited.has(node)) continue;
        visited.add(node);
        
        if (node === end) {
            return reconstructPath(parent, start, end);
        }
        
        for (const neighbor of graph[node]) {
            if (areaStatus[neighbor] === 'blocked') continue;
            
            const weight = areaStatus[neighbor] === 'caution' ? 2 : 1;
            const newDist = dist + weight;
            
            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                parent[neighbor] = node;
                pq.push({node: neighbor, dist: newDist});
                
                const cell = document.getElementById(`cell-${neighbor}`);
                if (cell && neighbor !== end) {
                    cell.classList.add('visited');
                }
            }
        }
    }
    
    return null;
}

function reconstructPath(parent, start, end) {
    const path = [];
    let current = end;
    
    while (current !== start) {
        path.unshift(current);
        current = parent[current];
    }
    path.unshift(start);
    
    return path;
}

function findPath() {
    startNode = parseInt(document.getElementById('startNode').value);
    endNode = parseInt(document.getElementById('endNode').value);
    const algo = document.getElementById('algorithm').value;
    
    // Clear previous path
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('path', 'visited', 'start', 'end');
        const cellNum = cell.id.replace('cell-', '');
        cell.innerHTML = cellNum;
    });
    
    addLog(`Finding path from ${startNode} to ${endNode} using ${algo.toUpperCase()}`);
    document.getElementById('status').textContent = 'Searching...';
    
    let path = null;
    
    if (algo === 'bfs') {
        path = bfs(startNode, endNode);
    } else if (algo === 'dfs') {
        path = dfs(startNode, endNode);
    } else if (algo === 'dijkstra') {
        path = dijkstra(startNode, endNode);
    }
    
    if (path) {
        currentPath = path;
        visualizePath(path);
        document.getElementById('pathLength').textContent = path.length;
        document.getElementById('status').textContent = 'Found!';
        addLog(`✅ Path found! Length: ${path.length} cells`);
        addLog(`📍 Route: ${path.join(' → ')}`);
    } else {
        document.getElementById('pathLength').textContent = 'N/A';
        document.getElementById('status').textContent = 'No Path';
        addLog('❌ No valid path found!');
    }
}

function visualizePath(path) {
    path.forEach((node, idx) => {
        setTimeout(() => {
            const cell = document.getElementById(`cell-${node}`);
            if (idx === 0) {
                cell.classList.add('start');
                cell.innerHTML = `${node}<div class="step-number">1</div>`;
            } else if (idx === path.length - 1) {
                cell.classList.add('end');
                cell.innerHTML = `${node}<div class="step-number">${idx + 1}</div>`;
            } else {
                cell.classList.add('path');
                
                // Determine arrow direction
                const nextNode = path[idx + 1];
                let arrow = '';
                
                if (nextNode === node + 1) arrow = '→'; // Right
                else if (nextNode === node - 1) arrow = '←'; // Left
                else if (nextNode === node + GRID_SIZE) arrow = '↓'; // Down
                else if (nextNode === node - GRID_SIZE) arrow = '↑'; // Up
                
                cell.innerHTML = `${node}<div class="arrow">${arrow}</div><div class="step-number">${idx + 1}</div>`;
            }
        }, idx * 100);
    });
}

function updateDisplay() {
    const startSelect = document.getElementById('startNode');
    startSelect.innerHTML = '';
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        if (areaStatus[i] !== 'blocked') {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Cell ${i}`;
            if (i === startNode) option.selected = true;
            startSelect.innerHTML += option.outerHTML;
        }
    }
}

function addLog(message) {
    const logs = document.getElementById('logs');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${message}`;
    logs.insertBefore(entry, logs.firstChild);
}

// Initialize
initGraph();
generateMap();

// Add some default victims
victimTree.insert({id: 63, priority: 'high', name: 'Victim-63'});
victimTree.insert({id: 55, priority: 'medium', name: 'Victim-55'});
victimTree.insert({id: 47, priority: 'low', name: 'Victim-47'});
updateVictimList();

addLog('System initialized - All data structures loaded');
addLog('Graph: City routes mapped');
addLog('Hash Map: Area status tracking active');
addLog('Tree: Victim priority system ready');
