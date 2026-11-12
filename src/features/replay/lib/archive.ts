import type { Session } from "../../../shared/types";
import { assertBattle } from "../../../shared/document";
import { normalizeBattle } from "../../terrain/model/map";
export function saveArchive(s: Session) {
  localStorage.setItem("we001-session", JSON.stringify(s));
}
export function loadArchive(): Session | null {
  try {
    const raw = localStorage.getItem("we001-session");
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!Array.isArray(s.events) || !Array.isArray(s.live?.tiles)) return null;
    // 每份历史快照按自身坡度迁移，不套用当前刚编辑的高度。
    normalizeBattle(s.initial);
    normalizeBattle(s.live);
    for (const event of s.events) {
      normalizeBattle(event.before);
      normalizeBattle(event.after);
    }
    assertBattle(s.live);
    assertBattle(s.initial);
    return s;
  } catch {
    return null;
  }
}
export function downloadArchive(s: Session) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "灰烬渡口-战斗记录.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
