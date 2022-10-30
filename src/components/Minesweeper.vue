<script setup>
import { reactive, toRaw } from 'vue'

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
  game.width = mini[0].length
  game.height = mini.length
  game.board = blankBoard(game.width, game.height)
  game.tilesLeft = game.width * game.height 
  game.markedTiles = 0
  let mineCount = 0
  for (let tile of allTiles(game.board)) {
    let miniTile = mini[tile.x][tile.y]
    if (miniTile === 'M' || miniTile === 'X') {
      tile.value = 'M'
      mineCount += 1
    }
    if (miniTile === 'X') {
      tile.marked = true
      game.markedTiles += 1
    }
    if (miniTile === 'O') {
      game.tilesLeft -= 1
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
  game.tilesLeft -= game.mines
  game.minesLeft = game.mines - game.markedTiles
}

//Create a mini from a gamr, for use in testing (and possibly other things?).
//Format for mini is an array of mines M, marked mines X, closed tiles C, and open tiles O.
function gameToMini(game) {
  let mini = Array(game.height).fill().map(() => Array(game.width).fill(0));
  for (let tile of allTiles(game.board)) {
    if (tile.value === 'M') {
      if (tile.marked === true) {
        mini[tile.x][tile.y] = 'X'
      } else {
        mini[tile.x][tile.y] = 'M'
      }
    } else {
      if (tile.open === true) {
        mini[tile.x][tile.y] = 'O'
      } else {
        mini[tile.x][tile.y] = 'C'
      }
    }
  }
  for (let i = 0; i < mini.length; i++) {
    mini[i] = mini[i].join('')
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
  while (weightedUsage <= 10) {
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
  // Test extra mine marking
  runUnitTest(game, solveGameBeginner, ["OCM", "CCM", "MMM"], ["OOX", "OOX", "XXX"])
  // Test closed board causes no issues
  runUnitTest(game, solveGameBeginner, ["CCC", "CCC", "CCC"], ["CCC", "CCC", "CCC"])
  // Test open board causes no issues
  runUnitTest(game, solveGameBeginner, ["OOO", "OOO", "OOO"], ["OOO", "OOO", "OOO"])
  // Test open space marking
  runUnitTest(game, solveGameBeginner, ["CCC", "COX", "CCC"], ["OOO", "OOX", "OOO"])
  // Test mine marking
  runUnitTest(game, solveGameBeginner, ["OOO", "OMO", "OMO"], ["OOO", "OXO", "OXO"])
  // Test unusual board
  runUnitTest(game, solveGameBeginner, ["CCC", "OXO", "OXO", "CCC", "CXC", "CXC"], ["OOO", "OXO", "OXO", "OOO", "OXO", "OXO"])
  // Tests with intermediate boards the beginner solver shouldn't solve
  runUnitTest(game, solveGameBeginner, ["CMC", "OOO", "OOO"], ["CMC", "OOO", "OOO"]) // dominance
  runUnitTest(game, solveGameBeginner, ["MCM", "CCC", "COC"], ["MCM", "OOO", "OOO"]) // avoidance
  runUnitTest(game, solveGameBeginner, ["OOO", "OMM", "OMC"], ["OOO", "OXX", "OXC"]) // supply
  runUnitTest(game, solveGameBeginner, ["CCMCMCC", "CCCCCCC", "MCCCOCM"], ["CCMCMCC", "COOOOOC", "MOOOOOM"]) // more avoidance

  // Same tests with the intermediate solver
  runUnitTest(game, solveGameIntermediate, ["CMC", "OOO", "OOO"], ["OXO", "OOO", "OOO"]) // dominance
  runUnitTest(game, solveGameIntermediate, ["MCM", "CCC", "COC"], ["XOX", "OOO", "OOO"]) // avoidance
  runUnitTest(game, solveGameIntermediate, ["OOO", "OMM", "OMC"], ["OOO", "OXX", "OXO"]) // supply
  runUnitTest(game, solveGameIntermediate, ["CCMCMCC", "CCCCCCC", "MCCCOCM"], ["OOXOXOO", "OOOOOOO", "XOOOOOX"]) // more avoidance

  // Tests that shouldn't be possible at intermediate level
  runUnitTest(game, solveGameIntermediate, ["CMC", "MCC", "CCO"], ["CMC", "MOO", "COO"]) // double bind
  runUnitTest(game, solveGameIntermediate, ["MMCC", "MOOX", "COXX", "CXXX"], ["MMCC", "MOOX", "COXX", "CXXX"]) // double bind

  // Same tests with expert solver
  runUnitTest(game, solveGameExpert, ["CMC", "MCC", "CCO"], ["OXO", "XOO", "OOO"]) // double bind
  runUnitTest(game, solveGameExpert, ["MMCC", "MOOX", "COXX", "CXXX"], ["XXOO", "XOOX", "OOXX", "OXXX"]) // double bind

  runUnitTest(game, solveGameExpert, ["OCM", "CCM", "CMC", "CCC"], ["OOX", "OOX", "OXO", "OOO"])
  runUnitTest(game, solveGameExpert, ["OCM", "CCC", "MCC", "MMC"], ["OOX", "OOO", "XOO", "XMC"])
  runUnitTest(game, solveGameExpert, ["OCM", "CCC", "CCM", "MMM"], ["OOX", "OOO", "OOX", "XXX"])

  // weird triple bind board overlap nightmare
  //runUnitTest(game, solveGameExpert, ["OCCMM", "CCCCM", "MCMCC", "MCCCC"], ["OOX", "OOO", "OOX", "XXX"])
  // weird double overlap board thing
  //runUnitTest(game, solveGameExpert, ["OCCMM", "CCCMM", "MCMCC", "MCCCC"], ["OOX", "OOO", "OOX", "XXX"])
  // another board triple
  //runUnitTest(game, solveGameExpert, ["OCCMM", "CCCCM", "MCCCC", "CMCCC"], ["OOX", "OOO", "OOX", "XXX"])
  // board d-overlap
  //runUnitTest(game, solveGameExpert, ["OCCMM", "CCCMM", "MCCCC", "CMCCC"], ["OOX", "OOO", "OOX", "XXX"])
  // different type of board t-overlap
  //runUnitTest(game, solveGameExpert, ["OCCMM", "CCCCM", "MMCCC", "CMCCC"], ["OOX", "OOO", "OOX", "XXX"])
  // regular double bind with overlap?
  //runUnitTest(game, solveGameExpert, ["OCMCC", "CCCCM", "CCCCM", "MMMCC"], ["OOX", "OOO", "OOX", "XXX"])

  //let testGame = {}
  //runAllTests(testGame, solveGameExpert, 5, 4, 0, 0)
}

// Run a single unit test to make sure the various solvers work as intended
function runUnitTest(game, solver, start, end) {
  miniToGame(start, game)
  solver(game)
  let test = gameToMini(game)
  if (end.toString() !== test.toString()) {
    console.log("Test " + start + " failed with " + test + " instead of expected " + end)
  }
}

// Generate all minis for a board size and initial click position.
function allMinis(width, height, clickX, clickY) {
  let minis = []
  let testMini = Array(height).fill().map(() => Array(width).fill(0));
  for (let i = 0; i < height; i += 1) {
    for (let j = 0; j < width; j += 1) {
      testMini[i][j] = width * i + j
    }
  }
  let spares = neighbours(testMini, {x: clickX, y: clickY})
  spares.push(width * clickY + clickX)
  let freeTiles = width * height - spares.length
  for (let i = 0; i < 2 ** freeTiles; i += 1) {
    let binary = i.toString(2)
      .padStart(freeTiles, '0')
      .replaceAll('0', 'C')
      .replaceAll('1', 'M')
      .split('');
    let result = ''
    for (let j = 0; j < width * height; j += 1) {
      if (spares.includes(j)) {
        result += 'C'
      } else {
        result += binary.pop()
      }
    }
    let mini = []
    for (let j = 0; j < height; j += 1) {
      mini.push(result.slice(j * width, (j + 1) * width))
    }
    minis.push(mini)
  }
  return minis
}

// Run all unit tests on a specific board size to check if a solver is flawless for that board size
function runAllTests(game, solver, width, height, clickX, clickY) {
  let count = 0
  let badMinis = []
  for (let mini of allMinis(width, height, clickX, clickY)) {
    count += 1
    if (count % 1000 === 0) {
      console.log(count)
    }
    miniToGame(mini, game)
    clickTile(game, game.board[clickX][clickY])
    solver(game)
    if (game.state === 'lost') {
      console.log("EPIC FAIL")
      console.log(mini)
    }
    if (game.state === 'playing') {
      if (gameProgressIsPossible(game)) {
        if (!miniIdenticalToOpenMini(gameToMini(game).join('').replaceAll('M', '.').replaceAll('C', '.'), badMinis)) {
          console.log("possible")
          console.log(mini)
          badMinis.push(gameToMini(game).join('').replaceAll('M', '.').replaceAll('C', '.'))
        }
      }
    }
  }
}

function miniIdenticalToOpenMini(mini, badMinis) {
  for (let badMini of badMinis) {
    if (mini === badMini) {
      return true
    }
  }
  return false
}

// Checks if a game state could have been progressed with better play.
function gameProgressIsPossible(game) {
  const micro = gameToMicro(game)
  const hiddenTiles = (micro.match(/\*/g) || []).length
  const possibilites = microPossibilities(micro, hiddenTiles, game.minesLeft, game.width)
  let truth = possibilites[0]
  for (const possibility of possibilites) {
    for (let i = 0; i < possibility.length; i++) {
      if (possibility[i] !== truth[i]) {
        truth = truth.substring(0, i) + '?' + truth.substring(i + 1)
      }
    }
  }
  return truth.includes('M') || truth.includes('C')
}

function gameToMicro(game) {
  let micro = ''
  for (let tile of allTiles(game.board)) {
    if (tile.value === 'M') {
      if (tile.marked === true) {
        micro +='X'
      } else {
        micro += 'C'
      }
    } else {
      if (tile.open === true) {
        if (tile.value === '') {
          micro += '0'
        } else {
          micro += tile.value
        }
      } else {
        let frontier = false
        for (let neighbour of neighbours(game.board, tile)) {
          if (neighbour.open) {
            frontier = true
          }
        }
        if (frontier) {
          micro += 'C'
        } else {
          micro += '*'
        }
      }
    }
  }
  return micro
}

function microPossibilities(micro, hiddenTiles, minesLeft, width) {
  let minC = micro.indexOf('C')
  if (minC === -1) {
    return [micro]
  } else if (minesLeft === 0) {
    micro = micro.replaceAll('C', '.')
    if (validMicro(micro, width)) {
      return [micro]
    } else {
      return []
    }
  } else if (minesLeft === (micro.match(/C/g)||[]).length + hiddenTiles) {
    micro = micro.replaceAll('C', 'M')
    if (validMicro(micro, width)) {
      return [micro]
    } else {
      return []
    }
  } else {
    let result = []
    let a = micro.replace('C', '.')
    let b = micro.replace('C', 'M')
    if (validMicro(a, width)) {
      result = result.concat(microPossibilities(a, hiddenTiles, minesLeft, width))
    }
    if (validMicro(b, width)) {
      result = result.concat(microPossibilities(b, hiddenTiles, minesLeft - 1, width))
    }
    return result
  }
}

function validMicro(micro, width) {
  for (let i = 0; i < micro.length; i += 1) {
    if (micro[i] in '012345678'.split('')) {
      let minMines = 0
      let maxMines = 0
      for (let neighbour of microNeighbours(micro, i, width)) {
        if (neighbour === 'X' || neighbour === 'M') {
          minMines += 1
          maxMines += 1
        }
        if (neighbour === 'C') {
          maxMines += 1
        }
      }
      if (parseInt(micro[i]) > maxMines || parseInt(micro[i]) < minMines) {
        return false
      }
    }
  }
  return true
}

function microNeighbours(micro, tile, width) {
  let result = []
  let shifts = [-width, width]
  if (tile % width !== 0) {
    shifts = shifts.concat([-width - 1, -1, width - 1])
  }
  if (tile % width !== width - 1) {
    shifts = shifts.concat([-width + 1, 1, width + 1])
  }
  for (let shift of shifts) {
    if (micro[tile + shift] !== undefined) {
      result.push(micro[tile + shift])
    }
  }
  return result
}

function runSolverTests(game) {
  let count = 10000
  //6536 1764 625 1075 beginner
  //2441 3541 934 3084 intermediate
  //6 934 453 8607 expert
  let beginner = 0
  let intermediate = 0
  let expert = 0
  let superExpert = 0
  let testGame = {} 
  for (let i = 0; i < count; i++) {
    resetGame(testGame, 30, 16, 99, setupBoard)
    clickTile(testGame, testGame.board[4][4])
    solveGameBeginner(testGame)
    if (testGame.state === 'playing') {
      solveGameIntermediate(testGame)
      if (testGame.state === 'playing') {
        solveGameExpert(testGame)
        if (testGame.state === 'playing') {
          superExpert += 1
        } else {
          expert += 1
        }
      } else {
        intermediate += 1
      }
    } else {
      beginner += 1
    }
  }
  resetGame(game, 30, 16, 99, setupBoard)
  game.board = testGame.board
  game.tilesLeft = testGame.tilesLeft
  game.markedTiles = testGame.markedTiles
  game.minesLeft = testGame.minesLeft
  game.state = testGame.state
  console.log(beginner, intermediate, expert, superExpert)
}

//Solve a game board with beginner strategies.
const solveGameBeginner = solveGameCustom([trivialSolver])

//Solve a game board with intermediate strategies.
const solveGameIntermediate = solveGameCustom([trivialSolver, dominationSolver, avoidanceSolver, supplySolver])

//Solve a game board with expert strategies.
const solveGameExpert = solveGameCustom([trivialSolver, dominationSolver, avoidanceSolver, 
  supplySolver, doubleBindSolver, bindSupplySolver, doubleBindSupplySolver])

//Solve a game board with custom strategies, in order based on the function list.
function solveGameCustom(functions) {
  return (game, cycleTracker=[0]) => {
    let frontiers = new MultiFrontier(game.board, functions)
    let frontier = 0
    let usageTracker = [0, 0, 0, 0]
    while (frontier < functions.length) {
      while (!frontiers.get(frontier).isEmpty()) {
        if (cycleTracker[cycleTracker.length - 1] >= 10000) {
          console.log('Out of cycles')
          return
        }
        cycleTracker[cycleTracker.length - 1] += 1
        if (functions[frontier](game, frontiers, frontiers.pop(frontier))) {
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
}

// Solves a specific tile of a minesweeper game with trivial methods.
// Specifically, if a tile has no mines left to mark around it, open all other tiles next to it,
// and if a tile has n closed tiles around it and n mines left, mark all those squares.
function trivialSolver(game, frontier, tile) {
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

// Get all binds for a game given that game and a tile.
// A bind is a pair of tiles which share some neighbours.
// Binds have the following information
// self (tile given)
// bind (tile bound with given tile)
// selfMines, bindMines, the number of mines left for each
// selfTiles, bindTiles, the tiles that are not part of the binding
// joint, the tiles that are
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

// Get all double binds for a game given that game and a tile.
// A double bind is a tile which has two bindings with no overlap in joint.
function getDoubleBinds(game, tile) {
  let doubleBinds = []
  let binds = getBinds(game, tile)
  for (let i = 0; i < binds.length; i++) {
    for (let j = 0; j < i; j++) {
      let fullArray = binds[i].joint.concat(binds[j].joint, binds[i].bindTiles, binds[j].bindTiles)
      let seen = new Set();
      const hasDuplicates = fullArray.some(function(currentObject) {
        return seen.size === seen.add(currentObject).size;
      });
      if (!hasDuplicates) {
        let doubleBind = {}
        doubleBind.self = tile
        doubleBind.selfMines = binds[i].selfMines
        // Interesection of binds[i].selfTiles and binds[j].selfTiles
        doubleBind.selfTiles = binds[i].selfTiles.filter(value => binds[j].selfTiles.includes(value));
        doubleBind.a = binds[i].bind
        doubleBind.aMines = binds[i].bindMines
        doubleBind.aTiles = binds[i].bindTiles
        doubleBind.aJoint = binds[i].joint
        doubleBind.b = binds[j].bind
        doubleBind.bMines = binds[j].bindMines
        doubleBind.bTiles = binds[j].bindTiles
        doubleBind.bJoint = binds[j].joint
        doubleBinds.push(doubleBind)
      }
    }
  }
  return doubleBinds
}

function getBoardBinds(game) {
  let binds = []
  let closedTiles = []
  for (let tile of allTiles(game.board)) {
    if (!tile.open && !tile.marked) {
      closedTiles.push(tile)
    }
  }
  for (let tile of allTiles(game.board)) {
    if (tile.value !== '' &&  tile.value !== 'M' && !tile.marked && tile.open) {
      let bind = {}
      bind.selfTiles = [...closedTiles]
      bind.bind = tile
      bind.bindMines = parseInt(tile.value)
      bind.joint = []
      for (let neighbour of neighbours(game.board, tile)) {
        if (neighbour.marked) {
          bind.bindMines -= 1
        }
        if (!neighbour.open && !neighbour.marked) {
          bind.joint.push(neighbour)
          bind.selfTiles.splice(bind.selfTiles.indexOf(neighbour), 1);
        }
      }
      if (bind.joint.length > 0) {
        binds.push(bind)
      }
    }
  }
  return binds
}

function dominationSolver(game, frontier, tile) {
  let discovered = false
  for (let bind of getBinds(game, tile)) {
    if (bind.selfMines === bind.bindMines && bind.selfTiles.length === 0) {
      clickAllAndPushToFrontier(game, bind.bindTiles, frontier)
      discovered = discovered || bind.bindTiles.length > 0
    }
  }
  return discovered
}

function avoidanceSolver(game, frontier, tile) {
  let discovered = false
  for (let bind of getBinds(game, tile)) {
    if (bind.bindMines + bind.selfTiles.length === bind.selfMines) {
      markAllAndPushToFrontier(game, bind.selfTiles, frontier)
      discovered = discovered || bind.selfTiles.length > 0
    }
    if (bind.selfMines + bind.bindTiles.length === bind.bindMines) {
      markAllAndPushToFrontier(game, bind.bindTiles, frontier)
      discovered = discovered || bind.bindTiles.length > 0
    }
  }
  return discovered
}

function supplySolver(game, frontier) {
  if (game.minesLeft === 0) {
    for (let tile of allTiles(game.board)) {
      if (!tile.marked && !tile.open) {
        clickTile(game, tile, false)
      }
    }
  }
  return true
}

function doubleBindSolver(game, frontier, tile) {
  let discovered = false
  for (let bind of getDoubleBinds(game, tile)) {
    if (bind.aMines + bind.bMines + bind.selfTiles.length === bind.selfMines) {
      clickAllAndPushToFrontier(game, bind.aTiles, frontier)
      clickAllAndPushToFrontier(game, bind.bTiles, frontier)
      markAllAndPushToFrontier(game, bind.selfTiles, frontier)
      discovered = discovered || bind.aTiles.length > 0 || bind.bTiles.length > 0 || bind.selfTiles.length > 0
    }
    if (bind.aMines - bind.aTiles.length + bind.bMines - bind.bTiles.length === bind.selfMines) {
      markAllAndPushToFrontier(game, bind.aTiles, frontier)
      markAllAndPushToFrontier(game, bind.bTiles, frontier)
      clickAllAndPushToFrontier(game, bind.selfTiles, frontier)
      discovered = discovered || bind.aTiles.length > 0 || bind.bTiles.length > 0 || bind.selfTiles.length > 0
    }
  }
  return discovered
}

function bindSupplySolver(game, frontier) {
  let binds = getBoardBinds(game)
  for (let bind of binds) {
    if (bind.bindMines === game.minesLeft) {
      clickAllAndPushToFrontier(game, bind.selfTiles, frontier)
      if (bind.selfTiles.length > 0) {
        return true
      }
    }
    if (bind.selfTiles.length + bind.bindMines === game.minesLeft) {
      markAllAndPushToFrontier(game, bind.selfTiles, frontier)
      if (bind.selfTiles.length > 0) {
        return true
      }
    }
  }
  return false
}

function doubleBindSupplySolver(game, frontier) {
  let doubleBinds = []
  let binds = getBoardBinds(game)
  for (let i = 0; i < binds.length; i++) {
    for (let j = 0; j < i; j++) {
      let fullArray = binds[i].joint.concat(binds[j].joint)
      let seen = new Set();
      const hasDuplicates = fullArray.some(function(currentObject) {
        return seen.size === seen.add(currentObject).size;
      });
      if (!hasDuplicates) {
        let doubleBind = {}
        doubleBind.selfTiles = binds[i].selfTiles.filter(value => binds[j].selfTiles.includes(value));
        doubleBind.a = binds[i].bind
        doubleBind.aMines = binds[i].bindMines
        doubleBind.aJoint = binds[i].joint
        doubleBind.b = binds[j].bind
        doubleBind.bMines = binds[j].bindMines
        doubleBind.bJoint = binds[j].joint
        doubleBinds.push(doubleBind)
      }
    }
  }
  for (let bind of doubleBinds) {
    if (bind.bMines + bind.aMines === game.minesLeft) {
      clickAllAndPushToFrontier(game, bind.selfTiles, frontier)
      if (bind.selfTiles.length > 0) {
        return true
      }
    }
    if (bind.selfTiles.length + bind.aMines + bind.bMines === game.minesLeft) {
      markAllAndPushToFrontier(game, bind.selfTiles, frontier)
      if (bind.selfTiles.length > 0) {
        return true
      }
    }
  }
}

function clickAllAndPushToFrontier(game, tiles, frontier) {
  for (let tile of tiles) {
    clickTile(game, tile, false)
    frontier.push(tile)
    for (let neighbour of neighbours(game.board, tile)) {
      frontier.push(neighbour)
    }
  }
}

function markAllAndPushToFrontier(game, tiles, frontier) {
  for (let tile of tiles) {
    if (!tile.marked) {
      markTile(game, tile, false)
    }
    for (let neighbour of neighbours(game.board, tile)) {
      frontier.push(neighbour)
    }
  }
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
    if (tile.open) {
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
      if (this.frontierTile(this.board, tile)) {
        this.frontier.push(tile)
        this.frontierSet.add(tile)
      }
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

class SingleFrontier {
  constructor(board) {
    this.board = board
    this.active = true
  }

  push() {
    this.active = true
  }

  pop() {
    this.active = false
  }

  isEmpty() {
    return !this.active
  }

}


class MultiFrontier {
  constructor(board, functions) {
    this.board = board
    this.functions = functions
    this.frontiers = []
    for (let f of functions) {
      if (f.length === 2) {
        this.frontiers.push(new SingleFrontier(board))
      } else {
        this.frontiers.push(new Frontier(board))
      }
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
  <button v-on:click="runUnitTests(mainGame)" id="minesweeper-new-game-button">Tests (For Dev Use)</button>
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