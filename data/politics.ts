export interface Office {
  id: string;
  level: number;
  /** Title per government style. */
  title: { presidential: string; parliamentary: string };
  minAge: number;
  /** Campaign cost, US baseline. */
  cost: number;
  /** Yearly salary, US baseline. */
  salary: number;
  /** Fame needed to be taken seriously. */
  fame: number;
  term: number;
}

export const OFFICES: readonly Office[] = [
  { id: "council", level: 1, title: { presidential: "City Council Member", parliamentary: "Local Councillor" }, minAge: 18, cost: 5_000, salary: 30_000, fame: 0, term: 4 },
  { id: "mayor", level: 2, title: { presidential: "Mayor", parliamentary: "Mayor" }, minAge: 21, cost: 40_000, salary: 95_000, fame: 5, term: 4 },
  { id: "legislator", level: 3, title: { presidential: "State Legislator", parliamentary: "Member of Parliament" }, minAge: 21, cost: 120_000, salary: 85_000, fame: 10, term: 4 },
  { id: "governor", level: 4, title: { presidential: "Governor", parliamentary: "Cabinet Minister" }, minAge: 30, cost: 600_000, salary: 160_000, fame: 25, term: 4 },
  { id: "senator", level: 5, title: { presidential: "Senator", parliamentary: "Deputy Prime Minister" }, minAge: 30, cost: 1_500_000, salary: 175_000, fame: 35, term: 6 },
  { id: "head", level: 6, title: { presidential: "President", parliamentary: "Prime Minister" }, minAge: 35, cost: 5_000_000, salary: 400_000, fame: 50, term: 4 },
];

export const OFFICE_BY_ID: Readonly<Record<string, Office>> = Object.fromEntries(OFFICES.map((o) => [o.id, o]));
