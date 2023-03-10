<script setup>
import { onMounted } from 'vue';

const colors = ["#eed", "#d2d", "#f22", "#dd2", "#2f2", "#2dd", "#22f"];
let boardSize;
let hexSize;
let hexGlue;
let ctx;

const exampleBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 4, 4, 4, 4, 0, 0, 0, 3, 0, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

onMounted(() => {
  const chromatica = document.getElementById("chromatica");
  ctx = chromatica.getContext("2d");
  setBoardSize();
  drawChromatica(exampleBoard);
})

window.onresize = () => {
  console.log('resize!')
  setBoardSize();
  drawChromatica(exampleBoard);
}

function setBoardSize() {
  boardSize = Math.min(window.innerWidth, window.innerHeight - 104);
  hexSize = boardSize / 18;
  hexGlue = hexSize * 0.95;
}
function drawChromatica(gameState) {
  console.log(gameState)
  ctx.canvas.width  = boardSize;
  ctx.canvas.height = boardSize;
  ctx.beginPath();
  ctx.rect(0, 0, boardSize, boardSize);
  ctx.fill();

  drawBoard(gameState);
}

function drawBoard(gameState) {
  for (let i = -4; i <= 4; i += 1) {
    for (let j = -4; j <= 4; j += 1) { 
      let k = -i - j;
      if (Math.abs(i) + Math.abs(j) + Math.abs(k) < 8 || (Math.abs(i) + Math.abs(j) + Math.abs(k) === 8 && i && j && k)) {
        const x = boardSize / 2 + (j - k) * hexGlue * Math.sqrt((3 + 2 * Math.SQRT2) / 6);
        const y = boardSize / 2 + i * hexGlue * (1 + Math.SQRT1_2)
        const boardInfo = gameState[i + 4 + 9 * (j + 4)]
        drawHex(hexSize, x, y, colors[boardInfo]);
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