<script setup>
import { reactive } from 'vue'

// Game states: setup (board displayed but not filled with mines), playing, won, lost
let mainGame = reactive({})
resetGameBeginner(mainGame)

// Gets the 8 (or sometimes less) neighbours of a tile, given a board and a tile.
function neighbours(board, tile) {
  let tiles = []
  for (let k of [-1, 0, 1]) {
    for (let l of [-1, 0, 1]) {
      if (board[tile.x + k] !== undefined && 
          board[tile.x + k][tile.y + l] !== undefined && 
          (k !== 0 || l !== 0)) {
        tiles.push(board[tile.x + k][tile.y + l])
      }
    }
  }
  return tiles
}

// Gets every tile on a board
function allTiles(board) {
  let tiles = []
  for (let row of board) {
    for (let tile of row) {
      tiles.push(tile)
    }
  }
  return tiles
}

// Create a blank minesweeper board, for setup use.
function blankBoard(width, height) {
  // Create board
  let board = []
  for (let i = 0; i < height; i++) {
    let row = []
    for (let j = 0; j < width; j++) {
      row.push({value: '', open: false, marked: false, x: i, y: j});
    }
    board.push(row)
  }
  return board
}

// Set up a minesweeper board with a blank board, width, height, and a number of mines.
// Also takes a clicked tile. This tile or its neighbours cannot be mines.
function setupBoard(board, width, height, mines, clickedTile) {
  // Add mines
  for (let m = 0; m < mines; m++) {
    let i = Math.floor(Math.random() * height)
    let j = Math.floor(Math.random() * width)
    while (board[i][j].value === "M" || (Math.abs(clickedTile.x - i) <= 1 && Math.abs(clickedTile.y - j) <= 1)) {
      i = Math.floor(Math.random() * height)
      j = Math.floor(Math.random() * width)
    }
    board[i][j].value = "M"
  }
  // Add numbers
  for (let tile of allTiles(board)) {
    if (tile.value !== "M") {
      let mines = 0
      for (let neighbour of neighbours(board, tile)) {
        if (neighbour.value === 'M') {
          mines += 1
        }
      }
      // If mines is 0, leave the tile blank
      if (mines > 0) {
        tile.value = mines.toString()
      }
    }
  }
  console.log(board)
  return board
}

// Mark a tile on the board as a mine and disable right click events.
function markTileRightClick(event, game, tile) {
  if (tile.open || game.state !== 'playing') {
    return
  }
  event.preventDefault()
  markTile(game, tile)
}

// Mark a tile on the board as a mine.
function markTile(game, tile) {
  if (tile.open || game.state !== 'playing') {
    return
  }
  if (tile.marked) {
    tile.marked = false
    game.markedTiles -= 1
  } else {
    tile.marked = true
    game.markedTiles += 1
  }
  game.minesLeft = Math.max(0, game.mines - game.markedTiles)
}

// Click a tile on the board.
// If the tile is empty, clicks the 8 tiles around it too.
function clickTile(game, tile) {
  if (game.state === 'setup') {
    game.board = setupBoard(game.board, game.width, game.height, game.mines, tile)
    game.state = 'playing'
  }
  if (tile.open || tile.marked || game.state !== 'playing') {
    return
  }
  tile.open = true;

  if (tile.value === 'M') {
    // Clicking a mine causes you to lose
    for (let revealTile of allTiles(game.board)) {
      if (revealTile.value === 'M') {
        revealTile.open = true
      }
    }
    game.state = 'lost'
    tile.value = 'E' //Exploded
    return
  }

  game.tilesLeft -= 1
  if (game.tilesLeft === 0) {
    // No tiles left to reveal means a win
    for (let revealTile of allTiles(game.board)) {
      if (revealTile.value === 'M' && !revealTile.marked) {
        markTile(game, revealTile)
      }
    }
    game.state = 'won'
    return
  }

  if (tile.value === '') {
    for (let neighbour of neighbours(game.board, tile)) {
      clickTile(game, neighbour)
    }
  }
}

function resetGameBeginner(game) {
  resetGame(game, 5, 5, 3)
}

function resetGameIntermediate(game) {
  resetGame(game, 16, 16, 40)
}

function resetGameExpert(game) {
  resetGame(game, 30, 16, 99)
}

function resetGame(game, width, height, mineCount) {
  game.board = blankBoard(width, height)
  game.state = 'setup'
  game.width = width
  game.height = height
  game.tilesLeft = width * height - mineCount
  game.mines = mineCount
  game.markedTiles = 0;
  game.minesLeft = mineCount
}

//Functions for a minesweeper solver implementation, to investigate how hard minesweeper is
function runSolverTests(game) {
  resetGameBeginner(game)
  clickTile(game, game.board[4][4])
  solveBoard(0)
  while (game.state == 'won') {
    resetGameBeginner(game)
    clickTile(game, game.board[4][4])
    solveBoard(0)
  }
}

//Solve the main game board
function solveBoard(depth) {
  if (depth > 1000) {
    return
  }
  let frontier = getFrontier()
  let progress = false
  for (let tile of frontier) {
    if (trivialSolveTile(tile, depth)) {
      progress = true
    }
  }
  if (progress) {
    solveBoard(depth += 1)
  }
}

//Get a list of all tiles worth investigating on the main board 
//(all number tiles with less flags next to them than the number on the tile)
function getFrontier() {
  let frontier = []
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let tile = game.board[i][j]
      if (frontierTile(tile)) {
        frontier.push(tile)
      }
    }
  }
  return frontier
}

