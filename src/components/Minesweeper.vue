<script setup>
import { reactive } from 'vue'

// Game states: setup (board displayed but not filled with mines), playing, won, lost
let mainGame = reactive({})
resetGame(mainGame, 9, 9, 10, smartSetupBeginner)

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

// Get the 24 (or sometimes less) neighbours of neighbours of a tile.
function grandneighbours(board, tile) {
  let tiles = []
  for (let k of [-2, -1, 0, 1, 2]) {
    for (let l of [-2, -1, 0, 1, 2]) {
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
function setupBoard(game, clickedTile) {
  // Add mines
  for (let m = 0; m < game.mines; m++) {
    let i = Math.floor(Math.random() * game.height)
    let j = Math.floor(Math.random() * game.width)
    while (game.board[i][j].value === "M" || (Math.abs(clickedTile.x - i) <= 1 && Math.abs(clickedTile.y - j) <= 1)) {
      i = Math.floor(Math.random() * game.height)
      j = Math.floor(Math.random() * game.width)
    }
    game.board[i][j].value = "M"
  }
  // Add numbers
  for (let tile of allTiles(game.board)) {
    if (tile.value !== "M") {
      let mines = 0
      for (let neighbour of neighbours(game.board, tile)) {
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
}

function resetBoard(board) {
  for (let tile of allTiles(board)) {
    tile.open = false
    tile.marked = false
  }
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
function clickTile(game, tile, percolate = true) {
  if (game.state === 'setup') {
    game.generator(game, tile)
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

  if (tile.value === '' && percolate) {
    for (let neighbour of neighbours(game.board, tile)) {
      clickTile(game, neighbour)
    }
  }
}

function resetGame(game, width, height, mineCount, generator) {
  game.board = blankBoard(width, height)
  game.state = 'setup'
  game.width = width
  game.height = height
  game.tilesLeft = width * height - mineCount
  game.mines = mineCount
  game.markedTiles = 0
  game.minesLeft = mineCount
  game.generator = generator
}

//Reset the game to playing state, but keep the same board.
function resetGameStatic(game) {
  resetBoard(game.board)
  game.state = 'playing'
  game.tilesLeft = game.width * game.height - game.mines
  game.markedTiles = 0
  game.minesLeft = game.mines
}

//Create a game from a mintuare representation, for use in testing (and possibly other things?).
//Format for mini is an array of mines M, marked mines X, closed tiles C, and open tiles O.
function miniToGame(mini, game) {
  game.state = 'playing'
  game.width = mini.length
  game.height = mini[0].length
  game.board = blankBoard(game.width, game.height)
  let mineCount = 0
  for (let tile of allTiles(game.board)) {
    let miniTile = mini[tile.y][tile.x]
    if (miniTile === 'M' || miniTile === 'X') {
      tile.value = 'M'
      mineCount += 1
    }
    if (miniTile === 'X') {
      tile.marked = true
    }
    if (miniTile === 'O') {
      tile.open = true
    }
  }
  for (let tile of allTiles(game.board)) {
    if (tile.value !== "M") {
      let mines = 0
      for (let neighbour of neighbours(game.board, tile)) {
        if (neighbour.value === 'M') {
          mines += 1
        }
      }
      if (mines > 0) {
        tile.value = mines.toString()
      }
    }
  }
  game.mines = mineCount
  game.tilesLeft = game.width * game.height - game.mines
  game.markedTiles = 0
  game.minesLeft = game.mines
}

//Create a mini from a gamr, for use in testing (and possibly other things?).
//Format for mini is an array of mines M, marked mines X, closed tiles C, and open tiles O.
function gameToMini(game) {
  let mini = Array(game.height).fill().map(() => Array(game.width).fill(0));
  for (let tile of allTiles(game.board)) {
    if (tile.value === 'M') {
      if (tile.marked === true) {
        mini[tile.y][tile.x] = 'X'
      } else {
        mini[tile.y][tile.x] = 'M'
      }
    } else {
      if (tile.open === true) {
        mini[tile.y][tile.x] = 'O'
      } else {
        mini[tile.y][tile.x] = 'C'
      }
    }
  }
  return mini
}

//Functions for a minesweeper solver implementation, to investigate how hard minesweeper is
//Also for use in always generating solvable boards.
function smartSetupBeginner(game, clickedTile) {
  let testGame = {}
  resetGame(testGame, 9, 9, 10, setupBoard)
  clickTile(testGame, testGame.board[clickedTile.x][clickedTile.y])
  solveGameBeginner(testGame)
  while (testGame.state == 'playing') {
    resetGame(testGame, 9, 9, 10, setupBoard)
    clickTile(testGame, testGame.board[clickedTile.x][clickedTile.y])
    solveGameBeginner(testGame)
  }
  resetBoard(testGame.board)
  for (let tile of allTiles(testGame.board)) {
    game.board[tile.x][tile.y].value = tile.value
  }
}

function smartSetupIntermediate(game, clickedTile) {
  let testGame = {}
  resetGame(testGame, 16, 16, 40, setupBoard)
  clickTile(testGame, testGame.board[clickedTile.x][clickedTile.y])
  let usage = solveGameIntermediate(testGame)
  let weightedUsage = 0
  if (usage) {
    weightedUsage = ((usage[1] + 1) * (usage[2] + 1) * (usage[3] + 1))
  }
  while (weightedUsage <= 2) {
    console.log(weightedUsage)
    resetGame(testGame, 16, 16, 40, setupBoard)
    clickTile(testGame, testGame.board[clickedTile.x][clickedTile.y])
    usage = solveGameIntermediate(testGame)
    weightedUsage = 0
    if (usage) {
      weightedUsage = ((usage[1] + 1) * (usage[2] + 1) * (usage[3] + 1))
    }
  }
  resetBoard(testGame.board)
  for (let tile of allTiles(testGame.board)) {
    game.board[tile.x][tile.y].value = tile.value
  }
}

// Run a set of unit tests to make sure the various solvers work as intended
function runUnitTests(game) {
  miniToGame([
  'MMM', 
  'MCM', 
  'MMM'], game)
  solveGameBeginner(game)
  console.log(gameToMini(game))
}

function runSolverTests(game) {
  let count = 10
  let usages = []
  let testGame = {} 
  for (let i = 0; i < count; i++) {
    resetGame(testGame, 16, 16, 40, setupBoard)
    clickTile(testGame, testGame.board[4][4])
    let usage = solveGameIntermediate(testGame)
    if (testGame.state === 'lost') {
      print('lmao')
    }
    if (usage) {
      usages.push((usage[1] + 1) * (usage[2] + 1) * (usage[3] + 1))
    }
  }
  resetGame(game, 16, 16, 40, setupBoard)
  game.board = testGame.board
  game.tilesLeft = testGame.tilesLeft
  game.markedTiles = testGame.markedTiles
  game.minesLeft = testGame.minesLeft
  game.state = testGame.state
  usages.sort((a, b) => a - b)
  console.log(usages)
}

//Solve a game board with beginner strategies.
function solveGameBeginner(game, cycleTracker=[0]) {
  let frontier = new Frontier(game.board)
  while (!frontier.isEmpty()) {
    cycleTracker[cycleTracker.length - 1] += 1
    trivialSolver(game, frontier.pop(), frontier)
  }
}

//Solve a game board with intermediate strategies.
function solveGameIntermediate(game, cycleTracker=[0]) {
  let functions = [trivialSolver, dominationSolver, avoidanceSolver, supplySolver]
  let frontiers = new MultiFrontier(game.board, functions)
  let frontier = 0
  let usageTracker = [0, 0, 0, 0]
  while (frontier < functions.length) {
    while (!frontiers.get(frontier).isEmpty()) {
      if (cycleTracker[cycleTracker.length - 1] >= 100000) {
        console.log('THE BIG BAD')
        return
      }
      cycleTracker[cycleTracker.length - 1] += 1
      if (functions[frontier](game, frontiers.pop(frontier), frontiers, cycleTracker[cycleTracker.length - 1])) {
        usageTracker[frontier] += 1
        frontier = 0
        if (game.state === 'won') {
          return usageTracker
        }
      }
    }
    frontier += 1
  }
  return
}

// Solves a specific tile of a minesweeper game with trivial methods.
// Specifically, if a tile has no mines left to mark around it, open all other tiles next to it,
// and if a tile has n closed tiles around it and n mines left, mark all those squares.
function trivialSolver(game, tile, frontier) {
  let minesLeft = parseInt(tile.value)
  if (tile.value == '') {
    minesLeft = 0
  }
  let closedTiles = 0
  for (let neighbour of neighbours(game.board, tile)) {
    if (neighbour.marked) {
      minesLeft -= 1
    } else if (!neighbour.open) {
      closedTiles += 1
    }
  }
  if (minesLeft === 0) {
    for (let neighbour of neighbours(game.board, tile)) {
      if (!neighbour.marked && !neighbour.open) {
        clickTile(game, neighbour, false)
        frontier.push(neighbour)
        for (let grandneighbour of neighbours(game.board, neighbour)) {
          frontier.push(grandneighbour)
        }
      }
    }
    return true
  } else if (minesLeft === closedTiles) {
    for (let neighbour of neighbours(game.board, tile)) {
      if (!neighbour.marked && !neighbour.open) {
        markTile(game, neighbour)
        for (let grandneighbour of neighbours(game.board, neighbour)) {
          frontier.push(grandneighbour)
        }
      }
    }
    return true
  }
  return false
}

// Slightly complex, this 
function getBinds(game, tile) {
  let minesLeft = parseInt(tile.value)
  let closedTiles = []
  for (let neighbour of neighbours(game.board, tile)) {
    if (neighbour.marked) {
      minesLeft -= 1
    } else if (!neighbour.open) {
      closedTiles.push(neighbour)
    }
  }
  let binds = []
  if (closedTiles.length > 1) {
    for (let neighbour of grandneighbours(game.board, tile)) {
      if (neighbour.open) {
        let bind = {}
        bind.self = tile
        bind.selfMines = minesLeft
        bind.selfTiles = [...closedTiles]
        bind.bind = neighbour
        bind.bindMines = parseInt(neighbour.value)
        bind.bindTiles = []
        bind.joint = []
        for (let grandneighbour of neighbours(game.board, neighbour)) {
          if (grandneighbour.marked) {
            bind.bindMines -= 1
          }
          if (!grandneighbour.open && !grandneighbour.marked) {
            if (closedTiles.indexOf(grandneighbour) === -1) {
              bind.bindTiles.push(grandneighbour)
            } else {
              bind.joint.push(grandneighbour)
              bind.selfTiles.splice(bind.selfTiles.indexOf(grandneighbour), 1);
            }
          }
        }
        if (bind.joint.length > 0) {
          binds.push(bind)
        }
      }
    }
  }
  return binds
}

function dominationSolver(game, tile, frontier) {
  let discovered = false
  for (let bind of getBinds(game, tile)) {
    if (bind.selfMines === bind.bindMines && bind.selfTiles === 0) {
      for (let neighbour of bind.bindTiles) {
        clickTile(game, neighbour, false)
        discovered = true
        frontier.push(neighbour)
        for (let grandneighbour of neighbours(game.board, neighbour)) {
          frontier.push(grandneighbour)
        }
      }
    }
  }
  return discovered
}

function avoidanceSolver(game, tile, frontier, depth) {
  let discovered = false
  for (let bind of getBinds(game, tile)) {
    if (bind.bindMines + bind.selfTiles.length === bind.selfMines) {
      for (let neighbour of bind.selfTiles) {
        if (!neighbour.marked) {
          markTile(game, neighbour, false)
        }
        discovered = true
        for (let grandneighbour of neighbours(game.board, neighbour)) {
          frontier.push(grandneighbour)
        }
      }
    }
    if (bind.selfMines + bind.bindTiles.length === bind.bindMines) {
      for (let neighbour of bind.bindTiles) {
        if (!neighbour.marked) {
          markTile(game, neighbour, false)
        }
        discovered = true
        for (let grandneighbour of neighbours(game.board, neighbour)) {
          frontier.push(grandneighbour)
        }
      }
    }
  }
  return discovered
}

function supplySolver(game, tile, frontier) {
  if (game.minesLeft === 0) {
    for (let tile of allTiles(game.board)) {
      if (!tile.marked && !tile.open) {
        clickTile(game, tile, false)
      }
    }
  }
  return true
}

class Frontier {
  constructor(board) {
    this.board = board
    this.frontier = []
    for (let tile of allTiles(board)) {
      if (this.frontierTile(board, tile)) {
        this.frontier.push(tile)
      }
    }
    this.frontierSet = new Set(this.frontier)
  }

  frontierTile(board, tile) {
    if (tile.open && tile.value in '123456789'.split('')) {
      let closedNeighbours = 0
      for (let neighbour of neighbours(board, tile)) {
        if (!neighbour.open && !neighbour.marked) {
          closedNeighbours += 1
        }
      }
      return closedNeighbours > 0
    }
    return false
  }

  push(tile) {
    if (!this.frontierSet.has(tile)) {
      this.frontier.push(tile)
      this.frontierSet.add(tile)
    }
  }

  pop() {
    let tile = this.frontier.pop()
    this.frontierSet.delete(tile)
    return tile
  }

  isEmpty() {
    return this.frontier.length === 0
  }

}

class MultiFrontier {
  constructor(board, functions) {
    this.board = board
    this.functions = functions
    this.frontiers = []
    for (let _ of functions) {
      this.frontiers.push(new Frontier(board))
    }
  }

  push(tile) {
    for (let frontier of this.frontiers) {
      frontier.push(tile)
    }
  }

  pop(frontier) {
    return this.frontiers[frontier].pop()
  }

  get(frontier) {
    return this.frontiers[frontier]
  }

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
  <button v-on:click="resetGame(mainGame, 9, 9, 10, smartSetupBeginner)" id="minesweeper-new-game-button">New Beginner Game</button>
  <button v-on:click="resetGame(mainGame, 16, 16, 40, smartSetupIntermediate)" id="minesweeper-new-game-button">New Intermediate Game</button>
  <button v-on:click="resetGame(mainGame, 30, 16, 99, setupBoard)" id="minesweeper-new-game-button">New Expert Game</button>
  <button v-on:click="runUnitTests(mainGame)" id="minesweeper-new-game-button">Autosolve (For Dev Use)</button>
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