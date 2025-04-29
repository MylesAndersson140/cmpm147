// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

"use strict";

/* global p5, XXH */
/* exported preload, setup, draw, mouseClicked */

// Engine variables - core rendering logic
let tile_width_step_main; // A width step is half a tile's width
let tile_height_step_main; // A height step is half a tile's height
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

// World variables
let time = 0;
let waterColors = [];
let skyColors = [];
const waterThreshold = 3;
let beachObjects = [];
let objectTypes = ["seashell", "starfish", "rock"];
let clicks = {};
let splashes = [];
let worldSeed;
let worldInfo = {
  minVisibleY: 0,
  maxVisibleY: 0,
  worldPosY: 0,
  minVisibleX: 0,
  minVisibleY: 0,
  worldPosX: 0
};

// Globals
let myInstance;
let canvasContainer;
var centerHorz, centerVert;

class MyClass {
    constructor(param1, param2) {
        this.property1 = param1;
        this.property2 = param2;
    }

    myMethod() {
        // code to run when method is called
    }
}

function resizeScreen() {
  const containerRect = canvasContainer[0].getBoundingClientRect(); // Gets Dimensions from DOM element.
    const containerWidth = containerRect.width;                     //canvasContainer[0] accesses the DOM from jQuery object.
    const containerHeight = containerRect.height;                   //GetBoundingClientRect() returns the size of an element and its position relative to the viewport.

    centerHorz = containerWidth / 2; // Adjusted for drawing logic
    centerVert = containerHeight / 2; // Adjusted for drawing logic
    console.log("Resizing...");
    resizeCanvas(containerWidth, containerHeight);
  // redrawCanvas(); // Redraw everything based on new size
}
function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
  let i = world_x * (tile_width_step_main * 2);
  let j = world_y * (tile_width_step_main * 2); // Using width for both dimensions to ensure square
  return [i + camera_x, j + camera_y];
}

function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
  let i = world_x * (tile_width_step_main * 2);
  let j = world_y * (tile_width_step_main * 2); // Using width for both dimensions to ensure square
  return [i, j];
}

function tileRenderingOrder(offset) {
  return [offset[0], offset[1]]; // Simple ordering for horizontal grid
}

function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
  screen_x -= camera_x;
  screen_y -= camera_y;
  let tileSize = tile_width_step_main * 2; // Using width for both dimensions
  return [Math.floor(screen_x / tileSize), Math.floor(screen_y / tileSize)];
}

function cameraToWorldOffset([camera_x, camera_y]) {
  let tileSize = tile_width_step_main * 2;
  return { x: Math.floor(camera_x / tileSize), y: Math.floor(camera_y / tileSize) };
}

function worldOffsetToCamera([world_x, world_y]) {
  let tileSize = tile_width_step_main * 2;
  return new p5.Vector(world_x * tileSize, world_y * tileSize);
}

function preload() {
  // No specific resources to preload
}

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  // resize canvas is the page is resized

  // create an instance of the class
  myInstance = new MyClass("VALUE1", "VALUE2");

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();

  camera_offset = new p5.Vector(-width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  // Initialize world
  createColorPalettes();
  time = 0;
  frameRate(30);

  let worldKeyInput = document.getElementById("world-key-input");
  worldKeyInput.addEventListener("input", function() {
    rebuildWorld(this.value);
  });

  rebuildWorld(worldKeyInput.value);
}


function rebuildWorld(key) {
  // Set the world seed based on input key
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
  
  // Create color palettes and beach objects
  createColorPalettes();
  generateBeachObjects();
  
  // Set tile dimensions
  tile_width_step_main = 16;
  tile_height_step_main = 16;
  
  // Calculate tile counts
  tile_columns = Math.ceil(width / (tile_width_step_main * 2)) + 2;
  tile_rows = Math.ceil(height / (tile_width_step_main * 2)) + 2;
}

