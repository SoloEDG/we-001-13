import type { Battle, Point, Skill } from "../../../shared/types";
import { findUnit, key } from "../../../shared/document";
import { legalTargets } from "../lib/targeting";
import { previewDamageFromHeights } from "../lib/damage";
export function moveUnit(b: Battle, id: string, path: Point[]) {
  const u = findUnit(b, id);
  if (u.moved || u.acted || !path.length) throw new Error("本次行动无法移动");
  Object.assign(u, path[path.length - 1]);
  u.moved = true;
}
export function castSkill(
  b: Battle,
  id: string,
  target: string,
  s: Skill,
  armor: number,
  cover: number,
) {
  const u = findUnit(b, id),
    t = findUnit(b, target);
  if (u.acted || !legalTargets(b, u, s).some((v) => v.id === target))
    throw new Error("目标不合法");
  const attackerHeight =
    b.tiles.find((v) => key(v) === key(u))?.height ?? 0;
  const targetHeight = b.tiles.find((v) => key(v) === key(t))?.height ?? 0;
  const value = previewDamageFromHeights(
    u,
    t,
    s,
    armor,
    cover,
    attackerHeight,
    targetHeight,
  );
  t.hp =
    s.target === "ally"
      ? Math.min(t.maxHp, t.hp + value)
      : Math.max(0, t.hp - value);
  if (s.status && t.hp > 0) {
    t.statuses = t.statuses.filter((v) => v.kind !== s.status);
    t.statuses.push({ kind: s.status, turns: 2 });
  }
  u.acted = true;
  return value;
}
