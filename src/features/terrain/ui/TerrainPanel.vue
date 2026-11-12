<script setup lang="ts">
import type { Brush, Terrain } from "../../../shared/types";
import { HEIGHT_MAX, HEIGHT_MIN } from "../../../shared/types";
import { terrainRules } from "../lib/cost";
defineProps<{ brush: Brush | null; locked: boolean }>();
defineEmits<{ paint: [brush: Brush | null] }>();
const heights = Array.from(
  { length: HEIGHT_MAX - HEIGHT_MIN + 1 },
  (_, i) => i + HEIGHT_MIN,
);
function isTerrain(brush: Brush | null, terrain: Terrain) {
  return brush?.kind === "terrain" && brush.terrain === terrain;
}
function isHeight(brush: Brush | null, height: number) {
  return brush?.kind === "height" && brush.height === height;
}
</script>
<template>
  <section class="panel terrain-panel">
    <div class="eyebrow">01 / FIELD CONDITIONS</div>
    <h3>地形图例 <small>选择后点击空地编辑</small></h3>
    <div class="terrain-list">
      <button
        v-for="(rule, id) in terrainRules"
        :key="id"
        :disabled="locked"
        :class="{ chosen: isTerrain(brush, id as Terrain) }"
        @click="
          $emit(
            'paint',
            isTerrain(brush, id as Terrain)
              ? null
              : { kind: 'terrain', terrain: id as Terrain },
          )
        "
      >
        <b>{{ rule.glyph }}</b
        ><span>{{ rule.name }}</span
        ><small
          >移动 {{ Number.isFinite(rule.cost) ? rule.cost : "×" }} / 护甲 +{{
            rule.cover
          }}</small
        >
      </button>
    </div>
    <h4 class="height-heading">
      高度图层 <small>叠加于原地形，不覆盖密林 / 浅滩</small>
    </h4>
    <div class="height-list">
      <button
        v-for="h in heights"
        :key="h"
        :disabled="locked"
        :class="{ chosen: isHeight(brush, h) }"
        @click="
          $emit(
            'paint',
            isHeight(brush, h) ? null : { kind: 'height', height: h },
          )
        "
      >
        <b>{{ h }}</b>
      </button>
    </div>
    <p class="climb-note">
      攀爬上限与消耗按职业计算：游侠最灵活，重装上行最费力，秘术可跨两级但上行昂贵。
    </p>
  </section>
</template>