function createColorPalettes() {
  waterColors = [
    color(20 + (worldSeed % 40), 100 + (worldSeed % 70), 170 + (worldSeed % 70)), //dark
    color(40 + (worldSeed % 50), 120 + (worldSeed % 70), 190 + (worldSeed % 60)), //mid
    color(60 + (worldSeed % 50), 140 + (worldSeed % 60), 210 + (worldSeed % 40))  //light
  ];
  
  skyColors = [
    color(50 + (worldSeed % 20), 0, 80 + (worldSeed % 50)), //dark purple near the top
    color(5 + (worldSeed % 30), 50 + (worldSeed % 40), 130 + (worldSeed % 60)), //dark blue in the middle
    color(200 + (worldSeed % 55), 80 + (worldSeed % 40), 20 + (worldSeed % 30)) //dark orange on the horizon
  ];
}

function generateBeachObjects() {
  beachObjects = [];
  
  // Define beach boundaries (use same values from terrain code)
  const beachWidth = 30 + (worldSeed % 20);
  
  // Generate random objects based on world seed
  let objectCount = 20 + (worldSeed % 30);
  for (let i = 0; i < objectCount; i++) {
    let objectSeed = XXH.h32(`object:${i}`, worldSeed);
    
    // Random position within beach area
    let x = (objectSeed % (beachWidth * 2)) - beachWidth;
    let y = waterThreshold + 1 + (objectSeed % 2);
    
    // Random object type
    let typeIndex = objectSeed % objectTypes.length;
    let type = objectTypes[typeIndex];
    
    // Random rotation and scale
    let rotation = (objectSeed % 360) / 57.3; // convert to radians
    let scale = 0.8 + (objectSeed % 5) / 10;
    
    beachObjects.push({
      x: x,
      y: y,
      type: type,
      rotation: rotation,
      scale: scale,
      placed: false // flag for user-placed vs. generated
    });
  }
}

// MOUSE INTERACTION
function mouseClicked() {
  let world_pos = screenToWorld(
    [mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );
  
  let i = world_pos[0];
  let j = world_pos[1];
  
  let key = [i, j];
  clicks[key] = 1 + (clicks[key] | 0);
  
  if (j >= 1 && j <= 3) {
    createSplash(i, j);
  }
  else if (j > waterThreshold) {
    const beachWidth = 30 + (worldSeed % 20);
    // Only allow placing objects on the beach
    if (abs(i) < beachWidth) {
      // Create a new beach object where clicked
      let clickSeed = XXH.h32(`click:${Date.now()}`, worldSeed);
      let typeIndex = clickSeed % objectTypes.length;
      let type = objectTypes[typeIndex];
      let rotation = (clickSeed % 360) / 57.3;
      let scale = 0.8 + (clickSeed % 5) / 10;
      
      beachObjects.push({
        x: i,
        y: j,
        type: type,
        rotation: rotation,
        scale: scale,
        placed: true // flag as user-placed
      });
    }
  }
  
  return false;
}

function createSplash(i, j) {
  splashes.push({
    x: i,
    y: j,
    age: 0,
    maxAge: 30 + Math.floor(random(20))
  });
}

function draw() {
  // Increment time for animations
  time += 0.05;
  
  // Update splashes
  for (let i = splashes.length - 1; i >= 0; i--) {
    splashes[i].age++;
    if (splashes[i].age > splashes[i].maxAge) {
      splashes.splice(i, 1);
    } 
  }
  
  // Keyboard controls!
  if (keyIsDown(LEFT_ARROW)) {
    camera_velocity.x += 1;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    camera_velocity.x -= 1;
  }

  let camera_delta = new p5.Vector(0, 0);
  camera_velocity.add(camera_delta);
  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.95); // cheap easing
  if (camera_velocity.mag() < 0.01) {
    camera_velocity.setMag(0);
  }

  let world_pos = screenToWorld(
    [mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );
  
  background(100);

  // Calculate the visible range in world coordinates
  let topLeftWorld = screenToWorld(
    [0, 0],
    [camera_offset.x, camera_offset.y]
  );
  
  let bottomRightWorld = screenToWorld(
    [width, height],
    [camera_offset.x, camera_offset.y]
  );
  
  // Add a buffer to ensure we draw tiles beyond the visible area
  const buffer = 5;
  let minX = topLeftWorld[0] - buffer;
  let minY = topLeftWorld[1] - buffer;
  let maxX = bottomRightWorld[0] + buffer;
  let maxY = bottomRightWorld[1] + buffer;
  
  // Make these values available for drawing
  worldInfo = {
    minVisibleX: topLeftWorld[0],
    minVisibleY: topLeftWorld[1],
    maxVisibleX: bottomRightWorld[0],
    maxVisibleY: bottomRightWorld[1],
    worldPosX: world_pos[0],
    worldPosY: world_pos[1]
  };
  
  // Draw all tiles in row-column order
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      drawTile([x, y], [camera_offset.x, camera_offset.y]);
    }
  }

  describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);
  
  // Draw additional elements
  drawAfterTiles();
}

