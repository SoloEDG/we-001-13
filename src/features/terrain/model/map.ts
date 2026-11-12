import type { Battle, Point, Terrain, Tile } from "../../../shared/types";
import { RIDGE_HEIGHT } from "../../../shared/types";
import { key } from "../../../shared/document";
import { clampHeight } from "../lib/cost";

/**
 * 地形与高度是两层：高度叠加在原地形之上，调整高度不会覆盖密林或浅滩，
 * 因此掩护与水域规则仍可与坡度组合。旧版“高地”地形统一迁移为高度 1 的草原。
 */
export function createMap(): Tile[] {
  return Array.from({ length: 96 }, (_, i) => {
    const x = i % 12,
      y = Math.floor(i / 12);
    const terrain: Terrain =
      x === 6 && y !== 3 && y !== 4
        ? "water"
        : (x === 4 && y < 3) || (x === 8 && y > 3)
          ? "forest"
          : x === 5 && y === 6
            ? "wall"
            : "plain";
    return {
      x,
      y,
      terrain,
      height: terrain === "plain" && x === 9 && y < 3 ? RIDGE_HEIGHT : 0,
    };
  });
}

export function paintTile(b: Battle, p: Point, terrain: Terrain) {
  if (b.units.some((u) => u.hp > 0 && key(u) === key(p)))
    throw new Error("角色脚下不可编辑地形");
  const tile = b.tiles.find((t) => key(t) === key(p));
  if (!tile) throw new Error("地图外坐标");
  tile.terrain = terrain;
}

/** 高度可在角色脚下编辑；受阻角色保留站位，可达区会在下一帧重算。 */
export function paintHeight(b: Battle, p: Point, height: number) {
  const tile = b.tiles.find((t) => key(t) === key(p));
  if (!tile) throw new Error("地图外坐标");
  tile.height = clampHeight(height);
}

/** 补齐旧存档中的地形与高度：旧高地地貌转为高度 1 的草原，其余高度为 0。 */
export function normalizeBattle(b: Battle) {
  for (const tile of b.tiles) {
    // 旧存档可能仍带 ridge 地形或缺失 height 字段。
    const legacy = tile as unknown as {
      terrain: Terrain | "ridge";
      height?: number;
    };
    const ridge = legacy.terrain === "ridge";
    if (ridge) legacy.terrain = "plain";
    const height =
      typeof legacy.height === "number"
        ? legacy.height
        : ridge
          ? RIDGE_HEIGHT
          : 0;
    legacy.height = clampHeight(height);
  }
  return b;
}
