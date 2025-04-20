// Global variables
let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows = 10;  //change these if you want the grid to be bigger
let numCols = 10; 
let canvasContainer;

function preload() {
  // Load tileset image
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

//setup() function is called once when the program starts
function setup() {
  canvasContainer = $("#canvas-container");

  let canvas = createCanvas(16 * numCols, 16 * numRows);
  canvas.parent("canvas-container");

  if (select("canvas") && select("canvas").elt) {
    select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
  }

  const reseedButton = select("#reseedButton");
  if (reseedButton) {
    reseedButton.mousePressed(reseed);
    console.log("Reseed button handler attached");
  } else {
    console.error("Reseed button not found in the DOM");
  }
  
  //Generate initial grid
  reseed();
  
  //Set up resize event listener
  $(window).resize(function() {
    resizeScreen();
  });
}

function resizeScreen() {
  console.log("Resizing...");
  //Only resize if needed
  if (canvasContainer.width() !== width || canvasContainer.height() !== height) {
    resizeCanvas(16 * numCols, 16 * numRows);
  }
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  
  console.log("Reseeding with seed: " + seed);
  
  //Update the seed display if it exists
  const seedReport = select("#seedReport");
  if (seedReport) {
    seedReport.html("seed " + seed);
  }
  
  //New random room
  regenerateGrid();
}

function regenerateGrid() {
  //Generate a new grid using the function from p2_solution.js
  currentGrid = generateGrid(numCols, numRows);
  
  //Update the ASCII box if it exists
  const asciiBox = select("#asciiBox");
  if (asciiBox) {
    asciiBox.value(gridToString(currentGrid));
  }
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function draw() {
  randomSeed(seed);
  
  drawGrid(currentGrid);
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}