document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Game settings
    const CELL_SIZE_DEFAULT = 10;
    let cellSize = CELL_SIZE_DEFAULT;
    const GRID_COLOR = '#ddd';
    const ALIVE_CELL_COLOR = '#3498db';
    const DEAD_CELL_COLOR = '#fff';
    
    // Canvas dimensions
    const CANVAS_WIDTH = 2000;
    const CANVAS_HEIGHT = 600;
    
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Game state variables
    let cells = new Map(); // Using Map to store sparse infinite grid
    let isRunning = false;
    let animationId = null;
    let simulationSpeed = 50; // milliseconds between updates

    // Pan and zoom variables
    let isPanMode = false;
    let isDragging = false;
    let startPanX = 0;
    let startPanY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let zoomLevel = 1.0;
    
    // Get UI elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const randomBtn = document.getElementById('randomBtn');
    const speedRange = document.getElementById('speedRange');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const panBtn = document.getElementById('panBtn');
    
    // Event listeners
    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    clearBtn.addEventListener('click', clearGrid);
    randomBtn.addEventListener('click', randomizeGrid);
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    panBtn.addEventListener('click', togglePanMode);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    speedRange.addEventListener('input', updateSpeed);
    
    // Initialize the game
    drawGrid();
    
    // Functions to manipulate the grid
    function getCellKey(x, y) {
        return `${x},${y}`;
    }
    
    function getCellCoords(key) {
        return key.split(',').map(Number);
    }
    
    function isAlive(x, y) {
        return cells.get(getCellKey(x, y)) === 1;
    }
    
    function setCell(x, y, state) {
        const key = getCellKey(x, y);
        if (state === 1) {
            cells.set(key, 1);
        } else {
            cells.delete(key);
        }
    }
    
    function toggleCell(x, y) {
        setCell(x, y, isAlive(x, y) ? 0 : 1);
    }
    
    function clearGrid() {
        stopSimulation();
        cells.clear();
        drawGrid();
    }
    
    function getVisibleGridRange() {
        // Calculate visible grid area based on current pan and zoom
        const viewportWidth = canvas.width / zoomLevel;
        const viewportHeight = canvas.height / zoomLevel;
        
        const startX = Math.floor(-offsetX / zoomLevel / cellSize) - 1;
        const startY = Math.floor(-offsetY / zoomLevel / cellSize) - 1;
        const endX = Math.ceil((viewportWidth - offsetX / zoomLevel) / cellSize) + 1;
        const endY = Math.ceil((viewportHeight - offsetY / zoomLevel) / cellSize) + 1;
        
        return { startX, startY, endX, endY };
    }
    
    function drawGrid() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save current transformation state
        ctx.save();
        
        // Apply transformations for pan and zoom
        ctx.translate(offsetX, offsetY);
        ctx.scale(zoomLevel, zoomLevel);
        
        // Get visible range
        const { startX, startY, endX, endY } = getVisibleGridRange();
        
        // Draw grid lines
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let x = startX; x <= endX; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, startY * cellSize);
            ctx.lineTo(x * cellSize, endY * cellSize);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = startY; y <= endY; y++) {
            ctx.beginPath();
            ctx.moveTo(startX * cellSize, y * cellSize);
            ctx.lineTo(endX * cellSize, y * cellSize);
            ctx.stroke();
        }
        
        // Draw visible cells
        ctx.fillStyle = ALIVE_CELL_COLOR;
        
        // Option 1: Only draw cells in visible range (more efficient)
        if (cells.size < 10000) {
            // For small number of cells, check each cell
            for (const key of cells.keys()) {
                const [x, y] = getCellCoords(key);
                
                // Only draw if in visible range
                if (x >= startX && x <= endX && y >= startY && y <= endY) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        } else {
            // Option 2: For huge number of cells, just iterate through visible range
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (isAlive(x, y)) {
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            }
        }
        
        // Restore transformation state
        ctx.restore();
    }
    
    function countNeighbors(x, y) {
        let count = 0;
        
        // Check all 8 neighboring cells
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                // Skip the cell itself
                if (dx === 0 && dy === 0) continue;
                
                // Calculate neighbor coordinates (no wraparound for infinite grid)
                const nx = x + dx;
                const ny = y + dy;
                
                // Count live neighbors
                if (isAlive(nx, ny)) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    function updateGrid() {
        // For an infinite grid, we only need to check cells that are alive
        // or adjacent to alive cells
        const cellsToCheck = new Map();
        
        // Add all currently alive cells to the check list
        for (const key of cells.keys()) {
            cellsToCheck.set(key, true);
            
            // Add all neighbors of alive cells
            const [x, y] = getCellCoords(key);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    cellsToCheck.set(getCellKey(nx, ny), true);
                }
            }
        }
        
        // Create a new generation
        const nextCells = new Map();
        
        // Apply Conway's Game of Life rules to all cells that need checking
        for (const key of cellsToCheck.keys()) {
            const [x, y] = getCellCoords(key);
            const neighbors = countNeighbors(x, y);
            const alive = isAlive(x, y);
            
            if (alive) {
                // Rule 1 & 2: Any live cell with 2 or 3 live neighbors survives
                if (neighbors === 2 || neighbors === 3) {
                    nextCells.set(key, 1);
                }
                // Rule 3: Any live cell with < 2 or > 3 live neighbors dies
                // (handled implicitly by not adding to nextCells)
            } else {
                // Rule 4: Any dead cell with exactly 3 live neighbors becomes alive
                if (neighbors === 3) {
                    nextCells.set(key, 1);
                }
            }
        }
        
        // Update the current grid
        cells = nextCells;
    }
    
    // User interaction functions
    function handleCanvasClick(event) {
        // Don't toggle cells if we're in pan mode
        if (isPanMode) return;
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Convert to grid coordinates, taking into account zoom and pan
        const gridX = Math.floor(((mouseX - offsetX) / zoomLevel) / cellSize);
        const gridY = Math.floor(((mouseY - offsetY) / zoomLevel) / cellSize);
        
        // Toggle cell state (no need to check bounds in infinite grid)
        toggleCell(gridX, gridY);
        drawGrid();
    }
    
    function handleMouseDown(event) {
        if (isPanMode) {
            isDragging = true;
            startPanX = event.clientX - offsetX;
            startPanY = event.clientY - offsetY;
            canvas.classList.add('canvas-pan');
        }
    }
    
    function handleMouseMove(event) {
        if (isPanMode && isDragging) {
            offsetX = event.clientX - startPanX;
            offsetY = event.clientY - startPanY;
            drawGrid();
        }
    }
    
    function handleMouseUp() {
        isDragging = false;
    }
    
    function zoomIn() {
        zoomLevel *= 1.2;
        drawGrid();
    }
    
    function zoomOut() {
        zoomLevel = Math.max(0.3, zoomLevel / 1.2);
        drawGrid();
    }
    
    function togglePanMode() {
        isPanMode = !isPanMode;
        
        if (isPanMode) {
            panBtn.classList.add('active');
            canvas.classList.add('canvas-pan');
        } else {
            panBtn.classList.remove('active');
            canvas.classList.remove('canvas-pan');
        }
    }
    
    function startSimulation() {
        if (!isRunning) {
            isRunning = true;
            runSimulation();
        }
    }
    
    function stopSimulation() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    function randomizeGrid() {
        stopSimulation();
        cells.clear();
        
        // Get visible range
        const { startX, startY, endX, endY } = getVisibleGridRange();
        
        // Fill visible area with random cells (approximately 30% alive)
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (Math.random() < 0.3) {
                    setCell(x, y, 1);
                }
            }
        }
        
        drawGrid();
    }
    
    function updateSpeed() {
        simulationSpeed = parseInt(speedRange.value);
    }
    
    // Main simulation loop
    let lastUpdateTime = 0;
    
    function runSimulation(timestamp = 0) {
        if (!isRunning) return;
        
        animationId = requestAnimationFrame(runSimulation);
        
        // Calculate elapsed time
        const elapsed = timestamp - lastUpdateTime;
        
        // Update grid at specified intervals
        if (elapsed > simulationSpeed) {
            updateGrid();
            drawGrid();
            lastUpdateTime = timestamp;
        }
    }
    
    // Add window resize handler
    window.addEventListener('resize', () => {
        // Update canvas size
        canvas.width = Math.min(window.innerWidth * 0.8, 800);
        canvas.height = Math.min(window.innerHeight * 0.5, 600);
        
        // Redraw
        drawGrid();
    });
});