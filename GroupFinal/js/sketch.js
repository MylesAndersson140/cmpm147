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

let redMushroomImg, brownMushroomImg, purpleMushroomImg, grassImg, leafImg;

let hunger = 150; // Full hunger
let maxHunger = 150;
let highness = 0;

// Journal system
let journalOpen = false;

// L-System Plants
let LSBushes = [];
let bushLS;

let yAxis;
let xAxis;

//dirt path assets
let dirtTex;
let stickImg;
let leafImgs = [];

// Shader stuff
let noiseFilter;

let gameOver = false;

// Frag shader modified from https://www.shadertoy.com/view/dsGfRz
let noiseFilterSrc = `
precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord; 

uniform vec2 iResolution;
uniform float iTime;

uniform float intensity;

float hash12(vec2 p) { // hash function taken from shadertoy.com/view/4djSRW
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 randDir(vec2 id) {
    float a = hash12(id)*6.28319 + iTime;
    return vec2(cos(a), sin(a));
}

vec2 smootherstep(vec2 x) {
    return x*x*x*(x*(6.*x-15.)+10.);
}

vec3 colorMap(float p) {
    // https://www.desmos.com/calculator/tox6hpgflr
    float r = clamp(abs(6.*p-3.)-1., 0., 1.);
    float g = clamp(-abs(6.*p-2.)+2., 0., 1.);
    float b = clamp(-abs(6.*p-4.)+2., 0., 1.);
    
    return vec3(r, g, b);
}

float perlin(vec2 coord) {
    vec2 gridId = floor(coord);
    vec2 gridUv = fract(coord);
    
    vec2 bottomLeft = gridUv;
    vec2 bottomRight = gridUv-vec2(1, 0);
    vec2 topLeft = gridUv-vec2(0, 1);
    vec2 topRight = gridUv-vec2(1, 1);
    
    vec2 gridUvSmooth = smootherstep(gridUv);
    float lerp1 = mix(dot(bottomLeft, randDir(gridId)), dot(bottomRight, randDir(gridId+vec2(1, 0))), gridUvSmooth.x);
    float lerp2 = mix(dot(topLeft, randDir(gridId+vec2(0, 1))), dot(topRight, randDir(gridId+vec2(1, 1))), gridUvSmooth.x);
    
    return mix(lerp1, lerp2, gridUvSmooth.y);
}

void main()
{
    vec2 uv = (vTexCoord * 2.0 - iResolution.xy) / iResolution.y;
    float noise = perlin(uv*2.0);
    vec3 background = vec3(0.9, 0.8, 0.7);
    vec3 noiseRainbow = colorMap(noise+0.5);
    float contourMask = mod(noise, 0.05)*20. < 0.5 ? 1. : sin(iTime)/2.+0.5;
    
		float rO = mix(noiseRainbow.x, texture2D(tex0, vTexCoord).r, intensity);
		float gO = mix(noiseRainbow.y, texture2D(tex0, vTexCoord).g, intensity);
		float bO = mix(noiseRainbow.z, texture2D(tex0, vTexCoord).b, intensity);
		
    gl_FragColor = vec4(rO, gO, bO, 1.0);
}
`;

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
  let canvas = createCanvas(1200, 600, WEBGL);
  canvas.parent('canvas-container');
  noStroke();
  yAxis = createVector(0, -1, 0);
  xAxis = createVector(-1, 0, 0);
  iniLSPlants();

  // let gl = this._renderer.GL;
  // gl.disable(gl.DEPTH_TEST);

  angle = PI;

  // create a 64×64 dirt texture
  dirtTex = createGraphics(64, 64);
  dirtTex.noStroke();
  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 64; y++) {
      // base brown + a little noise
      let v = noise(x * 0.1, y * 0.1) * 30;      // smooth noise
      let r = 139 + random(-10, 10) + v;
      let g =  69 + random(-10, 10) + v * 0.5;
      let b =  19 + random(-10,  5);
      dirtTex.fill(r, g, b);
      dirtTex.rect(x, y, 1, 1);
    }
  }
  // sprinkle in some "rocks"
  dirtTex.noFill();
  for (let i = 0; i < 100; i++) {
    let sx = random(64), sy = random(64), sz = random(1,3);
    dirtTex.fill(200, 200, 200, 200);
    dirtTex.ellipse(sx, sy, sz, sz);
  }

  // Generate mushrooms for initial player tile
  generateMushroomsForTile(playerTileX, playerTileZ);

  // Shader stuff
  noiseFilter = createFilterShader(noiseFilterSrc);
  noiseFilter.setUniform("iResolution", [1, 1]);
  noiseFilter.setUniform("intensity", 1.0);
}

