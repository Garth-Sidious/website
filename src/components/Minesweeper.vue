<script setup>
import { reactive } from 'vue'

// Game states: setup (board displayed but not filled with mines), playing, won, lost
let width = 9
let height = 9
let mineCount = 10 //Sanity check for mine count
let game = reactive({})
resetGame()

// Gets the 8 (or sometimes less) neighbours of a tile, given the coordinates of the tile and a board.
function neighbours(board, x, y) {
  let result = []
  for (let k of [-1, 0, 1]) {
    for (let l of [-1, 0, 1]) {
      if (board[x + k] !== undefined && 
          board[x + k][y + l] !== undefined && 
          (k !== 0 || l !== 0)) {
        result.push(board[x + k][y + l])
      }
    }
  }
  return result
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

// Set up a minesweeper board with a width, height, and a number of mines.
// Also takes a click position x, y. This square or its neighbours cannot be mines.
// Mines should not be more than width * height.
function setupBoard(width, height, mines, x, y) {
  // Create board
  let board = blankBoard(width, height)
  // Add mines
  for (let m = 0; m < mines; m++) {
    let i = Math.floor(Math.random() * height)
    let j = Math.floor(Math.random() * width)
    while (board[i][j].value === "M" || (Math.abs(x - i) <= 1 && Math.abs(y - j) <= 1)) {
      i = Math.floor(Math.random() * height)
      j = Math.floor(Math.random() * width)
    }
    board[i][j].value = "M"
  }
  // Add numbers
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (board[i][j].value !== "M") {
        let mines = 0
        for (let neighbour of neighbours(board, i, j)) {
          if (neighbour.value === 'M') {
            mines += 1
          }
        }
        // If mines is 0, leave the tile blank
        if (mines > 0) {
          board[i][j].value = mines.toString()
        }
      }
    }
  }
  return board
}

// Mark a tile on the board as a mine.
function markTile(event, x, y) {
  if (game.board[x][y].open || game.state !== 'playing') {
    return
  }
  event.preventDefault()
  if (game.board[x][y].marked) {
    game.board[x][y].marked = false
    game.markedTiles -= 1
  } else {
    game.board[x][y].marked = true
    game.markedTiles += 1
  }
  game.minesLeft = Math.max(0, game.mines - game.markedTiles)
}

// Click a tile on the board.
// If the tile is empty, clicks the 8 tiles around it too.
function clickTile(x, y) {
  if (game.state === 'setup') {
    game.board = setupBoard(width, height, mineCount, x, y)
    game.state = 'playing'
    clickTile(x, y)
    return
  }
  if (game.board[x][y].open || game.board[x][y].marked || game.state !== 'playing') {
    return
  }
  game.board[x][y].open = true;

  if (game.board[x][y].value === 'M') {
    // Clicking a mine causes you to lose
    game.state = 'lost'
    game.board[x][y].value = 'E' //Exploded
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (game.board[i][j].value === 'M') {
          game.board[i][j].open = true
        }
      }
    }
    return
  }

  game.tilesLeft -= 1
  if (game.tilesLeft === 0) {
    // No tiles left to reveal means a win
    game.state = 'won'
    return
  }

  if (game.board[x][y].value === '') {
    for (let neighbour of neighbours(game.board, x, y)) {
      clickTile(neighbour.x, neighbour.y)
    }
  }
}

function resetGameBeginner() {
  width = 9
  height = 9
  mineCount = 10
  resetGame()
}

function resetGameIntermediate() {
  width = 16
  height = 16
  mineCount = 40
  resetGame()
}

function resetGameExpert() {
  width = 30
  height = 16
  mineCount = 99
  resetGame()
}

function resetGame() {
  game.board = blankBoard(width, height)
  game.state = 'setup',
  game.tilesLeft = width * height - mineCount
  game.mines = mineCount
  game.markedTiles = 0;
  game.minesLeft = mineCount
}

//Functions for a minesweeper solver implementation, to investigate how hard minesweeper is

</script>

<template>
  <div style="display: none;">
    <img src="@/assets/flag.svg">
    <img src="@/assets/bomb.svg">
  </div>
  <h1 id="minesweeper-header">Minesweeper</h1>
  <div id="minesweeper-container">
    <div v-for="row in game.board" class="minesweeper-row">
      <button v-for="item in row" class="minesweeper-button" 
        :class="[{ active: item.open }, { inactive: !item.open }, 'm' + item.value]"
        :disabled=item.open
        v-on:contextmenu="markTile($event, item.x, item.y)"
        v-on:click="clickTile(item.x, item.y)" >
        <img class="minesweeper-flag" v-if="!item.open && item.marked" src="@/assets/flag.svg">
        <img class="minesweeper-bomb" v-if="item.open && (item.value === 'M' || item.value === 'E')" src="@/assets/bomb.svg">
        <span v-if="item.open && item.value !== 'M'" class="minesweeper-button-text" :class="['m' + item.value]">{{ item.value }}</span>
      </button>
    </div>
  </div>
  <h4 id="minesweeper-mines-left-display">Mines Left: {{ game.minesLeft }}</h4>
  <button v-on:click="resetGameBeginner" id="minesweeper-new-game-button">New Beginner Game</button>
  <button v-on:click="resetGameIntermediate" id="minesweeper-new-game-button">New Intermediate Game</button>
  <button v-on:click="resetGameExpert" id="minesweeper-new-game-button">New Expert Game</button>
  <h2 v-if="game.state === 'won'">You Won! B)</h2>
  <h2 v-if="game.state === 'lost'">You Lost :(</h2>
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
  background-color: #FF0000;
  border: none;
}


</style>