//Name: Myles Andersson
//Date: 04/21/2025

// Check if location i,j is inside the grid and matches the target character, inspired from professors slides (slide 9)
function gridCheck(grid, i, j, target) {
  if (i >= 0 && i < grid.length && j >= 0 && j < grid[0].length) {
    //checking for wall or door
    if (target === '#' && grid[i][j] === 'D') {
      return true;
    }
    return grid[i][j] === target;
  }
  return false;
}

//4-bit code representing neighbors, inspired from professors slides (slide 9)
function gridCode(grid, i, j, target) {
  let north = gridCheck(grid, i, j-1, target);
  let south = gridCheck(grid, i, j+1, target);
  let east = gridCheck(grid, i+1, j, target);
  let west = gridCheck(grid, i-1, j, target);

  return (north << 0) + (south << 1) + (east << 2) + (west << 3);
}

//tile with context based on neighboring tiles, inspired from professors slides (slide 9)
function drawContext(grid, i, j, target, dti, dtj) {
  const code = gridCode(grid, i, j, target);
  const [tiOffset, tjOffset] = lookup[code];
  placeTile(i, j, dti + tiOffset, dtj + tjOffset);
}

//inspired from professors slides (slide 9)
const lookup = [
  [1,1],
  [0,1],
  [1,1],
  [1,0],
  [0,1], //next to door 
  [-2,0], //top right corner
  [0,0], //top left corner
  [0,0],
  [0,1], //next to door
  [-2,0], //bottom right corner
  [-2,0], //bottom left corner
  [0,0],
  [0,1],
  [0,0], 
  [0,0],
  [0,0], 
];

function generateGrid(numCols, numRows) {
  let grid = [];
  
  //fill the grid with background characters '_'
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("_");
    }
    grid.push(row);
  }
  
  //random room dimensions and position
  const minRoomSize = 3;
  const maxRoomWidth = Math.floor(numCols * 0.7);
  const maxRoomHeight = Math.floor(numRows * 0.7);
  
  const roomWidth = Math.max(minRoomSize, Math.floor(random(minRoomSize, maxRoomWidth)));
  const roomHeight = Math.max(minRoomSize, Math.floor(random(minRoomSize, maxRoomHeight)));
  
  const roomStartX = Math.floor(random(1, numCols - roomWidth - 1));
  const roomStartY = Math.floor(random(1, numRows - roomHeight - 1));
  const roomEndX = roomStartX + roomWidth;
  const roomEndY = roomStartY + roomHeight;
  
  //paint the room floor with '.'
  for (let i = roomStartY; i < roomEndY; i++) {
    for (let j = roomStartX; j < roomEndX; j++) {
      grid[i][j] = ".";
    }
  }
  
  //adding walls to the room
  for (let i = roomStartY - 1; i <= roomEndY; i++) {
    for (let j = roomStartX - 1; j <= roomEndX; j++) {
      //if this is the border of the room and not outside the grid
      if ((i === roomStartY - 1 || i === roomEndY || j === roomStartX - 1 || j === roomEndX) && 
          i >= 0 && i < numRows && j >= 0 && j < numCols && grid[i][j] === '_') {
        grid[i][j] = "#";
      }
    }
  }
  
  const doorWall = Math.floor(random(4));
  let doorX, doorY;
  
  switch(doorWall) {
    case 0: //top wall
      doorX = roomStartX + Math.floor(random(roomWidth));
      doorY = roomStartY - 1;
      break;
    case 1: //right wall
      doorX = roomEndX;
      doorY = roomStartY + Math.floor(random(roomHeight));
      break;
    case 2: //bottom wall
      doorX = roomStartX + Math.floor(random(roomWidth));
      doorY = roomEndY;
      break;
    case 3: //left wall
      doorX = roomStartX - 1;
      doorY = roomStartY + Math.floor(random(roomHeight));
      break;
  }
  
  //door on the outer perimiter of the room
  if (doorY >= 0 && doorY < numRows && doorX >= 0 && doorX < numCols) {
    grid[doorY][doorX] = "D";
  }
  
  //adding a chest inside the room
  const chestX = roomStartX + Math.floor(random(roomWidth));
  const chestY = roomStartY + Math.floor(random(roomHeight));
  grid[chestY][chestX] = "C";
  
  //adding trees into the world
  const numTrees = Math.floor(random(3, 8));
  for (let t = 0; t < numTrees; t++) {
    const treeX = Math.floor(random(numCols));
    const treeY = Math.floor(random(numRows));
    if (grid[treeY][treeX] === '_') {
      grid[treeY][treeX] = "T";
    }
  }

  const numhouses = Math.floor(random(3, 8));
  for (let t = 0; t < numhouses; t++) {
    const houseX = Math.floor(random(numCols));
    const houseY = Math.floor(random(numRows));
    if (grid[houseY][houseX] === '_') {
      grid[houseY][houseX] = "H";
    }
  }
  const pondSizeX = Math.floor(random(3, 6));
  const pondSizeY = Math.floor(random(3, 6));
  const pondX = Math.floor(random(numCols - pondSizeX));
  const pondY = Math.floor(random(numRows - pondSizeY));
  
  for (let i = 0; i < pondSizeY; i++) {
    for (let j = 0; j < pondSizeX; j++) {
      //noise to create irregular edges
      const edgeNoise = noise(i * 0.5, j * 0.5);
      const distanceFromCenter = Math.abs(i - pondSizeY/2) + Math.abs(j - pondSizeX/2);
      const maxDistance = (pondSizeX + pondSizeY) / 2;
      
      if (distanceFromCenter / maxDistance < 0.7 || edgeNoise > 0.3) {
        if (pondY + i >= 0 && pondY + i < numRows && 
            pondX + j >= 0 && pondX + j < numCols && 
            grid[pondY + i][pondX + j] === '_') {
          grid[pondY + i][pondX + j] = "W";
        }
      }
    }
  }
  
  return grid;
}
  
