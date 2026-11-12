import { computed, reactive, ref } from "vue";
import type { Brush, Point } from "../shared/types";
import { clone, findUnit, key, tileHeight } from "../shared/document";
import {
  reachable,
  terrainRules,
  paintTile,
  paintHeight,
  clampHeight,
} from "../features/terrain";
import { moveBudget, armorValue, tickStatuses } from "../features/roster";
import { getSkill, legalTargets, moveUnit, castSkill } from "../features/tactics";
import { finishTurn } from "../features/initiative";
import {
  record,
  frame,
  loadArchive,
  saveArchive,
  usePlayback,
} from "../features/replay";
import { newSession } from "./session";
export function useWorkspace() {
  const session = reactive(loadArchive() ?? newSession());
  const cursor = ref(-1),
    selected = ref(session.live.active),
    skill = ref(""),
    brush = ref<Brush | null>(null),
    notice = ref("选择蓝色格移动，或选择技能指定目标。");
  const playback = usePlayback(
    () => session.events.length,
    (n) => {
      cursor.value = n;
    },
  );
  const battle = computed(() => frame(session, cursor.value));
  const actor = computed(() => findUnit(battle.value, battle.value.active));
  const locked = computed(() => cursor.value >= 0 || !!session.live.ended);
  const routes = computed(() =>
    locked.value || actor.value.moved || actor.value.acted
      ? new Map()
      : reachable(session.live, actor.value, moveBudget(actor.value)),
  );
  const targets = computed(() => {
    const s = getSkill(actor.value.job, skill.value);
    return s ? legalTargets(battle.value, actor.value, s) : [];
  });
  function cell(p: Point) {
    try {
      if (locked.value) throw new Error("回放只读，请返回实战");
      const before = clone(session.live),
        u = actor.value;
      if (brush.value) {
        const previous = tileHeight(session.live, p);
        let next = previous;
        if (brush.value.kind === "terrain") {
          paintTile(session.live, p, brush.value.terrain);
        } else {
          next = clampHeight(brush.value.height);
          if (next === previous) return;
          paintHeight(session.live, p, next);
        }
        record(
          session,
          before,
          brush.value.kind === "terrain" ? "terrain" : "height",
          brush.value.kind === "terrain"
            ? `地形调整为${terrainRules[brush.value.terrain].name}`
            : `高度 ${previous} → ${next}`,
        );
      } else if (skill.value) {
        const s = getSkill(u.job, skill.value)!;
        const t = session.live.units.find((t) => t.hp > 0 && key(t) === key(p));
        if (!t) throw new Error("请点击合法角色");
        const ground = session.live.tiles.find((v) => key(v) === key(t))!;
        const value = castSkill(
          session.live,
          u.id,
          t.id,
          s,
          armorValue(t),
          terrainRules[ground.terrain].cover,
        );
        record(
          session,
          before,
          "skill",
          `${u.name} → ${t.name} · ${s.name} ${value}`,
        );
        skill.value = "";
      } else {
        const route = routes.value.get(key(p));
        if (!route?.path.length)
          throw new Error("此格不可达，请检查地形、坡度与占位");
        moveUnit(session.live, u.id, route.path);
        record(
          session,
          before,
          "move",
          `${u.name}移动 · 消耗${route.cost}`,
          route.path,
        );
      }
      saveArchive(session);
      notice.value = session.events.at(-1)!.label;
      // 高度编辑可能把当前角色围在陡壁中：站位保留，但及时提示可达区已收缩。
      if (brush.value?.kind === "height") {
        const current = findUnit(session.live, session.live.active);
        const budget = moveBudget(current);
        const map = reachable(session.live, current, budget);
        if (map.size <= 1 && !locked.value)
          notice.value = `${notice.value} · 角色被陡壁孤立，可达区已重算`;
      }
    } catch (e) {
      notice.value = (e as Error).message;
    }
  }
  function wait() {
    if (locked.value) return;
    const before = clone(session.live);
    finishTurn(session.live, tickStatuses);
    record(
      session,
      before,
      "wait",
      `${findUnit(before, before.active).name}结束行动`,
    );
    selected.value = session.live.active;
    skill.value = "";
    saveArchive(session);
  }
  function seek(n: number) {
    playback.stop();
    cursor.value = n;
    skill.value = "";
    brush.value = null;
  }
  function reset() {
    playback.stop();
    Object.assign(session, newSession());
    cursor.value = -1;
    selected.value = session.live.active;
    skill.value = "";
    brush.value = null;
    saveArchive(session);
    notice.value = "新战斗已就绪";
  }
  const path = computed(() =>
    cursor.value > 0 ? (session.events[cursor.value - 1]?.path ?? []) : [],
  );
  return {
    session,
    cursor,
    selected,
    skill,
    brush,
    notice,
    battle,
    actor,
    locked,
    routes,
    targets,
    path,
    playback,
    cell,
    wait,
    seek,
    reset,
  };
}
