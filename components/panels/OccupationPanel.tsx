"use client";

import { Section, Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import type { ActionView, GameState } from "@/engine";
import { ActionList, groupsOf } from "./ActionList";

function InfoCard({ title, lines }: { title: string; lines: [string, string][] }) {
  return (
    <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm">
      <div className="mb-2 text-lg font-black">{title}</div>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        {lines.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const pct = (value: number) => `${Math.round(value)}%`;

export function OccupationPanel({ state, onClose, onCustom }: { state: GameState; onClose: () => void; onCustom: (v: ActionView) => void }) {
  const money = useMoney(state);
  const { job } = state.player.career;
  const school = state.player.education.enrolled;
  return (
    <Sheet title="Occupation" onClose={onClose}>
      {school && (
        <InfoCard
          title={school.institution}
          lines={[
            ["Program", school.major ?? school.level],
            ["Year", `${school.year} of ${school.length}`],
            ["Grades", pct(school.performance)],
            ...(school.tuitionPerYear > 0 ? ([["Tuition", `${money(school.tuitionPerYear)}/yr`]] as [string, string][]) : []),
          ]}
        />
      )}
      {job && (
        <InfoCard
          title={job.title}
          lines={[
            ["Employer", job.employer],
            ["Salary", `${money(job.salary)}/yr`],
            ["Performance", pct(job.performance)],
            ["Years in role", String(job.yearsInRole)],
          ]}
        />
      )}
      {state.player.business && (
        <InfoCard
          title={state.player.business.name}
          lines={[
            ["Industry", state.player.business.industry],
            ["Valuation", money(state.player.business.value)],
            ["Last year's profit", money(state.player.business.lastProfit)],
            ["Employees", String(state.player.business.employees)],
          ]}
        />
      )}
      {(state.player.sideHustles.length > 0 || state.player.finance.pension > 0) && (
        <Section title="Other income">
          {state.player.sideHustles.map((h) => (
            <div key={h.id} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-b-0">
              <span className="font-semibold">{h.label}</span>
              <span className="text-muted">{money(h.income)}/yr</span>
            </div>
          ))}
          {state.player.finance.pension > 0 && (
            <div className="flex justify-between px-3 py-2 text-sm">
              <span className="font-semibold">Pension</span>
              <span className="text-muted">{money(state.player.finance.pension)}/yr</span>
            </div>
          )}
        </Section>
      )}
      {state.player.career.history.length > 0 && (
        <Section title="Work history">
          {[...state.player.career.history].reverse().slice(0, 8).map((h, i) => (
            <div key={i} className="flex justify-between gap-2 border-b border-line px-3 py-2 text-sm last:border-b-0">
              <span className="truncate font-semibold">{h.title}</span>
              <span className="shrink-0 text-muted">
                {h.startAge}–{h.endAge} · {h.reason === "newJob" ? "moved on" : h.reason === "laidOff" ? "laid off" : h.reason}
              </span>
            </div>
          ))}
        </Section>
      )}
      {state.player.education.degrees.length > 0 && (
        <Section title="Education">
          {state.player.education.degrees.map((d, i) => (
            <div key={i} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-b-0">
              <span className="font-semibold">{d.major ? `${d.major}` : d.institution}</span>
              <span className="text-muted">
                {d.level}
                {d.honors ? " · honors" : ""}
              </span>
            </div>
          ))}
        </Section>
      )}
      {(["school", "career"] as const).flatMap((section) =>
        groupsOf(state, section).map((g) => (
          <Section key={section + g} title={g || (section === "school" ? "School" : "Work")}>
            <ActionList state={state} section={section} group={g} onCustom={onCustom} />
          </Section>
        )),
      )}
      {!school && !job && groupsOf(state, "career").length === 0 && groupsOf(state, "school").length === 0 && (
        <p className="p-4 text-center text-muted">Nothing to do here yet. Enjoy being small.</p>
      )}
    </Sheet>
  );
}