function drawGrid(grid) { //Implementation inspired by Gabe Ahrens 
  background(128);

  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      // plains
      if (gridCheck(grid, i, j, "_")) {
        placeTile(i, j, floor(random(4)), 0);
      }

      //door
      else if (gridCheck(grid, i, j, "D")) {
        drawContext(grid, i, j, 'D', 5, 25);
      }
    
      // walls
      else if (gridCheck(grid, i, j, "#")) {
        placeTile(i, j, floor(random(4)), 10);
        drawContext(grid, i, j, '#', 5, 21);
      }
    
      // dungeon floor
      else if (gridCheck(grid, i, j, ".")) {
        placeTile(i, j, floor(random(4)), 10);
        
        let t = millis() / 1000;
        let fungusChance = noise(i * 0.3, j * 0.3, t * 0.2);
        if (fungusChance > 0.6) {
          placeTile(i, j, 1, 16);
        }
      }
      
      // trees
      else if (gridCheck(grid, i, j, "T")) {
        placeTile(i, j, floor(random(4)), 0);
        placeTile(i, j, 14, 0);
      }

      // chest
      else if (gridCheck(grid, i, j, "C")) {
        placeTile(i, j, 0, 30);
      }
      
      // houses
      else if (gridCheck(grid, i, j, "H")) {
        placeTile(i, j, random(1), 3);
        placeTile(i, j, 26, 3);
      }

      //water/pond
      else if (gridCheck(grid, i, j, "W")) {
        placeTile(i, j, floor(random(4)), 13);
        
        //water animation effect
        let t = millis() / 800;
        let waveChance = noise(i * 0.5, j * 0.5, t * 0.5);
        if (waveChance > 0.7) {
          //bubbles/ripples occasionally
          placeTile(i, j, 2, 13);
        }
      }
    }
  }
}