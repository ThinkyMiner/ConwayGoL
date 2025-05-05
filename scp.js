document.addEventListener('DoMContentLoaded', () =>{

    // Canvas Setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    //Game Settings
    const CELL_SIZE = 15;
    const GRID_COLOR = '#ddd';
    const ALIVE_CELL_COLOR = '#3498db';
    const DEAD_CELL_COLOR = '#fff';

    // Calculate Grid Dimensions based on window size
    let GRID_WIDTH = Math.floor((window.innerWidth * 0.8) / CELL_SIZE);
    let GRID_HEIGHT = Math.floor((window.innerHeight * 0.5) / CELL_SIZE);

    // Set canvas size
    canvas.width = GRID_WIDTH * CELL_SIZE;
    canvas.height = GRID_HEIGHT * CELL_SIZE;

    // Game state variables
    let grid = createEmptyGrid();
    let isRunning = false;
    let animationId = null;
    let simulationSpeed = 100;

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

    function drawGrid(){

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        
    }


})