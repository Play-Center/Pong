/**
 * Snap a number to the nearest integer pixel.
 * @param {number} v
 * @returns {number}
 */
export const snap = v => Math.round(v);

/**
 * Clamp a value to the inclusive range [lo, hi].
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
