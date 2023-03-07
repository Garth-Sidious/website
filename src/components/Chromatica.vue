<script setup>
import { onMounted } from 'vue';

const boardSize = 750;
const hexSize = boardSize / 18
const hexGlue = hexSize * 0.95
let ctx;

onMounted(() => {
  const chromatica = document.getElementById("chromatica");
  ctx = chromatica.getContext("2d");
  ctx.beginPath();
  ctx.rect(0, 0, boardSize, boardSize);
  ctx.fill();

  // Draw board
  drawBoard();

})

function drawBoard() {
  for (let i = -4; i <= 4; i += 1) {
    for (let j = -4; j <= 4; j += 1) { 
      let k = -i - j;
      if (Math.abs(i) + Math.abs(j) + Math.abs(k) < 8 || (Math.abs(i) + Math.abs(j) + Math.abs(k) === 8 && i && j && k)) {
        let x = boardSize / 2 + (j - k) * hexGlue;
        let y = boardSize / 2 + i * hexGlue * (1 + Math.SQRT1_2)
        drawHex(hexSize, x, y, "#eed");
      }
    }
  }
  drawHex(hexSize / 4, boardSize / 2, boardSize / 2, "#000");
  let bonusSize =  2 * (hexGlue / Math.cos(Math.PI / 6) - hexSize);
  let baseSize = hexGlue * 4 * (1 + Math.SQRT1_2) + hexSize + bonusSize;
  drawHomeBase(hexSize, boardSize / 2 + baseSize * Math.cos(1 * Math.PI / 6), boardSize / 2 + baseSize * Math.sin(1 * Math.PI / 6), 10, "#d2d");
  drawHomeBase(hexSize, boardSize / 2 + baseSize * Math.cos(3 * Math.PI / 6), boardSize / 2 + baseSize * Math.sin(3 * Math.PI / 6), 0, "#f22");
  drawHomeBase(hexSize, boardSize / 2 + baseSize * Math.cos(5 * Math.PI / 6), boardSize / 2 + baseSize * Math.sin(5 * Math.PI / 6), 2, "#dd2");
  drawHomeBase(hexSize, boardSize / 2 + baseSize * Math.cos(7 * Math.PI / 6), boardSize / 2 + baseSize * Math.sin(7 * Math.PI / 6), 4, "#2f2");
  drawHomeBase(hexSize, boardSize / 2 + baseSize * Math.cos(9 * Math.PI / 6), boardSize / 2 + baseSize * Math.sin(9 * Math.PI / 6), 6, "#2dd");
  drawHomeBase(hexSize, boardSize / 2 + baseSize * Math.cos(11 * Math.PI / 6), boardSize / 2 + baseSize * Math.sin(11 * Math.PI / 6), 8, "#22f");
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

function drawHomeBase(size, x, y, rotation, color) {
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

</script>

<template>
  <canvas id="chromatica" :width="boardSize" :height="boardSize"></canvas>
</template>

<style scoped>
#chromatica {
  margin-top: 1rem;
}
</style>