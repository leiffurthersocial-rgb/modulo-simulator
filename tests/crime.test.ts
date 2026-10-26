import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { CONDITION_BY_ID } from "@/data/conditions";
import { listActions, performAction } from "@/engine/actions";
import { runCrimeYear, sendToPrison } from "@/engine/crime";
import { choose } from "@/engine/game";
import { addCondition, treat } from "@/engine/health";
import { Rng } from "@/engine/rng";
import { lifeAtAge } from "./fixtures";

describe("crime", () => {
  it("a failed crime can lead to an arrest popup and a trial", () => {
    let arrested = false;
    for (let i = 0; i < 40 && !arrested; i++) {
      let s = lifeAtAge(25, `crime${i}`);
      s.player.skills.streetSmarts = 0;
      s = performAction(s, DEFAULT_CONTENT, "crime-burglary");
      const p = s.pending[0];
      if (p?.eventId === "crime-arrest") {
        arrested = true;
        expect(p.text).toContain("burglary");
        s = choose(s, DEFAULT_CONTENT, p.uid, "quiet");
        expect(s.pending[0]?.eventId).toBe("crime-trial");
        s = choose(s, DEFAULT_CONTENT, s.pending[0]!.uid, "public");
        expect(s.player.crime.record.length).toBe(1);
      }
    }
    expect(arrested).toBe(true);
  });

  it("prison restricts actions to prison, mind, and people", () => {
    const s = lifeAtAge(30);
    sendToPrison(s, Rng.fromSeed("jail"), "fraud", 3);
    expect(listActions(s, DEFAULT_CONTENT, "nightlife")).toHaveLength(0);
    expect(listActions(s, DEFAULT_CONTENT, "assets")).toHaveLength(0);
    expect(listActions(s, DEFAULT_CONTENT, "prison").length).toBeGreaterThan(3);
  });

  it("serving the sentence releases you", () => {
    const s = lifeAtAge(30);
    sendToPrison(s, Rng.fromSeed("serve"), "fraud", 2);
    expect(s.player.crime.prison?.yearsLeft).toBe(2);
    runCrimeYear(s);
    expect(s.player.crime.prison).toBeDefined();
    runCrimeYear(s);
    expect(s.player.crime.prison).toBeUndefined();
    expect(s.player.crime.record[0]?.convicted).toBe(true);
  });

  it("a conviction ends your job", () => {
    let s = lifeAtAge(30);
    s = performAction(s, DEFAULT_CONTENT, "career-find-job", { option: "fast-food" });
    if (!s.player.career.job) return;
    sendToPrison(s, Rng.fromSeed("job"), "theft", 1);
    expect(s.player.career.job).toBeUndefined();
    expect(s.player.career.history.at(-1)?.reason).toBe("jailed");
  });
});

describe("health", () => {
  it("hospital care cures acute illnesses", () => {
    const s = lifeAtAge(40);
    const rng = Rng.fromSeed("cure");
    addCondition(s, rng, CONDITION_BY_ID["kidney-stones"]!);
    let cured = false;
    for (let i = 0; i < 10 && !cured; i++) cured = treat(s, rng, "kidney-stones", "hospital") === "cured";
    expect(cured).toBe(true);
    expect(s.player.health.conditions).toHaveLength(0);
  });

  it("chronic conditions are managed, not cured", () => {
    const s = lifeAtAge(60);
    const rng = Rng.fromSeed("chronic");
    addCondition(s, rng, CONDITION_BY_ID.arthritis!);
    const before = s.player.health.conditions[0]!.severity;
    let r = treat(s, rng, "arthritis", "clinic");
    for (let i = 0; i < 10 && r === "failed"; i++) r = treat(s, rng, "arthritis", "clinic");
    expect(r).toBe("improved");
    expect(s.player.health.conditions[0]!.severity).toBeLessThan(before);
  });
});