function preload() {
  redMushroomImg = loadImage("assets/red.png");
  brownMushroomImg = loadImage("assets/brown.png");
  purpleMushroomImg = loadImage("assets/purple.png");
  //grassImg = loadImage("assets/grass.png");
  grassImg = loadImage("assets/Grasss.png", img => {
    img.loadPixels(); // Force pixel info (sometimes helps WebGL transparency)
  });
  stickImg = loadImage("assets/stick.png");
  leafImgs = [
    loadImage("assets/leaf1.png"),
    loadImage("assets/leaf2.png")
  ];
  leafImg = loadImage("assets/leaf1.png");
}

function iniLSPlants() {
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

  // Allow tiles in a 120 degree cone (±PI/3 radians) in front (had to update from 90 to 120 because of larger canvas introduced a bug - Gabe)
  return abs(diff) < PI / 3;
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

// Sunset gradient background
function drawSunsetBackground() {
  push();
  
  // Draw a large skybox far in the distance
  translate(playerX * tileSize, -600, playerZ * tileSize);
  
  // Define sunset colors
  let horizonColor = color(255, 160, 100);  // Orange-red at horizon
  let midSkyColor = color(240, 200, 150);  // Lighter orange above
  let topSkyColor = color(180, 200, 240);  // Light blue at top
  let bottomColor = color(220, 140, 100);   // Softer orange-brown below horizon
  
  // Draw gradient quads from bottom to top
  let segments = 20;
  let skySize = 1850; // Large enough to cover visible area
  
  for (let i = 0; i < segments; i++) {
    let y1 = map(i, 0, segments, 1650, -400);
    let y2 = map(i + 1, 0, segments, 1650, -400);
    
    let t1 = map(i, 0, segments, 0, 1);
    let t2 = map(i + 1, 0, segments, 0, 1);
    
    // Create color interpolation based on vertical position
    let c1, c2;
    
    if (t1 < 0.3) {
      // Lower part: blend from bottom color to horizon
      c1 = lerpColor(bottomColor, horizonColor, t1 / 0.3);
    } else if (t1 < 0.6) {
      // Middle part: blend from horizon to mid-sky
      c1 = lerpColor(horizonColor, midSkyColor, (t1 - 0.3) / 0.3);
    } else {
      // Upper part: blend from mid-sky to top
      c1 = lerpColor(midSkyColor, topSkyColor, (t1 - 0.6) / 0.4);
    }
    
    if (t2 < 0.3) {
      c2 = lerpColor(bottomColor, horizonColor, t2 / 0.3);
    } else if (t2 < 0.6) {
      c2 = lerpColor(horizonColor, midSkyColor, (t2 - 0.3) / 0.3);
    } else {
      c2 = lerpColor(midSkyColor, topSkyColor, (t2 - 0.6) / 0.4);
    }
    
    // Draw gradient strip as a large rectangle in world space
    noStroke();
    beginShape();
    fill(c1);
    vertex(-skySize, y1, -skySize);
    vertex(skySize, y1, -skySize);
    fill(c2);
    vertex(skySize, y2, -skySize);
    vertex(-skySize, y2, -skySize);
    endShape(CLOSE);
    
    // Draw same strip on other sides to create skybox effect
    beginShape();
    fill(c1);
    vertex(-skySize, y1, skySize);
    vertex(skySize, y1, skySize);
    fill(c2);
    vertex(skySize, y2, skySize);
    vertex(-skySize, y2, skySize);
    endShape(CLOSE);
    
    beginShape();
    fill(c1);
    vertex(-skySize, y1, -skySize);
    vertex(-skySize, y1, skySize);
    fill(c2);
    vertex(-skySize, y2, skySize);
    vertex(-skySize, y2, -skySize);
    endShape(CLOSE);
    
    beginShape();
    fill(c1);
    vertex(skySize, y1, -skySize);
    vertex(skySize, y1, skySize);
    fill(c2);
    vertex(skySize, y2, skySize);
    vertex(skySize, y2, -skySize);
    endShape(CLOSE);
  }
  
  pop();
}

function draw() {
  //background(135, 206, 235);//failsafe

  drawSunsetBackground();

  // Lighting
  ambientLight(120, 80, 60);
  directionalLight(255, 180, 120, 0.2, -1, 0.2);

  // Hunger depletes over time
  hunger -= 0.03 * (deltaTime / 16.67);
  hunger = constrain(hunger, 0, maxHunger);

  if (hunger <= 0) {
    gameOver = true;
  }

  if (gameOver) {
    displayDeathScreen();
    return;
  }

  // Moving forward (only if journal is closed)
  if (moveForward && !journalOpen) {
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

  // Show hunger bar and journal icon
  displayHungerBar();

  // Show journal if open
  if (journalOpen) {
    displayJournal();
    return; // Don't render grass when journal is open
  }

  // Camera setup
  let camHeight = 40; // Eye-level height
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

        // Add mushrooms and grass from stored data for this tile
        let tileData = mushroomsByTile[`${i},${j}`];
        if (tileData) {
          regMushrooms.push(...tileData.regMushrooms);
          highMushrooms.push(...tileData.highMushrooms);
          poisonMushrooms.push(...tileData.poisonMushrooms);
          grassBlades.push(...tileData.grassBlades);
        } 
        else {
          // generate mushrooms for tiles that aren't seen yet
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

  // Draw mushroom images
  drawAssets(regMushrooms, -7, brownMushroomImg, 10, 15);
  drawAssets(highMushrooms, -6, redMushroomImg, 7, 10);
  drawAssets(poisonMushrooms, -6, purpleMushroomImg, 8, 8);

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

  // Shader stuff
  noiseFilter.setUniform("iTime", millis()/1000);
  if(highness > 0 && highness < 1)
  {
    noiseFilter.setUniform("intensity", 1 - highness);
  }
  else if (highness >= 1)
  {
    noiseFilter.setUniform("intensity", 0.05);
  }
  filter(noiseFilter);
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

    if (isPathTile(i, j)) {
      // ─── Path tile ───
      noStroke();
      texture(dirtTex);
      box(tileSize, 4, tileSize);

      // make sticks deterministic per tile, but only up to 1 now
      randomSeed(i * 5432 + j * 9876);
      const numSticks = floor(random(0, 2)); 
      const gl = this._renderer.GL;
      gl.disable(gl.DEPTH_TEST);
      for (let s = 0; s < numSticks; s++) {
        const offX = random(-tileSize/2 + 5, tileSize/2 - 5);
        const offZ = random(-tileSize/2 + 5, tileSize/2 - 5);
        const rot  = random(TWO_PI);

        push();
          translate(offX, -2.01, offZ);
          rotateX(PI/2);
          rotateZ(rot);
          texture(stickImg);
          plane(30, 5);
        pop();
      }

      // now sprinkle leaves—2 to 5 per tile
      const numLeaves = floor(random(2, 6));
      for (let L = 0; L < numLeaves; L++) {
        const offX = random(-tileSize/2 + 5, tileSize/2 - 5);
        const offZ = random(-tileSize/2 + 5, tileSize/2 - 5);
        const rot  = random(TWO_PI);
        const leaf = random(leafImgs);

        push();
          translate(offX, -2.01, offZ);
          rotateX(PI/2);
          rotateZ(rot);
          texture(leaf);
          // adjust 20×20 or whatever feels right
          plane(8, 8);
        pop();
      gl.enable(gl.DEPTH_TEST);
      }
  }
  else {
  // ─── 2B: Normal grass tile ───
    fill(getFloorColor(i, j));
    box(tileSize, 4, tileSize);

    let gl = this._renderer.GL;
    gl.disable(gl.DEPTH_TEST);
    // grass image
    push();
    fill(0, 0, 0, 0);
    noStroke();
    translate(0, -7, 0);
    rotateY(HALF_PI);
    texture(grassImg);
    plane(40, 10);
    pop();
    gl.enable(gl.DEPTH_TEST);

    // Use deterministic seed so the same arrangement of bushes appears
    // each time you revisit this tile.
    randomSeed(i * 9999 + j * 1234);

    // Only occasionally place an L‐system "bush" if you're the right distance away:
    if (random() < 0.1 &&
        abs(playerZ - (j * tileSize)) > 5 &&
        abs(playerZ - (j * tileSize)) < 100) {
      LSBushes.push({
        x: i * tileSize,
        z: j * tileSize,
        flip: floor(random(0, 2))
      });
    }
  }
  pop();
}

// if player dies, death message
function displayDeathScreen() {
  resetMatrix();
  camera();
  noLights();
  
  let journalGraphics = createGraphics(600, 400);
  
  journalGraphics.background(240, 235, 220); // Off-white background
  
  // Title
  journalGraphics.fill(101, 67, 33);
  journalGraphics.textAlign(CENTER, TOP);
  journalGraphics.textSize(24);
  journalGraphics.textStyle(BOLD);
  journalGraphics.text("You died from starvation :(", 300, 20);
  
  // Sample text
  journalGraphics.fill(50, 50, 50);
  journalGraphics.textAlign(LEFT, TOP);
  journalGraphics.textSize(16);
  journalGraphics.textStyle(NORMAL);
  journalGraphics.text("Reset browser to restart game", 40, 80);
  
  push();
  translate(-width / 2, -height / 2);
  
  // Semi-transparent background overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Journal background with border
  let journalWidth = 600;
  let journalHeight = 400;
  let journalX = (width - journalWidth) / 2;
  let journalY = (height - journalHeight) / 2;
  
  // Draw border
  stroke(139, 69, 19);
  strokeWeight(3);
  noFill();
  rect(journalX, journalY, journalWidth, journalHeight, 10);
  
  push();
  translate(journalX + journalWidth/2, journalY + journalHeight/2);
  noStroke();
  texture(journalGraphics);
  plane(journalWidth, journalHeight);
  pop();
}


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

// Check if mouse is over journal icon
function isMouseOverJournalIcon() {
  let iconSize = 50;
  let iconX = width - 120;
  let iconY = 20;
  
  return mouseX >= iconX && mouseX <= iconX + iconSize && 
         mouseY >= iconY && mouseY <= iconY + iconSize;
}

function mousePressed() {
  if (isMouseOverJournalIcon()) {
    journalOpen = !journalOpen;
  }
}

// Display journal UI
function displayJournal() {
  resetMatrix();
  camera();
  noLights();
  
  let journalGraphics = createGraphics(600, 400);
  
  journalGraphics.background(240, 235, 220); // Off-white background
  
  // Journal binding
  journalGraphics.fill(101, 67, 33);
  journalGraphics.noStroke();
  journalGraphics.rect(0, 0, 20, 400, 10, 0, 0, 10);
  
  // Title
  journalGraphics.fill(101, 67, 33);
  journalGraphics.textAlign(CENTER, TOP);
  journalGraphics.textSize(24);
  journalGraphics.textStyle(BOLD);
  journalGraphics.text("Forager's Journal", 300, 20);
  
  // Sample text
  journalGraphics.fill(50, 50, 50);
  journalGraphics.textAlign(LEFT, TOP);
  journalGraphics.textSize(16);
  journalGraphics.textStyle(NORMAL);
  journalGraphics.text("Mushrooms can be good and bad :)", 40, 80);
  
  push();
  translate(-width / 2, -height / 2);
  
  // Semi-transparent background overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Journal background with border
  let journalWidth = 600;
  let journalHeight = 400;
  let journalX = (width - journalWidth) / 2;
  let journalY = (height - journalHeight) / 2;
  
  // Draw border
  stroke(139, 69, 19);
  strokeWeight(3);
  noFill();
  rect(journalX, journalY, journalWidth, journalHeight, 10);
  
  push();
  translate(journalX + journalWidth/2, journalY + journalHeight/2);
  noStroke();
  texture(journalGraphics);
  plane(journalWidth, journalHeight);
  pop();
  
  // Close button
  fill(200, 100, 100);
  stroke(150, 50, 50);
  strokeWeight(2);
  let closeX = journalX + journalWidth - 40;
  let closeY = journalY + 10;
  ellipse(closeX, closeY, 20, 20);
  
  // X mark 
  stroke(255);
  strokeWeight(2);
  let offset = 4;
  line(closeX - offset, closeY - offset, closeX + offset, closeY + offset);
  line(closeX + offset, closeY - offset, closeX - offset, closeY + offset);
  
  pop();

  if (mouseIsPressed) {
    let closeX = width/2 + journalWidth/2 - 40;
    let closeY = height/2 - journalHeight/2 + 10;
    if (dist(mouseX, mouseY, closeX, closeY) < 10) {
      journalOpen = false;
    }
  }
}

// Hunger bar and journal icon
function displayHungerBar() {
  resetMatrix();
  camera();  // Reset to default orthographic camera
  noLights();
  push();
  translate(-width / 2, -height / 2);  // Top-left corner as origin

  // position and size
  let barWidth = 300;
  let barHeight = 25;
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

  resetMatrix();
  camera();  // Reset to default orthographic camera
  noLights();
  push();
  translate(-width / 2, -height / 2);  // Top-left corner as origin

  // Position and size for journal icon (top right)
  let iconSize = 50;
  let iconX = width - 120;  // 120px from right edge
  let iconY = 20; // 20px from top edge

  // Brown background
  fill(139, 69, 19);
  stroke(101, 67, 33);
  strokeWeight(2);
  rect(iconX, iconY, iconSize, iconSize, 5);

  // Leather on the left side
  fill(101, 67, 33);
  noStroke();
  rect(iconX, iconY, 6, iconSize, 5, 0, 0, 5);

  // Pages
  fill(240, 240, 230);
  rect(iconX + 8, iconY + 4, iconSize - 12, iconSize - 8, 0, 3, 3, 0);

  // Lines on page
  stroke(200, 200, 200);
  strokeWeight(1);
  for (let i = 0; i < 3; i++) {
    let lineY = iconY + 12 + (i * 6);
    line(iconX + 12, lineY, iconX + iconSize - 6, lineY);
  }

  // Small quill pen
  stroke(101, 67, 33);
  strokeWeight(2);
  line(iconX + 20, iconY + 35, iconX + 28, iconY + 28);

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
      highness += 0.01;
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
  if (key === "ArrowUp") {
    moveForward = false;
  }
}