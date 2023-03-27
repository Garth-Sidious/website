<script setup>
import { onMounted } from 'vue';

const colors = ["#eed", "#d2d", "#f22", "#dd2", "#2d2", "#2dd", "#22f"];
const highlightColors = ["#bb9", "#808", "#900", "#770", "#090", "#077", "#00b"];
let boardSize;
let hexSize;
let hexGlue;
let ctx;

const exampleBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 4, 4, 0, 0, 0, 3, 0, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0]
let clickPos = null

const Turns = {
  Primary: 0,
  Secondary: 1
}
let turn = Turns.Primary

function array_includes(array, item) {
  outer: for (const check of array) {
    for (var i = 0; i < check.length; i++) {
      if (check[i] !== item[i]) continue outer
    }
    return true
  }
  return false
}

function canMove(i, j, k, clickPos, board) {
  // can move if:
  // diff from click is equal in two
  // diff is less than 4
  // no blocking cell
  // no cell (unless capturable)
  // not glued (unless moving away)
  return false
}

const RED_BASE = [[4, -3], [4, -2], [4, -1]]
const GREEN_BASE = [[-3, -1], [-2, -2], [-1, -3]]
const BLUE_BASE = [[-3, 4], [-2, 4], [-1, 4]]
const YELLOW_BASE = [[1, -4], [2, -4], [3, -4]]
const CYAN_BASE = [[-4, 1], [-4, 2], [-4, 3]]
const MAGENTA_BASE = [[1, 3], [2, 2], [3, 1]]
const PRIMARY_BASES = [...RED_BASE, ...GREEN_BASE, ...BLUE_BASE]
const SECONDARY_BASES = [...YELLOW_BASE, ...CYAN_BASE, ...MAGENTA_BASE]
const ALL_BASES = [MAGENTA_BASE, RED_BASE, YELLOW_BASE, GREEN_BASE, CYAN_BASE, BLUE_BASE]
function canSpawn(i, j, turn, board) {
  if (board[i + 4 + 9 * (j + 4)] !== 0) return false
  if (turn === Turns.Primary && array_includes(PRIMARY_BASES, [i, j]) ||
      turn === Turns.Secondary && array_includes(SECONDARY_BASES, [i, j])) {
    let base = null
    for (let n = 0; i < ALL_BASES.length; n++) {
      if (array_includes(ALL_BASES[n], [i, j])) {
        base = n + 1
        break
      }
    }
    return (board.filter(x => x === base).length < 3)
  }
  return false
}

function spawnColor(i, j) {
  for (let n = 0; i < ALL_BASES.length; n++) {
    if (array_includes(ALL_BASES[n], [i, j])) {
      return colors[n + 1]
    }
  }
  return "#000" // should never happen
}

function setHighlight(canvas, gameState, event) {
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left)
    const y = (event.clientY - rect.top)
    for (let i = -4; i <= 4; i += 1) {
      for (let j = -4; j <= 4; j += 1) { 
        let k = -i - j;
        if (Math.abs(i) + Math.abs(j) + Math.abs(k) < 8 || (Math.abs(i) + Math.abs(j) + Math.abs(k) === 8 && i && j && k)) {
          const sizejk = boardSize / 2 + (j - k) * hexGlue * Math.sqrt((3 + 2 * Math.SQRT2) / 6) 
          const djk = Math.abs(sizejk - x);
          const sizeij = boardSize / 2 + (j - i) * hexGlue * Math.sqrt((3 + 2 * Math.SQRT2) / 6) 
          const xprime = (x - boardSize / 2) * Math.cos(Math.PI / 3) - (y  - boardSize / 2) * Math.sin(Math.PI / 3) + boardSize / 2
          const dij = Math.abs(sizeij - xprime);
          const sizeik = boardSize / 2 + (i - k) * hexGlue * Math.sqrt((3 + 2 * Math.SQRT2) / 6) 
          const xprime2 = (x - boardSize / 2) * Math.cos(-Math.PI / 3) - (y  - boardSize / 2) * Math.sin(-Math.PI / 3) + boardSize / 2
          const dik = Math.abs(sizeik - xprime2);
          const hsize = hexSize * Math.sqrt(3) / 2
          if (djk < hsize && dij < hsize && dik < hsize && gameState[i + 4 + 9 * (j + 4)]) {
            clickPos = [i, j, k]
            drawChromatica(exampleBoard)
            return
          }
        }
      }
    }
    clickPos = null
    drawChromatica(exampleBoard);
}

onMounted(() => {
  const chromatica = document.getElementById("chromatica");
  ctx = chromatica.getContext("2d");
  setBoardSize();
  chromatica.addEventListener('mousedown', function(e) {
    setHighlight(chromatica, exampleBoard, e)
  })
  drawChromatica(exampleBoard);
})

window.onresize = () => {
  setBoardSize();
  drawChromatica(exampleBoard);
}

function setBoardSize() {
  boardSize = Math.min(window.innerWidth, window.innerHeight - 104);
  hexSize = boardSize / 18;
  hexGlue = hexSize * 0.95;
}
function drawChromatica(board) {
  ctx.canvas.width  = boardSize;
  ctx.canvas.height = boardSize;
  ctx.beginPath();
  ctx.rect(0, 0, boardSize, boardSize);
  ctx.fill();

  drawBoard(board);
}

