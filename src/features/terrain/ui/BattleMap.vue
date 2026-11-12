<script setup lang="ts">
import type { Battle, Point, Tile } from "../../../shared/types";
import { key } from "../../../shared/document";
import { terrainRules } from "../lib/cost";
defineProps<{
  battle: Battle;
  selected: string;
  routes: string[];
  targets: string[];
  path: Point[];
}>();
defineEmits<{ cell: [point: Point] }>();
const sides = ["n", "e", "s", "w"] as const;
const neighbours = (tiles: Tile[], tile: Tile) =>
  ({
    n: tiles.find((t) => t.x === tile.x && t.y === tile.y - 1),
    e: tiles.find((t) => t.x === tile.x + 1 && t.y === tile.y),
    s: tiles.find((t) => t.x === tile.x && t.y === tile.y + 1),
    w: tiles.find((t) => t.x === tile.x - 1 && t.y === tile.y),
  }) as Record<(typeof sides)[number], Tile | undefined>;
/** 等高关系：在较低的一侧标出相邻格更高的边缘，使每条坡面只出现一次金色轮廓。 */
function edges(tiles: Tile[], tile: Tile) {
  const around = neighbours(tiles, tile);
  return sides
    .filter((side) => {
      const other = around[side];
      return other && other.height > tile.height;
    })
    .map((side) => ({ side }));
}
</script>
<template>
  <section class="map-frame">
    <div class="map-caption">
      <span>渡口 07 / 北部边境</span><span>12 × 8 · 四向网格</span>
    </div>
    <div class="battle-map" role="grid" aria-label="战术地图">
      <button
        v-for="tile in battle.tiles"
        :key="key(tile)"
        :data-cell="key(tile)"
        :data-height="tile.height"
        :class="[
          'tile',
          tile.terrain,
          {
            reachable: routes.includes(key(tile)),
            target: targets.includes(key(tile)),
            trail: path.some((p) => key(p) === key(tile)),
          },
        ]"
        :aria-label="`${tile.x},${tile.y} ${terrainRules[tile.terrain].name} · 高度 ${tile.height}`"
        @click="$emit('cell', tile)"
      >
        <span class="relief" /><span class="ground">{{
          terrainRules[tile.terrain].glyph
        }}</span
        ><span
          v-for="edge in edges(battle.tiles, tile)"
          :key="edge.side"
          :class="['edge', `edge-${edge.side}`, 'edge-up']"
        /><span v-if="tile.height" class="height-mark">{{
          tile.height
        }}</span
        ><template
          v-for="unit in battle.units.filter(
            (u) => u.hp > 0 && key(u) === key(tile),
          )"
          :key="unit.id"
          ><span
            :class="[
              'pawn',
              unit.team,
              {
                selected: unit.id === selected,
                active: unit.id === battle.active,
              },
            ]"
            >{{
              unit.job === "guard"
                ? "♜"
                : unit.job === "ranger"
                  ? "➶"
                  : unit.job === "mage"
                    ? "✦"
                    : "✚"
            }}<i
              :style="{
                width: (unit.hp / unit.maxHp) * 100 + '%',
              }" /></span></template
        ><small>{{ tile.x + 1 }}·{{ tile.y + 1 }}</small>
      </button>
    </div>
    <div class="map-caption">
      <span>坡面按高度着色 · 金色边缘表示相邻格更高</span
      ><span>◇ 当前行动　● 可移动　◈ 技能目标</span>
    </div>
  </section>
</template>
