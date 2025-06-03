let tileSize = 40;
let playerX = 0;
let playerZ = 0;
let angle = 0; // Facing direction in radians
let moveForward = false;

let regMushrooms = [];  // brown mushrooms
let poisonMushrooms = [];  // purple mushrooms
let highMushrooms = [];  // red mushrooms
let grassBlades = [];  // grass blades

// L-System Plants
let LSBushes = [];
let bushLS;

let yAxis;

function setup() {
  console.log("setup called");
  let canvas = createCanvas(600, 400, WEBGL);
  canvas.parent('canvas-container');
  noStroke();
  yAxis = createVector(0, -1, 0);
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