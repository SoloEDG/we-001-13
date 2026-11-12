import type { Profession, Terrain, Tile, Unit } from "../../../shared/types";
import { HEIGHT_MAX, HEIGHT_MIN } from "../../../shared/types";

export const terrainRules: Record<
  Terrain,
  { name: string; cost: number; cover: number; glyph: string }
> = {
  plain: { name: "草原", cost: 1, cover: 0, glyph: "·" },
  forest: { name: "密林", cost: 2, cover: 3, glyph: "♠" },
  water: { name: "浅滩", cost: 3, cover: 0, glyph: "≈" },
  wall: { name: "断崖", cost: Infinity, cover: 0, glyph: "▰" },
};

/**
 * 攀爬能力按职业区分：maxRise 为单步可跨越的最大高差（绝对值），
 * upCost / downCost 为每提升/下降一级的额外预算消耗。
 */
export const climbRules: Record<
  Profession,
  { maxRise: number; upCost: number; downCost: number; name: string }
> = {
  guard: { maxRise: 1, upCost: 2, downCost: 1, name: "重装" },
  ranger: { maxRise: 2, upCost: 1, downCost: 1, name: "游侠" },
  mage: { maxRise: 2, upCost: 2, downCost: 1, name: "秘术" },
  medic: { maxRise: 1, upCost: 1, downCost: 1, name: "医师" },
};

export function movementCost(t: Terrain, u: Unit) {
  return t === "water" && u.job === "ranger" ? 2 : terrainRules[t].cost;
}

/** 该格原地形的进入消耗，与高度无关。 */
export function groundCost(tile: Tile, u: Unit) {
  return movementCost(tile.terrain, u);
}

export function climbLimit(u: Unit) {
  return climbRules[u.job].maxRise;
}

export function clampHeight(value: number) {
  return Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, Math.round(value)));
}

/**
 * 从 from 高度走到 to 高度的攀爬消耗；高差超过职业上限返回 null（禁止跨越），
 * 因此过陡边缘不会被寻路绕过。
 */
export function climbCost(u: Unit, from: number, to: number): number | null {
  const diff = to - from;
  const rule = climbRules[u.job];
  if (Math.abs(diff) > rule.maxRise) return null;
  return diff > 0 ? diff * rule.upCost : -diff * rule.downCost;
}

/** 单步进入 to 的总预算；null 表示被陡壁阻断。 */
export function stepCost(u: Unit, from: Tile, to: Tile): number | null {
  const ground = groundCost(to, u);
  if (!Number.isFinite(ground)) return null;
  const climb = climbCost(u, from.height, to.height);
  return climb === null ? null : ground + climb;
}
