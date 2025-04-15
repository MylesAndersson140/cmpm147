// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
let seed = 239;

//sky gradient
let skyColors = [];
let cloudLineCount = 0;
let cloudAmplitude = 0;
let cloudFrequency = 0;
let cloudThickness = 0;

//complex polygon tree
let treeX, treeY;
let trunkHeight, trunkWidth;
let trunkCurve;
let trunkColor;
let leafSize;
let leafDensity;
let leafColor;

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  
  treeX = width * 0.85;
  treeY = height;
}

function generateSkyProperties() {
  randomSeed(seed);
  
  //Array to hold desired colors for the sky
  skyColors = [];
  
  //Colors from image
  skyColors.push(color(80, 60, 90)); // Top, blue/purple
  skyColors.push(color(180, 120, 100)); // Middle, medium orange
  skyColors.push(color(230, 170, 120)); // Bottom, light orange
  
  //randomize the cloud ripple pattern based on seed
  cloudLineCount = floor(random(30, 70));
  cloudAmplitude = random(5, 15);
  cloudFrequency = random(0.1, 0.3);
  cloudThickness = random(1, 2.5);

  //complex polygon tree
  treeX = width * 0.85;
  treeY = height;
  trunkHeight = height * random(0.3, 0.5);
  trunkWidth = width * random(0.01, 0.02);
  trunkCurve = random(-0.2, 0.2); 
  leafSize = width * random(0.05, 0.12); 
  leafDensity = random(0.7, 2.5); 

  let brownR = random(60, 100);
  let brownG = random(30, 60);
  let brownB = random(10, 30);
  trunkColor = color(brownR, brownG, brownB);

  let greenR = random(10, 50);
  let greenG = random(30, 180);
  let greenB = random(20, 80);
  leafColor = color(greenR, greenG, greenB);
}

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  let reimagineButton = createButton("New Sky");
  reimagineButton.mousePressed(() => {
    seed = floor(random(1000));
    generateSkyProperties();
  });
  // resize canvas is the page is resized

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
  generateSkyProperties();
}

//draw() function is called repeatedly, it's the main animation loop
function draw() {
  //Draw sky gradient
  drawSkyGradient();
  
  //Draw cloud ripple pattern
  drawCloudPattern();
  
  //tree / foliage
  drawTree();

  //Show current seed value
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Seed: ${seed}`, 10, 10);
}

function drawSkyGradient() {
  //vertical gradient
  for (let y = 0; y < height; y++) {
    let progress = y / height;
    
    //finding where we are in the gradient
    let numSegments = skyColors.length - 1;
    let segment = floor(progress * numSegments);
    segment = constrain(segment, 0, numSegments - 1);
    
    //progress within a specific segment
    let segmentProgress = (progress * numSegments) - segment;
    
    //melding colors to make it more dynamic
    let c1 = skyColors[segment];
    let c2 = skyColors[segment + 1];
    //used to create smooth color transitions
    let interpColor = lerpColor(c1, c2, segmentProgress);
    
    //draw the line on the canvas
    stroke(interpColor);
    line(0, y, width, y);
  }
}

function drawCloudPattern() {
  noFill();
  
  //for potentially speratic clouds
  let spacing = height / cloudLineCount;
  
  //horizontal ripple lines with varying opacity
  for (let i = 0; i < cloudLineCount; i++) {
    let y = i * spacing;
    let progress = y / height;
    
    //clouds more dense in the middle
    let opacity = sin(progress * PI) * 100;
    
    //cloud color
    let skyColor = getColorAtHeight(y);
    let cloudColor = color(
      red(skyColor) + 30, 
      green(skyColor) + 30, 
      blue(skyColor) + 30, 
      opacity
    );
    
    stroke(cloudColor);
    strokeWeight(cloudThickness);
    
    //a nice sin wave to make the cloud
    beginShape();
    for (let x = 0; x < width; x++) {
      let noiseVal = noise(x * 0.01, i * 0.1, seed * 0.1);
      let offset = sin(x * cloudFrequency) * cloudAmplitude * noiseVal;
      vertex(x, y + offset);
    }
    endShape();
  }
  
  //reset
  strokeWeight(1);
}

function drawTree() {
  
  //Tree height
  let trunkTopX = treeX + trunkCurve * trunkHeight;
  let trunkTopY = treeY - trunkHeight;
  
  //better trunk using a bezier curve
  fill(trunkColor);
  noStroke();
  beginShape();
  //bottom left of trunk
  vertex(treeX - trunkWidth/2, treeY);
  
  //left side of trunk
  bezierVertex(
    treeX - trunkWidth/2 - trunkCurve * trunkHeight * 0.3, treeY - trunkHeight * 0.33,
    treeX - trunkWidth/3 + trunkCurve * trunkHeight * 0.5, treeY - trunkHeight * 0.66,
    trunkTopX - trunkWidth/4, trunkTopY
  );
  
  //top of trunk
  vertex(trunkTopX + trunkWidth/4, trunkTopY);
  
  //right side of trunk using bezier
  bezierVertex(
    treeX + trunkWidth/3 + trunkCurve * trunkHeight * 0.5, treeY - trunkHeight * 0.66,
    treeX + trunkWidth/2 + trunkCurve * trunkHeight * 0.3, treeY - trunkHeight * 0.33,
    treeX + trunkWidth/2, treeY
  );
  
  endShape(CLOSE);
  
  //draw static-y looking leaves at the top
  drawLeaves(trunkTopX, trunkTopY, leafSize, leafDensity);
}

function drawLeaves(x, y, size, density) {
  //static leaf clusters using multiple small circles
  fill(leafColor);
  noStroke();
  
  let numLeaves = floor(size * density * 10);
  
  //using noise to create a general leaf cluster shape
  for (let i = 0; i < numLeaves; i++) {
    //using noise to determine the position within the cluster
    let angle = random(10);
    let radius = random(size * 0.8, size * 0.5) * noise(i * 0.1 , seed);
    
    let leafX = x + cos(angle) * radius;
    let leafY = y + sin(angle) * radius * 0.8;
    
    //varied leaf size
    let leafRadius = random(size * 0.03, size * 0.15);
    
    ellipse(leafX, leafY, leafRadius, leafRadius);
  }
}

//a helper function to get the interpolated color at a specific height, basically what we had in drawSkyGradient()
function getColorAtHeight(y) {
  let progress = y / height;
  
  let numSegments = skyColors.length - 1;
  let segment = floor(progress * numSegments);
  segment = constrain(segment, 0, numSegments - 1);
  
  let segmentProgress = (progress * numSegments) - segment;
  
  let c1 = skyColors[segment];
  let c2 = skyColors[segment + 1];
  return lerpColor(c1, c2, segmentProgress);
}

// mousePressed() function is called once after every time a mouse button is pressed
function mousePressed() {
    // code to run when mouse is pressed
}