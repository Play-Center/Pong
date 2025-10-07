import { BASE_W, BASE_H } from "./constants.js";

/** @type {HTMLCanvasElement} */
/**
 * Game canvas element.
 */
export const c = document.getElementById("game");
/** @type {CanvasRenderingContext2D} */
/**
 * 2D rendering context for the game canvas.
 * @type {CanvasRenderingContext2D}
 */
export const g = c.getContext("2d", { alpha: false });

/** Current canvas width in CSS pixels. */
export let W = window.innerWidth;
/** Current canvas height in CSS pixels. */
export let H = window.innerHeight;
/** Responsive scale factor derived from BASE_W/BASE_H and viewport. */
export let scale = 1;

/**
 * Recompute canvas dimensions and responsive scale.
 * Sets `W`, `H`, `scale`, and resizes the canvas.
 */
export function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  c.width = W;
  c.height = H;
  scale = Math.min(W / BASE_W, H / BASE_H);
}

resize();
window.addEventListener("resize", resize);