// Display a description of the tile at world_x, world_y.
function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  
  push();
  translate(screen_x, screen_y);
  
  noFill();
  stroke(0, 200, 0, 128);
  strokeWeight(2);
  
  // Draw square outline for selected tile
  rectMode(CENTER);
  rect(0, 0, tile_width_step_main * 2, tile_width_step_main * 2);
  
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  //text("tile " + [world_x, world_y], 0, 0); // Uncomment to show coordinates
  
  pop();
}

// Draw a tile
function drawTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  
  push();
  translate(screen_x, screen_y);
  
  let i = world_x;
  let j = world_y;
  let tileSize = tile_width_step_main;
  
  noStroke();
  
  // Determine terrain type based on position
  const skyTopThreshold = -6;
  const skyMiddleThreshold = -4;
  const skyBottomThreshold = 0;
  
  // Draw sky layers with sunset gradient
  if (j <= skyTopThreshold) {
    // Top sky - dark purple
    // Get base color
    let skyColor = skyColors[0];
  
    // Add sun influence even at the top of the sky
    let sunX = sin(worldSeed * 0.01) * 20;
    let sunY = skyBottomThreshold;
    let distanceToSun = dist(i, skyBottomThreshold, sunX, sunY);
    let sunInfluence = map(distanceToSun, 0, 30, 0.3, 0);
    sunInfluence = constrain(sunInfluence, 0, 0.3);
  
    // Blend with sun color when in range
    if (distanceToSun < 30) {
      let sunColor = color(200 + (worldSeed % 55), 80 + (worldSeed % 40), 100 + (worldSeed % 30));
      skyColor = lerpColor(skyColor, sunColor, sunInfluence);
    }
  
    fill(skyColor);
  }
  
  else if (j <= skyMiddleThreshold) {
    // Middle sky - blend between dark purple and dark blue
    let skyProgress = map(j, skyTopThreshold, skyMiddleThreshold, 0, 1);
    skyProgress = constrain(skyProgress, 0, 1);
  
    let skyColor = lerpColor(skyColors[0], skyColors[1], skyProgress);
  
    // Add sun influence in the middle sky
    let sunX = sin(worldSeed * 0.01) * 20;
    let sunY = skyBottomThreshold;
    let distanceToSun = dist(i, skyBottomThreshold, sunX, sunY);
    let sunInfluence = map(distanceToSun, 0, 25, 0.5, 0);
    sunInfluence = constrain(sunInfluence, 0, 0.5);
  
    // Blend with sun color when in range
    if (distanceToSun < 25) {
      let sunColor = color(220 + (worldSeed % 35), 100 + (worldSeed % 40), 80 + (worldSeed % 30));
      skyColor = lerpColor(skyColor, sunColor, sunInfluence);
    }
  
    fill(skyColor);
  }
  
  else if (j <= skyBottomThreshold) {
    // Bottom sky - blend between dark blue and dark orange
    let skyProgress = map(j, skyMiddleThreshold, skyBottomThreshold, 0, 1);
    skyProgress = constrain(skyProgress, 0, 1);
  
    let skyColor = lerpColor(skyColors[1], skyColors[2], skyProgress);
  
    // Make sky brighter near the sun
    let sunX = sin(worldSeed * 0.01) * 20;
    let sunY = skyBottomThreshold;
    let distanceToSun = dist(i, j, sunX, sunY);
  
    if (distanceToSun < 8) {
      // Draw sun glow
      let sunBrightness = map(distanceToSun, 0, 8, 1, 0);
      sunBrightness = constrain(sunBrightness, 0, 1);
    
      // Blend with bright sun color
      let sunColor = color(255, 150 + (worldSeed % 50), 50, 255);
      skyColor = lerpColor(skyColor, sunColor, sunBrightness * 0.9);
    }
  
    fill(skyColor);
  }
  
  // Draw water tiles (between skyBottomThreshold and waterThreshold)
  else if (j > skyBottomThreshold && j <= waterThreshold) {
    // Calculate water depth - deeper water is darker
    let waterDepth = map(j, skyBottomThreshold, waterThreshold, 0, 1);
    waterDepth = constrain(waterDepth, 0, 1);
    
    // Choose between deep and shallow water color based on depth
    let waterBaseColor;
    if (waterDepth < 0.33) {
      waterBaseColor = lerpColor(waterColors[0], waterColors[1], waterDepth * 3);
    } else if (waterDepth < 0.66) {
      waterBaseColor = lerpColor(waterColors[1], waterColors[2], (waterDepth - 0.33) * 3);
    } else {
      waterBaseColor = waterColors[2];
    }
    
    // Add wave effect based on position and time using sin waves
    let waveOffset = sin(i * 0.2 + time + worldSeed * 0.01) * 0.2;
    let waveOffset2 = cos(i * 0.3 + time * 0.7 + worldSeed * 0.02) * 0.15;
    let combinedWave = waveOffset + waveOffset2;
    
    // Apply wave effect to color
    let waveIntensity = map(abs(combinedWave), 0, 0.35, 0, 1);
    let adjustedColor = color(
      waterBaseColor.levels[0] + waveIntensity * 30,
      waterBaseColor.levels[1] + waveIntensity * 30,
      waterBaseColor.levels[2] + waveIntensity * 20,
      230
    );
    
    // Add sun reflection on water
    let sunX = sin(worldSeed * 0.01) * 20;
    let distanceToSun = dist(i, 0, sunX, 0);
    
    // Add stronger reflection directly below sun position
    if (distanceToSun < 15) {
      // Sun reflection on water
      let reflectionStrength = map(distanceToSun, 0, 15, 0.7, 0);
      reflectionStrength = constrain(reflectionStrength, 0, 0.7);
      
      // Adjust reflection based on wave
      reflectionStrength *= 1 - abs(combinedWave);
      
      // Add sunset-colored reflection
      let reflectionColor = color(255, 150 + (worldSeed % 50), 50 + (worldSeed % 30));
      adjustedColor = lerpColor(adjustedColor, reflectionColor, reflectionStrength);
    }
    
    fill(adjustedColor);
    
    // Check for splashes
    for (let splash of splashes) {
      if (splash.x === i && splash.y === j) {
        let splashProgress = splash.age / splash.maxAge;
        if (splashProgress < 0) {
          let splashColor = color(255, 255, 255, 200 * (1 - splashProgress * 2));
          adjustedColor = lerpColor(adjustedColor, splashColor, 0.7);
        }
      }
    }

    // Set the fill color AFTER all adjustments
    fill(adjustedColor);
  } 
  
  // Sand colors
  else if (j > waterThreshold) {
    // Calculate horizontal distance from origin
    let horizontalDistance = abs(i);
  
    // Define terrain zones
    const beachWidth = 30 + (worldSeed % 20); // Width of the beach area
    const stoneWidth = 15 + (worldSeed % 10); // Width of the stone area
  
    // Determine terrain type based on horizontal distance
    if (horizontalDistance < beachWidth) {
      let sandSeed = XXH.h32(`sand:${i},${j}`, worldSeed);
      let r = 230 + (sandSeed % 25); 
      let g = 190 + (sandSeed % 20); 
      let b = 140 + (sandSeed % 15); 
      fill(r, g, b, 230);
    } 
    else if (horizontalDistance < beachWidth + stoneWidth) {
      let transitionProgress = map(horizontalDistance, beachWidth, beachWidth + stoneWidth, 0, 1);
      transitionProgress = constrain(transitionProgress, 0, 1);
    
      let sandSeed = XXH.h32(`sand:${i},${j}`, worldSeed);
      let sandColor = color(
        230 + (sandSeed % 25),
        190 + (sandSeed % 20),
        140 + (sandSeed % 15),
        230
      );
    
      let stoneSeed = XXH.h32(`stone:${i},${j}`, worldSeed);
      let stoneColor = color(
        120 + (stoneSeed % 30),
        120 + (stoneSeed % 25),
        120 + (stoneSeed % 20),
        230
      );
    
      let blendedColor = lerpColor(sandColor, stoneColor, transitionProgress);
      fill(blendedColor);
    } 
    else {
      let grassTransition = map(horizontalDistance, beachWidth + stoneWidth, beachWidth + stoneWidth + 20, 0, 1);
      grassTransition = constrain(grassTransition, 0, 1);
    
      // Stone
      let stoneSeed = XXH.h32(`stone:${i},${j}`, worldSeed);
      let stoneColor = color(
        120 + (stoneSeed % 30),
        120 + (stoneSeed % 25),
        120 + (stoneSeed % 20),
        230
      );
    
      // Grass
      let grassSeed = XXH.h32(`grass:${i},${j}`, worldSeed);
      let grassColor = color(
        30 + (grassSeed % 30),
        100 + (grassSeed % 50),
        30 + (grassSeed % 40),
        230
      );
    
      // Add noise for more natural transition
      let noiseVal = noise(i * 0.1, j * 0.1, worldSeed * 0.01);
      let blendFactor = grassTransition + (noiseVal * 0.3 - 0.15);
      blendFactor = constrain(blendFactor, 0, 1);

      // Blend between stone and grass
      let blendedColor = lerpColor(stoneColor, grassColor, blendFactor);
      fill(blendedColor);

      // Add occasional grass tufts
      if (j === waterThreshold + 1 && grassTransition > 0.5 && (grassSeed % 10 < 3)) {
        // Current tile is grass
        fill(blendedColor);
      }
    }
  }
  
  // Draw the actual tile
  rectMode(CENTER);
  rect(0, 0, tileSize * 2, tileSize * 2);
  
  pop();
}

