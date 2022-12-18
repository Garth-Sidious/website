<script setup>
import { onMounted } from 'vue';

const CHANGE_SIZE = 100;
let width = 800;
let height = 500;

onMounted(() => {
  const screensaver = document.getElementById("screensaver");
  const ctx = screensaver.getContext("2d");
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.fill();

  screensaverLoop(ctx)
})

function screensaverLoop(ctx) {
  for (let cycles = 0; cycles < 8; cycles++) {
    const dx = Math.floor(Math.random() * (width + CHANGE_SIZE)) - CHANGE_SIZE;
    const dy = Math.floor(Math.random() * (height + CHANGE_SIZE)) - CHANGE_SIZE;
    const color = Math.floor(Math.random() * 3);
    const snap = ctx.getImageData(dx, dy, CHANGE_SIZE, CHANGE_SIZE);
    for (let i = 0; i < snap.data.length; i += 4) {
      if (snap.data[i] === 255 && snap.data[i + 1] === 255 && snap.data[i + 2] === 255) {
        snap.data[i] = 0;
        snap.data[i + 1] = 0;
        snap.data[i + 2] = 0;
      } else {
        snap.data[i + color] += 8;
      }
    }
    ctx.putImageData(snap, dx, dy);
  }
  setTimeout(() => screensaverLoop(ctx), 10);
}

</script>

<template>
  <canvas id="screensaver" :width="width" :height="height"></canvas>
</template>
