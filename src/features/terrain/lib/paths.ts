import type { Battle, Point, Tile, Unit } from "../../../shared/types";
import { key } from "../../../shared/document";
import { stepCost } from "./cost";
export interface Route {
  cost: number;
  path: Point[];
}
/**
 * 按“原地形消耗 + 攀爬消耗”求可达区。单步高差超过职业攀爬上限时直接切断，
 * 因此陡壁外沿的格子不会被绕过或斜跨。
 */
export function reachable(
  b: Battle,
  u: Unit,
  budget: number,
): Map<string, Route> {
  const tiles = new Map(b.tiles.map((t) => [key(t), t]));
  const start = tiles.get(key(u));
  if (!start) return new Map();
  const result = new Map<string, Route>([[key(u), { cost: 0, path: [] }]]);
  const pending: Point[] = [u];
  while (pending.length) {
    pending.sort((a, c) => result.get(key(a))!.cost - result.get(key(c))!.cost);
    const pos = pending.shift()!;
    const route = result.get(key(pos))!;
    const from = tiles.get(key(pos)) as Tile;
    for (const d of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: pos.x + d[0], y: pos.y + d[1] };
      const tile = tiles.get(key(n));
      if (
        !tile ||
        b.units.some((v) => v.hp > 0 && v.id !== u.id && key(v) === key(n))
      )
        continue;
      const step = stepCost(u, from, tile);
      if (step === null) continue;
      const cost = route.cost + step;
      if (cost > budget || cost >= (result.get(key(n))?.cost ?? Infinity))
        continue;
      result.set(key(n), { cost, path: [...route.path, n] });
      pending.push(n);
    }
  }
  return result;
}
