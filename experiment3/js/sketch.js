// Global variables
let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows = 10; // Default size if asciiBox isn't available
let numCols = 10; // Default size if asciiBox isn't available
let canvasContainer;

function preload() {
  // Load tileset image
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function resizeScreen() {
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
}

// setup() function is called once when the program starts
function setup() {
  // Get canvas container from DOM
  canvasContainer = $("#canvas-container");
  
  // Try to get dimensions from asciiBox if it exists
  const asciiBox = select("#asciiBox");
  if (asciiBox) {
    numCols = asciiBox.attribute("rows") | 0 || 10;
    numRows = asciiBox.attribute("cols") | 0 || 10;
    
    // Set up event listeners if the elements exist
    select("#reseedButton").mousePressed(reseed);
    asciiBox.input(reparseGrid);
  }
  
  // Create canvas with proper dimensions
  let canvas = createCanvas(16 * numCols, 16 * numRows);
  canvas.parent("canvas-container"); // Use the ID with hyphen as in HTML
  
  // Set canvas rendering quality
  if (select("canvas") && select("canvas").elt) {
    select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
  }
  
  // Set up resize handler
  $(window).resize(resizeScreen);
  
  // Generate initial grid
  reseed();
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  
  // Update seed report if element exists
  const seedReport = select("#seedReport");
  if (seedReport) {
    seedReport.html("seed " + seed);
  }
  
  regenerateGrid();
}

function regenerateGrid() {
  // Generate a new grid
  currentGrid = generateGrid(numCols, numRows);
  
  // Update asciiBox if it exists
  const asciiBox = select("#asciiBox");
  if (asciiBox) {
    asciiBox.value(gridToString(currentGrid));
  }
}

function reparseGrid() {
  const asciiBox = select("#asciiBox");
  if (asciiBox) {
    currentGrid = stringToGrid(asciiBox.value());
  }
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}

function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}