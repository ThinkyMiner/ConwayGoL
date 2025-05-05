document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Game settings
    const CELL_SIZE = 10;
    const GRID_COLOR = '#ddd';
    const ALIVE_CELL_COLOR = '#3498db';
    const DEAD_CELL_COLOR = '#fff';
    
    // Calculate grid dimensions based on window size
    let GRID_WIDTH = Math.floor((window.innerWidth * 2) / CELL_SIZE);
    let GRID_HEIGHT = Math.floor((window.innerHeight * 1) / CELL_SIZE);
    console.log(`Initial grid size: ${GRID_WIDTH} x ${GRID_HEIGHT}`);
    // Keep dimensions within reasonable bounds
    GRID_WIDTH = Math.min(Math.max(GRID_WIDTH, 20), 150);
    GRID_HEIGHT = Math.min(Math.max(GRID_HEIGHT, 20), 80);

    console.log(`Actual grid size: ${GRID_WIDTH} x ${GRID_HEIGHT}`);

    
    // Set canvas size
    canvas.width = GRID_WIDTH * CELL_SIZE;
    canvas.height = GRID_HEIGHT * CELL_SIZE;
    
    // Game state variables
    let grid = createEmptyGrid();
    let isRunning = false;
    let animationId = null;
    let simulationSpeed = 50; // milliseconds between updates
    
    // Get UI elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const randomBtn = document.getElementById('randomBtn');
    const speedRange = document.getElementById('speedRange');
    
    // Event listeners
    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    clearBtn.addEventListener('click', clearGrid);
    randomBtn.addEventListener('click', randomizeGrid);
    canvas.addEventListener('click', handleCanvasClick);
    speedRange.addEventListener('input', updateSpeed);
    
    // Initialize the game
    drawGrid();
    
    // Functions to create and manipulate the grid
    function createEmptyGrid() {
        return Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    }
    
    function drawGrid() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw cell states
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const cellState = grid[y][x];
                
                // Fill cell based on state
                ctx.fillStyle = cellState ? ALIVE_CELL_COLOR : DEAD_CELL_COLOR;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Draw cell border
                ctx.strokeStyle = GRID_COLOR;
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    function updateGrid() {
        // Create a new grid for the next generation
        const nextGrid = createEmptyGrid();
        
        // Apply Conway's Game of Life rules
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const neighbors = countNeighbors(x, y);
                const isAlive = grid[y][x] === 1;
                
                // Apply the rules of Conway's Game of Life
                if (isAlive) {
                    // Rule 1 & 3: Any live cell with < 2 or > 3 live neighbors dies
                    if (neighbors < 2 || neighbors > 3) {
                        nextGrid[y][x] = 0;
                    }
                    // Rule 2: Any live cell with 2 or 3 live neighbors lives on
                    else {
                        nextGrid[y][x] = 1;
                    }
                } else {
                    // Rule 4: Any dead cell with exactly 3 live neighbors becomes alive
                    if (neighbors === 3) {
                        nextGrid[y][x] = 1;
                    }
                }
            }
        }
        
        // Update the current grid
        grid = nextGrid;
    }
    
    function countNeighbors(x, y) {
        let count = 0;
        
        // Check all 8 neighboring cells
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                // Skip the cell itself
                if (dx === 0 && dy === 0) continue;
                
                // Calculate neighbor coordinates with wraparound
                const nx = (x + dx + GRID_WIDTH) % GRID_WIDTH;
                const ny = (y + dy + GRID_HEIGHT) % GRID_HEIGHT;
                
                // Count live neighbors
                count += grid[ny][nx];
            }
        }
        
        return count;
    }
    
    // User interaction functions
    function handleCanvasClick(event) {
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridX = Math.floor(mouseX / CELL_SIZE);
        const gridY = Math.floor(mouseY / CELL_SIZE);
        
        // Toggle cell state
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            grid[gridY][gridX] = grid[gridY][gridX] ? 0 : 1;
            drawGrid();
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
    
    function clearGrid() {
        stopSimulation();
        grid = createEmptyGrid();
        drawGrid();
    }
    
    function randomizeGrid() {
        stopSimulation();
        
        // Fill grid with random values (approximately 30% alive)
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                grid[y][x] = Math.random() < 0.3 ? 1 : 0;
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
        // Recalculate grid dimensions
        const newWidth = Math.floor((window.innerWidth * 0.8) / CELL_SIZE);
        const newHeight = Math.floor((window.innerHeight * 0.5) / CELL_SIZE);
        
        // Keep dimensions within reasonable bounds
        const resizedWidth = Math.min(Math.max(newWidth, 20), 60);
        const resizedHeight = Math.min(Math.max(newHeight, 20), 40);
        
        // Only resize if dimensions changed
        if (resizedWidth !== GRID_WIDTH || resizedHeight !== GRID_HEIGHT) {
            // Save current state
            const oldGrid = grid;
            
            // Update dimensions
            GRID_WIDTH = resizedWidth;
            GRID_HEIGHT = resizedHeight;
            
            // Update canvas size
            canvas.width = GRID_WIDTH * CELL_SIZE;
            canvas.height = GRID_HEIGHT * CELL_SIZE;
            
            // Create new grid
            grid = createEmptyGrid();
            
            // Copy over existing state where possible
            for (let y = 0; y < Math.min(GRID_HEIGHT, oldGrid.length); y++) {
                for (let x = 0; x < Math.min(GRID_WIDTH, oldGrid[0].length); x++) {
                    grid[y][x] = oldGrid[y][x];
                }
            }
            
            // Redraw
            drawGrid();
        }
    });
});