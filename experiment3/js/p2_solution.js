
function generateGrid(numCols, numRows) {
  let grid = [];
  
  //Fill the grid with background characters '_'
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("_");
    }
    grid.push(row);
  }
  
  //Make sure the room is at least 3x3 and fits within the grid
  //and ensuring that the grid is not too big.
  const minRoomSize = 3;
  const maxRoomWidth = Math.floor(numCols * 0.7); 
  const maxRoomHeight = Math.floor(numRows * 0.7);
  
  //Random room dimensions (at least minRoomSize)
  const roomWidth = Math.max(minRoomSize, Math.floor(random(minRoomSize, maxRoomWidth)));
  const roomHeight = Math.max(minRoomSize, Math.floor(random(minRoomSize, maxRoomHeight)));
  
  //Random room position
  const roomStartX = Math.floor(random(1, numCols - roomWidth - 1));
  const roomStartY = Math.floor(random(1, numRows - roomHeight - 1));
  const roomEndX = roomStartX + roomWidth;
  const roomEndY = roomStartY + roomHeight;
  
  //Paint the rectangular room with '.' characters
  for (let i = roomStartY; i < roomEndY; i++) {
    for (let j = roomStartX; j < roomEndX; j++) {
      grid[i][j] = ".";
    }
  }
  
  return grid;
}
  
function drawGrid(grid) {
  background(128);
  
  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] == '_') {
        //Draw background cells
        placeTile(i, j, (floor(random(4))), 0);
      } else if (grid[i][j] == '.') {
        //Draw room cells with a different tile
        placeTile(i, j, 0, 1); //Using tile at position (0,1) for room
      }
    }
  }
}

function drawGrid(grid) {
background(128);

for(let i = 0; i < grid.length; i++) {
  for(let j = 0; j < grid[i].length; j++) {
    if (grid[i][j] == '_') {
      //Draw empty cells
      placeTile(i, j, (floor(random(4))), 0);
    } else if (grid[i][j] == 'X') {
      //Draw filled cells (the square) - use a different tile appearance
      placeTile(i, j, 0, 1); //Using a different tile for the square
    }
  }
}
}