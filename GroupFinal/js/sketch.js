let tileSize = 40;
let playerX = 0;
let playerZ = 0;
let angle = 0; // Facing direction in radians
let moveForward = false;

let playerTileX = 0;
let playerTileZ = 0;

let mushroomsByTile = {};  // Store mushrooms by tile coords

let regMushrooms = [];  // brown mushrooms
let poisonMushrooms = [];  // purple mushrooms
let highMushrooms = [];  // red mushrooms
let grassBlades = [];  // grass blades

let hunger = 100; // Full hunger
let maxHunger = 100;

// L-System Plants
let LSBushes = [];
let bushLS;

let yAxis;

// How many tiles wide the path should be (in tile‐indices).
// A value of 1 means only j==0 is path. If you wanted a 3-tile-wide path, set this to 3, etc.
const PATH_WIDTH_IN_TILES = 1;

// Returns true if tile (i,j) falls on the dirt path.
// Right now, we center the path at j==0. If PATH_WIDTH_IN_TILES>1, we cover
// j in [ -floor(PATH_WIDTH_IN_TILES/2) ... +floor(PATH_WIDTH_IN_TILES/2) ].
function isPathTile(i, j) {
  const half = Math.floor(PATH_WIDTH_IN_TILES / 2);
  return j >= -half && j <= +half;
}


function setup() {
  console.log("setup called");
  let canvas = createCanvas(600, 400, WEBGL);
  canvas.parent('canvas-container');
  noStroke();
  yAxis = createVector(0, -1, 0);
  iniLSPlants();

  // Generate mushrooms for initial player tile
  generateMushroomsForTile(playerTileX, playerTileZ);
}

function iniLSPlants()
{
  bushLS = new LSystem();
  bushLS.simulate(2);
}

function isTileInFront(i, j) {
  let tileCenterX = i + 0.5;
  let tileCenterZ = j + 0.5;

  // Vector from player to tile center
  let dx = tileCenterX - playerX;
  let dz = tileCenterZ - playerZ;

  let angleToTile = atan2(dz, dx);

  // Normalize angles to -PI to PI range for comparison
  let diff = angleToTile - angle;

  while (diff > PI) {
    diff -= TWO_PI;
  }

  while (diff < -PI) {
    diff += TWO_PI;
  }

  // Allow tiles in a 90 degree cone (±PI/4 radians) in front
  return abs(diff) < PI / 4;
}

function getFloorColor(i, j) {
  // Calculate distance from player position
  let dx = i - playerX;
  let dz = j - playerZ;
  let distance = sqrt(dx * dx + dz * dz);
  
  // Define gradient parameters
  let maxDistance = 8; // Maximum distance for gradient effect
  let minGreen = 60;   // Dark green value
  let maxGreen = 200;  // Bright green value
  
  let normalizedDistance = min(distance / maxDistance, 1);
  
  // Calculate green based on distance
  let greenValue = lerp(maxGreen, minGreen, normalizedDistance);
  
  return color(greenValue * 0.5, greenValue, greenValue * 0.5);
}

