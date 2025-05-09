// sketch.js provided by Prof. Wes Modes - purpose and description here
// Author: Myles Andersson
// Date: 05/07/2025

/* exported preload, setup, draw */
/* global memory, dropper, restart, rate, slider, activeScore, bestScore, fpsCounter */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;

//Animation globals
let evolutionHistory = [];
let isRecordingEvolution = false;
let isPlayingEvolution = false;
let playbackIndex = 0;
let playbackInterval;
let evolutionCanvas;
let graphCanvas;

//Auto annealing
let isAnnealing = false;
let annealInterval;
let annealStartTime;
let annealDuration = 60000;

function preload() {
  
  let allInspirations = getInspirations();

  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }
  
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];

  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

function inspirationChanged(nextInspiration) {
  if (isAnnealing) {
    stopAnnealing();
  }

  document.getElementById("slider").value = 100;
  document.getElementById("rate").innerHTML = 100;
  
  if (isPlayingEvolution) {
    clearInterval(playbackInterval);
    isPlayingEvolution = false;
    if (document.getElementById("play-evolution")) {
      document.getElementById("play-evolution").textContent = "Play";
    }
  }

  evolutionHistory = [];
  playbackIndex = 0;

  const evolutionCanvasElement = document.getElementById("evolution-canvas");
  if (evolutionCanvasElement) {
    evolutionCanvasElement.innerHTML = '';
  }

  if (document.getElementById("current-iteration")) {
    document.getElementById("current-iteration").textContent = "0";
  }
  if (document.getElementById("current-score")) {
    document.getElementById("current-score").textContent = "0";
  }
  if (document.getElementById("evolution-progress")) {
    document.getElementById("evolution-progress").textContent = "0%";
  }

  isRecordingEvolution = false;

  const evolutionViz = document.querySelector(".evolution-visualization");
  const playbackControls = document.querySelector(".playback-controls");
  if (evolutionViz && evolutionViz.style.display !== "none") {
    evolutionViz.style.display = "none";
    if (playbackControls) {
      playbackControls.style.display = "none";
    }
    if (document.getElementById("toggle-evolution")) {
      document.getElementById("toggle-evolution").textContent = "Show Evolution";
    }
  }

  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
}

function setup() {
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent(document.getElementById("active"));
  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = initDesign(currentInspiration);
  bestDesign = currentDesign;
  image(currentInspiration.image, 0,0, width, height);
  loadPixels();
  currentInspirationPixels = pixels;

  evolutionHistory = [];

  setTimeout( () => {
    setupEvolutionControls();
    setupEvolutionCanvas();
    setupAnnealingButton();
  }, 100);
}

function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;
  
  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1/(1+error/n);
}

function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.heigh = height;
  img.title = currentScore;

  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 2;
  img.height = height / 2;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  
  if(!currentDesign) {
    return;
  }
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rate.innerHTML = slider.value;
  mutateDesign(currentDesign, currentInspiration, slider.value/100.0);
  
  randomSeed(0);
  renderDesign(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;
  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
    
    if (isRecordingEvolution && mutationCount % 2 === 0) {
      evolutionHistory.push({
        design: JSON.parse(JSON.stringify(currentDesign)),
        score: currentScore,
        iteration: mutationCount
      });
      
      if (document.getElementById("evolution-progress")) {
        const progress = Math.min(100, (evolutionHistory.length / 50) * 100).toFixed(0);
        document.getElementById("evolution-progress").textContent = `${progress}%`;
      }
    }
  }
  fpsCounter.innerHTML = Math.round(frameRate());
}

