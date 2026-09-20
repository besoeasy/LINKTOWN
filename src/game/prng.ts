// Mulberry32 seeded pseudo-random number generator (kept for gameplay
// randomness like bot wander / recoil — NOT for map layout anymore;
// the arena is the static MERIDIAN PRIME in game/map.ts).
export function makePRNG(seed: number) {
  let s = (seed >>> 0) || 1
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