function draw() {
  background(135, 206, 235); // sky blue

  // Lighting
  ambientLight(180);
  directionalLight(255, 255, 255, 0.2, -1, 0.2);

  // Hunger depletes over time
  hunger -= 0.01 * (deltaTime / 16.67);
  hunger = constrain(hunger, 0, maxHunger);

  // Moving forward
  if (moveForward) {
    playerX += cos(angle) * 0.1;
    playerZ += sin(angle) * 0.1;

    let currentTileX = floor(playerX);
    let currentTileZ = floor(playerZ);

    // deplete hunger when player moves
    hunger -= 0.05;
    hunger = constrain(hunger, 0, maxHunger);

    // If entered new tile, generate mushrooms if not done yet
    if (currentTileX !== playerTileX || currentTileZ !== playerTileZ) {
      playerTileX = currentTileX;
      playerTileZ = currentTileZ;

      if (!mushroomsByTile[`${playerTileX},${playerTileZ}`]) {
        generateMushroomsForTile(playerTileX, playerTileZ);
      }
    }
  }

  // Show hunger bar
  displayHungerBar();

  // Camera setup
  let camHeight = 30; // Eye-level height
  let eyeX = playerX * tileSize;
  let eyeY = -camHeight;
  let eyeZ = playerZ * tileSize;
  let centerX = eyeX + cos(angle) * 100;
  let centerY = eyeY;
  let centerZ = eyeZ + sin(angle) * 100;

  camera(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, 0, 1, 0);

  // Clear arrays every frame
  regMushrooms = [];
  highMushrooms = [];
  poisonMushrooms = [];
  grassBlades = [];
  LSBushes = [];

  // Draw tiles around players
  let range = 8;
  let startX = floor(playerX - range);
  let endX = floor(playerX + range);
  let startZ = floor(playerZ - range);
  let endZ = floor(playerZ + range);

    /*for (let i = startX; i < endX; i++) {
      for (let j = startZ; j < endZ; j++) {
        if (isTileInFront(i, j)) {
          drawTile(i, j);
        }
      }
    }*/
  
  for (let i = startX; i < endX; i++) {
    for (let j = startZ; j < endZ; j++) {
      if (isTileInFront(i, j)) {
        drawTile(i, j);

        // Add mushrooms and grass from stored data for this tile
        let tileData = mushroomsByTile[`${i},${j}`];
        if (tileData) {
          regMushrooms.push(...tileData.regMushrooms);
          highMushrooms.push(...tileData.highMushrooms);
          poisonMushrooms.push(...tileData.poisonMushrooms);
          grassBlades.push(...tileData.grassBlades);
        } 
        else {
          // Optionally generate mushrooms for tiles you haven't seen yet
          generateMushroomsForTile(i, j);
          tileData = mushroomsByTile[`${i},${j}`];
          regMushrooms.push(...tileData.regMushrooms);
          highMushrooms.push(...tileData.highMushrooms);
          poisonMushrooms.push(...tileData.poisonMushrooms);
          grassBlades.push(...tileData.grassBlades);
        }
      }
    }
  }
  
  // Draw mushrooms
  for (let m of regMushrooms) {
    push();
    translate(m.x, -2, m.z);
    fill(139, 65, 19);
    sphere(5); // Mushroom cap
    pop();
  }
  for (let m of highMushrooms) {
    push();
    translate(m.x, -2, m.z);
    fill(255, 5, 0);
    sphere(4);
    pop();
  }
  for (let m of poisonMushrooms) {
    push();
    translate(m.x, -2, m.z);
    fill(128, 30, 128);
    sphere(4);
    pop();
  }
  
  // 3d grass blades
  for (let g of grassBlades) {
    push();
    translate(g.x, -1, g.z);
    fill(50, 150, 50);
    // Create a 2D grass blade using a thin box
    box(2, 8, 0.5);
    pop();
  }

  // Draw LS Bushes
  for (let b of LSBushes) {
    push();
    translate(b.x, -2, b.z);
    rotate(PI/2, yAxis);
    if (b.flip == 1)
      scale(-1, 1);
    bushLS.render();
    pop();
  }


}

