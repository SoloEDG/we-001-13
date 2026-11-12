export { default as BattleMap } from "./ui/BattleMap.vue";
export { default as TerrainPanel } from "./ui/TerrainPanel.vue";
export {
  createMap,
  paintTile,
  paintHeight,
  normalizeBattle,
} from "./model/map";
export { reachable } from "./lib/paths";
export {
  terrainRules,
  climbRules,
  climbCost,
  clampHeight,
  stepCost,
} from "./lib/cost";
