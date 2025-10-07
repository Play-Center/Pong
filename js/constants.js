/**
 * Global design-space width used to compute responsive scale.
 * @type {number}
 */
export const BASE_W = 800;
/**
 * Global design-space height used to compute responsive scale.
 * @type {number}
 */
export const BASE_H = 480;

/**
 * Common color palette.
 * @typedef {{WHITE:string, BLACK:string}} Colors
 * @type {Colors}
 */
export const COLORS = {
  WHITE: "#fff",
  BLACK: "#000",
};

/**
 * Base speed constants; scaled by `state.scale` at runtime.
 * @typedef {{BASE_PADDLE:number, BASE_BALL:number}} Speeds
 * @type {Speeds}
 */
export const SPEEDS = {
  BASE_PADDLE: 5,
  BASE_BALL: 4.2,
};

/**
 * Unscaled design measurements in pixels.
 * @typedef {{PADDLE_W:number, PADDLE_H:number, BALL:number, WALL_PAD:number}} Design
 * @type {Design}
 */
export const DESIGN = {
  PADDLE_W: 10,
  PADDLE_H: 64,
  BALL: 8,
  WALL_PAD: 12,
};
