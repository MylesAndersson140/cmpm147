let tileSize = 40;
let playerX = 0;
let playerZ = 0;
let angle = 0; // Facing direction in radians
let moveForward = false;

let regMushrooms = [];  // brown mushrooms
let poisonMushrooms = [];  // purple mushrooms
let highMushrooms = [];  // red mushrooms
let grassBlades = [];  // grass blades


let redMushroomImg, brownMushroomImg, purpleMushroomImg, grassImg;

let hunger = 100; // Full hunger
let maxHunger = 100;
let highness = 0;

// Journal system
let journalOpen = false;

// L-System Plants
let LSBushes = [];
let bushLS;

let yAxis;
let xAxis;


//dirt path
let dirtTex;

let stickImg;

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
  xAxis = createVector(-1, 0, 0);
  iniLSPlants();
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

  // Moving forward
  if (moveForward) {
    playerX += cos(angle) * 0.1;
    playerZ += sin(angle) * 0.1;
  }

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

  for (let i = startX; i < endX; i++) {
    for (let j = startZ; j < endZ; j++) {
      if (isTileInFront(i, j)) {
        drawTile(i, j);
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


  // draw eat zone box
  push();
  let gl = this._renderer.GL;
  gl.disable(gl.DEPTH_TEST);
  translate(playerTileX * tileSize - 100 - tileSize/2, 0, 0);
  rotate(PI/2, yAxis);
  rotate(PI/2, xAxis);
  fill(255, 217, 102, 128);
  //box(50, 50, 75);
  plane(100, 50);
  gl.enable(gl.DEPTH_TEST);
  pop();
  
}

function drawAssets(assets, h, image, x, y) {
  for (let i of assets) {
    push();
    translate(i.x, h, i.z);

    // Calculate angle to player for billboarding
    let dx = playerX - i.x;
    let dz = playerZ - i.z;
    let angleToPlayer = atan2(dx, dz);

    rotateY(angleToPlayer);
    texture(image);
    plane(x, y);
    pop();
  }
}

function drawTile(i, j) {
  push();
  let x = i * tileSize;
  let z = j * tileSize;

  // Ground with gradient color based on distance from player
  translate(x, 0, z);
  fill(getFloorColor(i, j));
  box(tileSize, 4, tileSize);
  
  // Place objects randomly using consistent seed
  randomSeed(i * 9999 + j * 1234);
  
  // Place mushrooms
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
  }
  
  // Place bush
  if (random() < 0.1 && (abs(playerZ - (j * tileSize)) > 35 && abs(playerZ - (j * tileSize)) < 50))
  {
    //let offsetX = random() * tileSize - tileSize / 2;
    //let offsetZ = random() * tileSize - tileSize / 2;
    let offsetX = 0, offsetZ = 0;
    LSBushes.push( { x: i * tileSize + offsetX, z: j * tileSize + offsetZ, flip: floor(random(0, 2)) } );
  }
  

  pop();
}

function EatMushroom()
{
  let eatZoneX = playerTileX * tileSize - 100;
  let eatZoneZ = playerTileZ * tileSize;
  for (let i = 0; i < regMushrooms.length; i++)
  {
    if ((regMushrooms[i].x > eatZoneX - 25 && regMushrooms[i].x < eatZoneX + 25) && (regMushrooms[i].z > eatZoneZ - 50 && regMushrooms[i].z < eatZoneZ + 50))
    {
      // eat the mushroom so dont add it to the new array
      console.log("Ate a regular mushroom!");
      //console.log(regMushrooms[i].z / tileSize);
      mushroomsByTile[`${playerTileX - 1},${-1}`].regMushrooms = [];
      mushroomsByTile[`${playerTileX - 2},${-1}`].regMushrooms = [];
      mushroomsByTile[`${playerTileX - 3},${-1}`].regMushrooms = [];
      mushroomsByTile[`${playerTileX - 3},${1}`].regMushrooms = [];
      mushroomsByTile[`${playerTileX - 2},${1}`].regMushrooms = [];
      mushroomsByTile[`${playerTileX - 1},${1}`].regMushrooms = [];
      regMushrooms.splice(i, 1);
      hunger += 20;
    }
  }

  for (let i = 0; i < highMushrooms.length; i++)
  {
    if ((highMushrooms[i].x > eatZoneX - 25 && highMushrooms[i].x < eatZoneX + 25) && (highMushrooms[i].z > eatZoneZ - 50 && highMushrooms[i].z < eatZoneZ + 50))
    {
      // eat the mushroom so dont add it to the new array
      console.log("Ate a magic mushroom!");
      //console.log(regMushrooms[i].z / tileSize);
      mushroomsByTile[`${playerTileX - 1},${-1}`].highMushrooms = [];
      mushroomsByTile[`${playerTileX - 2},${-1}`].highMushrooms = [];
      mushroomsByTile[`${playerTileX - 3},${-1}`].highMushrooms = [];
      mushroomsByTile[`${playerTileX - 3},${1}`].highMushrooms = [];
      mushroomsByTile[`${playerTileX - 2},${1}`].highMushrooms = [];
      mushroomsByTile[`${playerTileX - 1},${1}`].highMushrooms = [];
      highMushrooms.splice(i, 1);
      highness += 10;
      console.log("Highness:", highness);
    }
  }

  for (let i = 0; i < poisonMushrooms.length; i++)
  {
    if ((poisonMushrooms[i].x > eatZoneX - 25 && poisonMushrooms[i].x < eatZoneX + 25) && (poisonMushrooms[i].z > eatZoneZ - 50 && poisonMushrooms[i].z < eatZoneZ + 50))
    {
      // eat the mushroom so dont add it to the new array
      console.log("Ate a poisonous mushroom!");
      //console.log(regMushrooms[i].z / tileSize);
      mushroomsByTile[`${playerTileX - 1},${-1}`].poisonMushrooms = [];
      mushroomsByTile[`${playerTileX - 2},${-1}`].poisonMushrooms = [];
      mushroomsByTile[`${playerTileX - 3},${-1}`].poisonMushrooms = [];
      mushroomsByTile[`${playerTileX - 3},${1}`].poisonMushrooms = [];
      mushroomsByTile[`${playerTileX - 2},${1}`].poisonMushrooms = [];
      mushroomsByTile[`${playerTileX - 1},${1}`].poisonMushrooms = [];
      poisonMushrooms.splice(i, 1);
      hunger -= 10;
    }
  }

  //console.log(regMushrooms);
  console.log(playerTileX);
  console.log(playerTileZ);
}

// Key functionalities
function keyPressed() {
  if (!journalOpen) {  // Only allow movement when journal is closed
    if (key === 'w') {
      moveForward = true;
    }
    if (key === "ArrowUp"){
      moveForward = true;
    }
    if (key === 'a') {
      angle -= 0.1;
    }
    if (key === 'd') {
      angle += 0.1;
    }
    if (key == "Enter")
    {
      //console.log("Enter pressed!");
      EatMushroom();
    }
  }
  
  // Allow journal to be opened/closed with 'j' key
  if (key === 'j' || key === 'J') {
    journalOpen = !journalOpen;
  }
  
  // Allow journal to be closed with Escape key
  if (key === 'Escape' || keyCode === ESCAPE) {
    journalOpen = false;
  }
}

function keyReleased() {
  if (key === 'w') {
    moveForward = false;
  }
}