function setupEvolutionControls() {
  document.getElementById("toggle-evolution").onclick = () => {
    const evolutionViz = document.querySelector(".evolution-visualization");
    const playbackControls = document.querySelector(".playback-controls");
    const toggleBtn = document.getElementById("toggle-evolution");
    
    if (evolutionViz.style.display === "none") {
      evolutionViz.style.display = "flex";
      playbackControls.style.display = "flex";
      toggleBtn.textContent = "Hide Evolution";
      isRecordingEvolution = true;
    } else {
      evolutionViz.style.display = "none";
      playbackControls.style.display = "none";
      toggleBtn.textContent = "Show Evolution";
      isRecordingEvolution = false;
      if (isPlayingEvolution) {
        clearInterval(playbackInterval);
        isPlayingEvolution = false;
        document.getElementById("play-evolution").textContent = "Play";
      }
    }
  };
  
  document.getElementById("play-evolution").onclick = () => {
    const playBtn = document.getElementById("play-evolution");
    
    if (isPlayingEvolution) {
      clearInterval(playbackInterval);
      isPlayingEvolution = false;
      playBtn.textContent = "Play";
    } else {
      isPlayingEvolution = true;
      playBtn.textContent = "Pause";
      const speed = document.getElementById("playback-speed").value;
      playbackInterval = setInterval(playbackEvolution, 1000 / speed);
    }
  };
  
  document.getElementById("playback-speed").onchange = (e) => {
    document.getElementById("speed-value").textContent = e.target.value;
    if (isPlayingEvolution) {
      clearInterval(playbackInterval);
      playbackInterval = setInterval(playbackEvolution, 1000 / e.target.value);
    }
  };
}

function setupEvolutionCanvas() {
  // Create the canvas for the evolution visualization
  evolutionCanvas = createGraphics(width, height);
}

function playbackEvolution() {
  if (evolutionHistory.length === 0) return;
  
  const histEntry = evolutionHistory[playbackIndex];
  
  evolutionCanvas.clear();
  renderToCanvas(histEntry.design, evolutionCanvas);
  
  const evolutionCanvasElement = document.getElementById("evolution-canvas");
  evolutionCanvasElement.innerHTML = '';
  
  const img = document.createElement('img');
  img.src = evolutionCanvas.canvas.toDataURL();
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.style.width = 'auto';
  img.style.height = 'auto';
  img.style.display = 'block';     
  img.style.margin = '0 auto'; 
  evolutionCanvasElement.appendChild(img);
  
  document.getElementById("current-iteration").textContent = histEntry.iteration;
  document.getElementById("current-score").textContent = histEntry.score.toFixed(6);
  
  playbackIndex = (playbackIndex + 1) % evolutionHistory.length;
}

function renderToCanvas(design, targetCanvas) {
  // Copy of your renderDesign but targeting a specific canvas
  targetCanvas.background(design.bg);
  targetCanvas.noStroke();
  
  for(let box of design.fg) {
    targetCanvas.fill(box.fill, 128);
    targetCanvas.rect(box.x, box.y, box.w, box.h);
  }

  for (let circle of design.circles) {
    targetCanvas.fill(circle.fill, circle.alpha);
    targetCanvas.ellipse(circle.x, circle.y, circle.radius*2);
  }

  for (let tri of design.triangles) {
    targetCanvas.fill(tri.fill, tri.alpha);
    targetCanvas.triangle(tri.x1, tri.y1, tri.x2, tri.y2, tri.x3, tri.y3);
  }
}

function setupAnnealingButton() {
  const annealButton = document.getElementById("auto-anneal");
  
  if (!annealButton) {
    console.error("Auto-anneal button not found!");
    return;
  }
  
  annealButton.onclick = () => {
    if (isAnnealing) {
      // Stop annealing if already running
      stopAnnealing();
    } else {
      // Start annealing
      startAnnealing();
    }
  };
}

function startAnnealing() {
  const annealButton = document.getElementById("auto-anneal");
  const sliderElement = document.getElementById("slider");
  
  if (!annealButton || !sliderElement) return;
  
  sliderElement.value = 100;
  rate.innerHTML = 100;
  
  isAnnealing = true;
  annealButton.textContent = "Stop Annealing";
  annealButton.classList.add("annealing");
  
  annealStartTime = Date.now();
  
  if (annealInterval) clearInterval(annealInterval);
  
  annealInterval = setInterval(() => {
    const elapsed = Date.now() - annealStartTime;
    const progress = Math.min(1, elapsed / annealDuration);
    
    const newValue = Math.max(1, Math.floor(100 * Math.pow(1 - progress, 2)));
    
    sliderElement.value = newValue;
    rate.innerHTML = newValue;
    
    if (progress >= 1) {
      stopAnnealing();
    }
  }, 100);
}

function stopAnnealing() {
  const annealButton = document.getElementById("auto-anneal");
  
  if (!annealButton) return;
  
  if (annealInterval) {
    clearInterval(annealInterval);
    annealInterval = null;
  }
  
  isAnnealing = false;
  annealButton.textContent = "Auto Anneal (1m)";
  annealButton.classList.remove("annealing");
}