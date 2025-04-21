
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
  
  return grid;
}
  
function drawGrid(grid) {
  background(128);
  
  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      //kind of a hard coded solution to the problem to get used to it
      switch(grid[i][j]) {
        case '_':  //background
          placeTile(i, j, floor(random(4)), 0);
          break;
        case '.':  //floor
          placeTile(i, j, 1, 10);
          break;
        case '#':  //wall
          placeTile(i, j, 3, 24);
          break;
        case 'H':  //tower (not used yet)
          placeTile(i, j, 30, 0);
          break;
        case 'C':  //chest
          placeTile(i, j, 0, 30);
          break;
        case 'T':  //tree
          placeTile(i, j, 14, 0);
          break;
        case 'W':  //water (not used yet)
          placeTile(i, j, 8, 5);
          break;
        case 'D':  //door
          placeTile(i, j, 5, 25);
          break;
        default:   //any other character, use a distinct tile
          placeTile(i, j, (grid[i][j].charCodeAt(0) % 8), 3);
          break;
      }
    }
  }
}