function drawBoard(board) {
  for (let i = -4; i <= 4; i += 1) {
    for (let j = -4; j <= 4; j += 1) { 
      let k = -i - j;
      if (Math.abs(i) + Math.abs(j) + Math.abs(k) < 8 || (Math.abs(i) + Math.abs(j) + Math.abs(k) === 8 && i && j && k)) {
        const x = boardSize / 2 + (j - k) * hexGlue * Math.sqrt((3 + 2 * Math.SQRT2) / 6);
        const y = boardSize / 2 + i * hexGlue * (1 + Math.SQRT1_2)
        const boardInfo = board[i + 4 + 9 * (j + 4)]
        if (clickPos && clickPos[0] === i && clickPos[1] === j && clickPos[2] === k) {
          drawHex(hexSize, x, y, highlightColors[boardInfo]);
          drawHex(hexSize * 0.8, x, y, colors[boardInfo]);
        } else {
          drawHex(hexSize, x, y, colors[boardInfo]);
        }
        if (canMove(i, j, k, clickPos, board)) {
          drawHex(hexSize * 0.2, x, y, "#666");
        } else if (canSpawn(i, j, turn, board)) {
          drawHex(hexSize * 0.3, x, y, spawnColor(i, j));
        }
      }
    }
  }
  drawHex(hexSize / 4, boardSize / 2, boardSize / 2, "#000");
  let bonusSize =  2 * (hexGlue / Math.cos(Math.PI / 6) - hexSize);
  let baseSize = hexGlue * 4 * (1 + Math.SQRT1_2) + hexSize + bonusSize;
  for (let i = 0; i < 6; i++) {
    let x = boardSize / 2 + baseSize * Math.cos((1 + 2 * i) * Math.PI / 6);
    let y = boardSize / 2 + baseSize * Math.sin((1 + 2 * i) * Math.PI / 6);
    drawHomeBase(x, y, -2 + 2 * i, colors[i + 1]);
  }
  for (let i = 0; i < 6; i++) {
    let x = boardSize / 2 + 7.7 * hexGlue * Math.cos((2 * i) * Math.PI / 6);
    let y = boardSize / 2 + 7.7 * hexGlue * Math.sin((2 * i) * Math.PI / 6);
    drawArrow(x, y, 2 * i, colors[0]);
  }
}

function drawHex(size, x, y, color) {
  ctx.beginPath();
  ctx.moveTo(x + size * Math.cos(1 * Math.PI / 6), y + size * Math.sin(1 * Math.PI / 6));          

  for (let i = 1.5; i <= 6.5; i += 1) {
    ctx.lineTo(x + size * Math.cos(i * 2 * Math.PI / 6), y + size * Math.sin(i * 2 * Math.PI / 6));
  }

  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.fill();
}

function drawText(size, x, y, text) {
  ctx.moveTo(x + size * Math.cos(1 * Math.PI / 6), y + size * Math.sin(1 * Math.PI / 6));          
  ctx.font = "20px Arial";
  ctx.fillStyle = "#000";
  ctx.fillText(text, x, y); 
}


function drawHomeBase(x, y, rotation, color) {
  let bonusSize =  2 * (hexGlue / Math.cos(Math.PI / 6) - hexSize);
  let trickySize = bonusSize * Math.sin(Math.PI / 6) + hexSize;
  let finalSize = trickySize * Math.cos(Math.PI / 6) * 2;

  ctx.beginPath();
  ctx.moveTo(x, y);  
  ctx.lineTo(x + trickySize * Math.cos((11 + rotation) * Math.PI / 6), y + trickySize * Math.sin((11 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + finalSize * Math.cos((0 + rotation) * Math.PI / 6), y + finalSize * Math.sin((0 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + trickySize * Math.cos((3 + rotation) * Math.PI / 6), y + trickySize * Math.sin((3 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + finalSize * Math.cos((6 + rotation) * Math.PI / 6), y + finalSize * Math.sin((6 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + trickySize * Math.cos((7 + rotation) * Math.PI / 6), y + trickySize * Math.sin((7 + rotation) * Math.PI / 6));  

  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.fill();
}

function drawArrow(x, y, rotation, color) {
  let size = hexSize / 4;

  ctx.beginPath();
  ctx.moveTo(x + size * Math.cos((0 + rotation) * Math.PI / 6), y + size * Math.sin((0 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + size * Math.cos((2 + rotation) * Math.PI / 6), y + size * Math.sin((2 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + size * Math.cos((4 + rotation) * Math.PI / 6), y + size * Math.sin((4 + rotation) * Math.PI / 6));  
  ctx.lineTo(x + size * Math.cos((6 + rotation) * Math.PI / 6), y + size * Math.sin((6 + rotation) * Math.PI / 6)); 
  ctx.lineTo(x + size * 2 * Math.cos(Math.PI / 6) * Math.cos((9 + rotation) * Math.PI / 6), y + size * 2 * Math.cos(Math.PI / 6) * Math.sin((9 + rotation) * Math.PI / 6));  

  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.fill();
}

</script>

<template>
  <canvas id="chromatica" :width="boardSize" :height="boardSize"></canvas>
</template>

<style scoped>
#chromatica {
  margin-top: 1rem;
}
</style>