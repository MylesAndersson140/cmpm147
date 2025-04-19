/* exported generateGrid, drawGrid */
/* global placeTile */

function generateGrid(numCols, numRows) {
    let grid = [];
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        row.push("_");
      }
      grid.push(row);
    }
    
    return grid;
  }
  
function drawGrid(grid) {
  background(128);
  
  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] == '_') {
        placeTile(i, j, (floor(random(4))), 0);
      }
    }
  }
}
  
  
  