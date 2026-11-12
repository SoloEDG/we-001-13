export type Terrain = "plain" | "forest" | "water" | "wall";
export type Profession = "guard" | "ranger" | "mage" | "medic";
/** 高度与地形正交：0 为基准面，逐级叠加在密林、浅滩等原地形之上。 */
export const HEIGHT_MIN = 0;
export const HEIGHT_MAX = 4;
/** 旧版“高地”地形的迁移高度；配合每级 +2 伤害，保留原有高地 +2 的手感。 */
export const RIDGE_HEIGHT = 1;
export interface Point {
  x: number;
  y: number;
}
export interface Tile extends Point {
  terrain: Terrain;
  height: number;
}
export interface Status {
  kind: "slow" | "burn" | "guard";
  turns: number;
}
export interface Unit extends Point {
  id: string;
  name: string;
  job: Profession;
  team: "azure" | "ember";
  hp: number;
  maxHp: number;
  power: number;
  armor: number;
  speed: number;
  move: number;
  statuses: Status[];
  moved: boolean;
  acted: boolean;
}
export interface Battle {
  tiles: Tile[];
  units: Unit[];
  round: number;
  queue: string[];
  active: string;
  ended: string | null;
}
export type EventKind = "move" | "skill" | "wait" | "terrain" | "height";
export interface BattleEvent {
  id: number;
  kind: EventKind;
  actor: string;
  label: string;
  path: Point[];
  before: Battle;
  after: Battle;
}
export interface Session {
  initial: Battle;
  live: Battle;
  events: BattleEvent[];
}
export interface Skill {
  id: string;
  name: string;
  range: number;
  power: number;
  target: "enemy" | "ally" | "self";
  status?: Status["kind"];
  description: string;
}
export interface TerrainBrush {
  kind: "terrain";
  terrain: Terrain;
}
export interface HeightBrush {
  kind: "height";
  height: number;
}
/** 地形笔刷与高度笔刷互斥；高度永远叠加在原地形之上。 */
export type Brush = TerrainBrush | HeightBrush;