// Draw elements that should appear on top of the tiles
function drawAfterTiles() {
  // Draw ripple effects for splashes
  push();
  for (let splash of splashes) {
    let [screenX, screenY] = worldToScreen([splash.x, splash.y], [camera_offset.x, camera_offset.y]);
    
    push();
    translate(screenX, screenY);
    
    let splashProgress = splash.age / splash.maxAge;
    let rippleSize = splashProgress * tile_width_step_main * 4;
    
    noFill();
    stroke(255, 255, 255, 255 * (1 - splashProgress));
    strokeWeight(2 * (1 - splashProgress));
    ellipse(0, 0, rippleSize, rippleSize * 0.5);
    pop();
  }
  pop();
  
  // Draw beach objects
  push();
  for (let obj of beachObjects) {
    // Check if object is visible
    if (obj.x >= worldInfo.minVisibleX - 1 && 
        obj.x <= worldInfo.maxVisibleX + 1 && 
        obj.y >= worldInfo.minVisibleY - 1 && 
        obj.y <= worldInfo.maxVisibleY + 1) {
      
      let [screenX, screenY] = worldToScreen([obj.x, obj.y], [camera_offset.x, camera_offset.y]);
      
      push();
      translate(screenX, screenY);
      rotate(obj.rotation);
      scale(obj.scale);
      
      // Draw different objects based on type
      if (obj.type === "seashell") {
        drawSeashell(obj);
      } 
      else if (obj.type === "starfish") {
        drawStarfish(obj);
      } 
      else if (obj.type === "rock") {
        drawRock(obj);
      }   
      pop();
    }
  }
  pop();
  
  // Draw grass tufts and stones on the non-beach areas
  push();
  let visibleMinX = worldInfo.minVisibleX;
  let visibleMaxX = worldInfo.maxVisibleX;
  let visibleMinY = worldInfo.minVisibleY;
  let visibleMaxY = worldInfo.maxVisibleY;
  
  const beachWidth = 30 + (worldSeed % 20);
  const stoneWidth = 15 + (worldSeed % 10);
  
  // Loop through visible area to add details
  for (let i = visibleMinX; i <= visibleMaxX; i++) {
    for (let j = waterThreshold + 1; j <= waterThreshold + 3; j++) {
      let horizontalDistance = abs(i);
      
      // Skip beach area
      if (horizontalDistance < beachWidth) continue;
      
      // Add details to stone area
      if (horizontalDistance < beachWidth + stoneWidth) {
        let stoneSeed = XXH.h32(`stoneDetail:${i},${j}`, worldSeed);
        if (stoneSeed % 20 < 2) { // 10% chance for stone detail
          let [screenX, screenY] = worldToScreen([i, j], [camera_offset.x, camera_offset.y]);
          
          push();
          translate(screenX, screenY);
          
          // Draw a small rock
          fill(100 + (stoneSeed % 40), 100 + (stoneSeed % 35), 100 + (stoneSeed % 30));
          noStroke();
          ellipse(0, -5, 7 + (stoneSeed % 5), 4 + (stoneSeed % 3));
          
          pop();
        }
      }
      // Add details to grass area
      else if (j === waterThreshold + 1) {
        let grassSeed = XXH.h32(`grassDetail:${i},${j}`, worldSeed);
        if (grassSeed % 10 < 3) { // 30% chance for grass tuft
          let [screenX, screenY] = worldToScreen([i, j], [camera_offset.x, camera_offset.y]);
          
          push();
          translate(screenX, screenY);
          
          // Draw grass tuft
          stroke(20 + (grassSeed % 30), 80 + (grassSeed % 60), 20 + (grassSeed % 30));
          strokeWeight(1);
          let grassHeight = 5 + (grassSeed % 8);
          
          // Blades of grass
          for (let blade = 0; blade < 3 + (grassSeed % 3); blade++) {
            let offset = (blade - 1) * 2;
            let height = grassHeight - abs(offset) * 0.5;
            let sway = sin(time * 0.5 + i * 0.1 + blade) * 1.5;
            
            line(offset, 0, offset + sway, -height);
          }
          
          pop();
        }
      }
    }
  }
  pop();
}

