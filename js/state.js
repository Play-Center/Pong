import { BASE_W, BASE_H } from "./constants.js";

export const c = document.getElementById("game");
export const g = c.getContext("2d", { alpha: false });

export let W = window.innerWidth;
export let H = window.innerHeight;
export let scale = 1;

export function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  c.width = W;
  c.height = H;
  scale = Math.min(W / BASE_W, H / BASE_H);
}

resize();
window.addEventListener("resize", resize);