function drawTile(i, j) {
  push();
  let x = i * tileSize;
  let z = j * tileSize;

  // Ground with gradient color based on distance from player
  translate(x, 0, z);

  if (isPathTile(i, j)) {
    // ─── PATH TILE: Draw brown “dirt” and do NOT spawn any grass/bush here ───
    fill(139, 69, 19); // brown dirt color (R=139, G=69, B=19)
    box(tileSize, 4, tileSize);
  }
  else {
  // ─── 2B: Normal grass tile ───
    fill(getFloorColor(i, j));
    box(tileSize, 4, tileSize);

    // Use deterministic seed so the same arrangement of bushes appears
    // each time you revisit this tile.
    randomSeed(i * 9999 + j * 1234);

    // Only occasionally place an L‐system “bush” if you're the right distance away:
    if (random() < 0.1 &&
        abs(playerZ - (j * tileSize)) > 35 &&
        abs(playerZ - (j * tileSize)) < 50) {
      LSBushes.push({
        x: i * tileSize,
        z: j * tileSize,
        flip: floor(random(0, 2))
      });
    }
  }
  pop();
}
  
  
  
  /*// Place mushrooms
  for (let n = 0; n < 3; n++) {
    if (random() < 0.03) {
      let sideOffset = random() * tileSize - tileSize / 2; 
      regMushrooms.push({ x: i * tileSize + sideOffset, z: j * tileSize + sideOffset });
    }
    if (random() < 0.07) {
      let sideOffset = random() < 0.5 ? -tileSize / 2 : tileSize / 2;
      highMushrooms.push({ x: i * tileSize + sideOffset, z: j * tileSize + sideOffset });
    }
    if (random() < 0.05) {
      let sideOffset = random() < 0.5 ? -tileSize / 2 : tileSize / 2;
      poisonMushrooms.push({ x: i * tileSize + sideOffset, z: j * tileSize + sideOffset });
    }
  }
  
  // Place grass blades (more frequent than mushrooms)
  for (let n = 0; n < 50; n++) {
    if (random() < 0.3) {
      let offsetX = random() * tileSize - tileSize / 2;
      let offsetZ = random() * tileSize - tileSize / 2;
      grassBlades.push({ x: i * tileSize + offsetX, z: j * tileSize + offsetZ });
    }
  }*/
  


// Generate mushrooms and grass for a tile and store them
function generateMushroomsForTile(i, j) {
  // If this is a path tile, store empty arrays—no mushrooms or grass.
  if (isPathTile(i, j)) {
    mushroomsByTile[`${i},${j}`] = {
      regMushrooms:    [],
      highMushrooms:   [],
      poisonMushrooms: [],
      grassBlades:     []
    };
    return;
  }

  // Otherwise, run the existing random‐spawn logic exactly as before:
  randomSeed(i * 9999 + j * 1234);

  let regM = [], highM = [], poisonM = [], grass = [];

  for (let n = 0; n < 3; n++) {
    if (random() < 0.03) {
      let sideOffset = random() * tileSize - tileSize/2;
      regM.push({ x: i * tileSize + sideOffset, z: j * tileSize + sideOffset });
    }
    if (random() < 0.07) {
      let sideOffset = random() < 0.5 ? -tileSize/2 : tileSize/2;
      highM.push({ x: i * tileSize + sideOffset, z: j * tileSize + sideOffset });
    }
    if (random() < 0.05) {
      let sideOffset = random() < 0.5 ? -tileSize/2 : tileSize/2;
      poisonM.push({ x: i * tileSize + sideOffset, z: j * tileSize + sideOffset });
    }
  }

  for (let n = 0; n < 50; n++) {
    if (random() < 0.5) {
      let offsetX = random() * tileSize - tileSize/2;
      let offsetZ = random() * tileSize - tileSize/2;
      grass.push({ x: i * tileSize + offsetX, z: j * tileSize + offsetZ });
    }
  }

  mushroomsByTile[`${i},${j}`] = {
    regMushrooms:    regM,
    highMushrooms:   highM,
    poisonMushrooms: poisonM,
    grassBlades:     grass
  };
}


// Hunger bar
function displayHungerBar() {
  resetMatrix();
  camera();  // Reset to default orthographic camera
  noLights();
  push();
  translate(-width / 2, -height / 2);  // Top-left corner as origin

  // position and size
  let barWidth = 200;
  let barHeight = 20;
  let x = 20;
  let y = 20;

  // Background of the hunger bar
  fill(100);
  rect(x, y, barWidth, barHeight);

  // current hunger
  let filledWidth = map(hunger, 0, maxHunger, 0, barWidth);
  fill(255, 0, 0);
  rect(x, y, filledWidth, barHeight);

  // Border
  noFill();
  stroke(0);
  rect(x, y, barWidth, barHeight);

  pop();
}

// Key functionalities
function keyPressed() {
  if (key === 'w') {
    moveForward = true;
  }
}

function keyReleased() {
  if (key === 'w') {
    moveForward = false;
  }
}