function frontierTile(tile) {
  if (tile.open && tile.value in '123456789'.split('')) {
    let closedNeighbours = 0
    for (let neighbour of neighbours(game.board, tile.x, tile.y)) {
      if (!neighbour.open && !neighbour.marked) {
        closedNeighbours += 1
      }
    }
    return closedNeighbours > 0
  }
  return false
}

function trivialSolveTile(tile) {
  let minesLeft = parseInt(tile.value)
  let closedTiles = 0
  for (let neighbour of neighbours(game.board, tile.x, tile.y)) {
    if (neighbour.marked) {
      minesLeft -= 1
    } else if (!neighbour.open) {
      closedTiles += 1
    }
  }
  if (minesLeft === 0) {
    for (let neighbour of neighbours(game.board, tile.x, tile.y)) {
      if (!neighbour.marked && !neighbour.open) {
        clickTile(neighbour.x, neighbour.y)
      }
    }
    return true
  } else if (minesLeft === closedTiles) {
    for (let neighbour of neighbours(game.board, tile.x, tile.y)) {
      if (!neighbour.marked && !neighbour.open) {
        markTile(game, neighbour)
      }
    }
    return true
  }
  return false
}

</script>

<template>
  <div style="display: none;">
    <img src="@/assets/flag.svg">
    <img src="@/assets/bomb.svg">
  </div>
  <h1 id="minesweeper-header">Minesweeper</h1>
  <div id="minesweeper-container">
    <div v-for="row in mainGame.board" class="minesweeper-row">
      <button v-for="tile in row" class="minesweeper-button" 
        :class="[{ active: tile.open }, { inactive: !tile.open }, 'm' + tile.value]"
        :disabled=tile.open
        v-on:contextmenu="markTileRightClick($event, mainGame, tile)"
        v-on:click="clickTile(mainGame, tile)" >
        <img class="minesweeper-flag" v-if="!tile.open && tile.marked" src="@/assets/flag.svg">
        <img class="minesweeper-bomb" v-if="tile.open && (tile.value === 'M' || tile.value === 'E')" src="@/assets/bomb.svg">
        <span v-if="tile.open && tile.value !== 'M' && tile.value !== 'E'" class="minesweeper-button-text" :class="['m' + tile.value]">{{ tile.value }}</span>
      </button>
    </div>
  </div>
  <h4 id="minesweeper-mines-left-display">Mines Left: {{ mainGame.minesLeft }}</h4>
  <button v-on:click="resetGameBeginner(mainGame)" id="minesweeper-new-game-button">New Beginner Game</button>
  <button v-on:click="resetGameIntermediate(mainGame)" id="minesweeper-new-game-button">New Intermediate Game</button>
  <button v-on:click="resetGameExpert(mainGame)" id="minesweeper-new-game-button">New Expert Game</button>
  <button v-on:click="runSolverTests(mainGame)" id="minesweeper-new-game-button">Autosolve (For Dev Use)</button>
  <h2 v-if="mainGame.state === 'won'">You Won! B)</h2>
  <h2 v-if="mainGame.state === 'lost'">You Lost :(</h2>
</template>

<style scoped>

#minesweeper-header {
  text-align: center;
}

#minesweeper-container {
  display: inline-block;
  border-bottom-color: white;
  border-right-color: white;
  border-left-color: #7B7B7B;
  border-top-color: #7B7B7B;
  border-width: 3px;
  border-style: solid;
}

.minesweeper-row {
  margin: auto;
  white-space: nowrap;
}
.minesweeper-button {
  vertical-align: top;
  width: 25px;
  height: 25px;
  border-radius: 0px;
}

.minesweeper-button-text {
  font-weight: bold;
  font-size: 22px;
  top: -4px;
  left: -1px;
}

.minesweeper-button-text.m1 {
  color: #0023F5;
}
.minesweeper-button-text.m2 {
  color: #007B00;
}
.minesweeper-button-text.m3 {
  color: red;
}
.minesweeper-button-text.m4 {
  color: #00007B;
}
.minesweeper-button-text.m5 {
  color: #7B0000;
}
.minesweeper-button-text.m6 {
  color: #007B7B;
}
.minesweeper-button-text.m7 {
  color: black;
}
.minesweeper-button-text.m8 {
  color: #7B7B7B;
}

.minesweeper-button.active {
  border-width: 1px;
  border-color: #BDBDBD;
  background-color: #BDBDBD;
}

.minesweeper-button.inactive {
  border-bottom-color: #7B7B7B;
  border-right-color: #7B7B7B;
  border-left-color: white;
  border-top-color: white;
  border-width: 3px;
  background-color: #BDBDBD;
}

#minesweeper-new-game-button {
  border-radius: 0px;
  border-bottom-color: #7B7B7B;
  border-right-color: #7B7B7B;
  border-left-color: white;
  border-top-color: white;
  border-width: 3px;
  background-color: #BDBDBD;
  display: block;
  margin: auto;
  margin-bottom: 5px;
}

#minesweeper-mines-left-display {
  border-radius: 0px;
  display: block;
  margin: auto;
}

.minesweeper-flag {
  width: 120%;
  height: auto;
  top: 1px;
  left: -1px;
}
.minesweeper-bomb {
  width: 130%;
  height: auto;
  left: -2px;
}

.minesweeper-button.mE {
  background-color: red;
  border: none;
}


</style>