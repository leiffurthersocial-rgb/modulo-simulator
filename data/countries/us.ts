import type { Country } from "@/engine/types";

export const unitedStates: Country = {
  id: "us",
  name: "United States",
  flag: "🇺🇸",
  currency: { code: "USD", symbol: "$", perUsd: 1 },
  salaryIndex: 1,
  costIndex: 1,
  taxBrackets: [
    { from: 0, rate: 0.1 },
    { from: 11_600, rate: 0.12 },
    { from: 47_150, rate: 0.22 },
    { from: 100_525, rate: 0.24 },
    { from: 191_950, rate: 0.32 },
    { from: 243_725, rate: 0.35 },
    { from: 609_350, rate: 0.37 },
  ],
  mortalityFactor: 1,
  freeCollege: false,
  conscription: false,
  tags: ["gunsCommon", "presidential", "deathPenalty"],
  names: {
    male: ["James", "Michael", "Tyler", "Brandon", "Marcus", "Ethan", "Noah", "Caleb", "Andre", "Jacob", "Luis", "Dylan", "Wyatt", "Jordan", "Kevin", "Mason"],
    female: ["Emily", "Madison", "Ashley", "Jasmine", "Olivia", "Hailey", "Brianna", "Kayla", "Sophia", "Megan", "Destiny", "Abigail", "Lauren", "Maria", "Chloe", "Taylor"],
    neutral: ["Jordan", "Casey", "Riley", "Avery", "Quinn", "Skyler"],
    last: ["Smith", "Johnson", "Williams", "Brown", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Wilson", "Anderson", "Thomas", "Jackson", "White", "Harris", "Clark", "Lewis", "Walker", "Young", "King"],
  },
};