// OBJECT DRAWING FUNCTIONS
function drawSeashell(obj) {
  // Get seed for consistent coloration
  let seed = XXH.h32(`seashell:${obj.x},${obj.y}`, worldSeed);
  
  // Shell base color - pinkish/white
  fill(240 + (seed % 15), 220 + (seed % 20), 220 + (seed % 35));
  noStroke();
  
  // Draw shell spiral
  beginShape();
  for (let i = 0; i < 360; i += 15) {
    let rad = i / 30;
    let x = sin(radians(i)) * rad;
    let y = cos(radians(i)) * rad;
    vertex(x, y - 5);
  }
  endShape(CLOSE);
  
  // Shell ridges
  stroke(200 + (seed % 55), 180 + (seed % 40), 180 + (seed % 30));
  strokeWeight(0.5);
  noFill();
  for (let i = 0; i < 4; i++) {
    let offset = i * 1.5;
    arc(0, -5, 10 - offset, 8 - offset, PI * 0.8, PI * 2.2);
  }
}

function drawStarfish(obj) {
  // Get seed for consistent coloration
  let seed = XXH.h32(`starfish:${obj.x},${obj.y}`, worldSeed);
  
  // Starfish color - orangeish
  fill(240 + (seed % 15), 140 + (seed % 80), 80 + (seed % 60));
  noStroke();
  
  // Draw star shape
  push();
  let armCount = 5;
  let innerRadius = 3;
  let outerRadius = 8;
  
  beginShape();
  for (let i = 0; i < armCount * 2; i++) {
    let angle = TWO_PI / (armCount * 2) * i;
    let radius = i % 2 === 0 ? outerRadius : innerRadius;
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    vertex(x, y - 3);
  }
  endShape(CLOSE);
  
  fill(220 + (seed % 35), 120 + (seed % 70), 60 + (seed % 40));
  ellipse(0, -3, innerRadius * 1.2);
  pop();
}

function drawRock(obj) {
  let seed = XXH.h32(`rock:${obj.x},${obj.y}`, worldSeed);
  
  // Rock color
  fill(120 + (seed % 60), 120 + (seed % 55), 110 + (seed % 50));
  noStroke();
  
  // Rock shape
  beginShape();
  let pointCount = 6 + (seed % 4);
  for (let i = 0; i < pointCount; i++) {
    let angle = TWO_PI / pointCount * i;
    let radius = 5 + (noise(seed * 0.01, i * 0.5) * 3);
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    vertex(x, y - 2);
  }
  endShape(CLOSE);
}