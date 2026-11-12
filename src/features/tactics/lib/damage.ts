import type { Skill, Unit } from "../../../shared/types";
export const HEIGHT_DAMAGE_PER_LEVEL = 2;
/** 攻击方每高一级 +2 伤害；目标在高处形成反制时以相同幅度扣减，最低仍为 1。 */
export function heightBonus(attackerHeight: number, targetHeight: number) {
  return (attackerHeight - targetHeight) * HEIGHT_DAMAGE_PER_LEVEL;
}
export function previewDamage(a: Unit, t: Unit, s: Skill, armor: number, cover: number) {
  return s.target === "ally"
    ? Math.min(s.power, t.maxHp - t.hp)
    : s.target === "self"
      ? 0
      : Math.max(1, a.power + s.power - armor - cover);
}
export function previewDamageFromHeights(
  a: Unit,
  t: Unit,
  s: Skill,
  armor: number,
  cover: number,
  attackerHeight: number,
  targetHeight: number,
) {
  const base = previewDamage(a, t, s, armor, cover);
  if (s.target !== "enemy") return base;
  return Math.max(1, base + heightBonus(attackerHeight, targetHeight));
}
