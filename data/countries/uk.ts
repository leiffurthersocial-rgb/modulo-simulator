import type { Country } from "@/engine/types";

export const unitedKingdom: Country = {
  id: "uk",
  name: "United Kingdom",
  flag: "🇬🇧",
  currency: { code: "GBP", symbol: "£", perUsd: 0.78 },
  salaryIndex: 0.8,
  costIndex: 0.85,
  taxBrackets: [
    { from: 0, rate: 0 },
    { from: 16_000, rate: 0.2 },
    { from: 64_000, rate: 0.4 },
    { from: 160_000, rate: 0.45 },
  ],
  mortalityFactor: 0.9,
  freeCollege: false,
  conscription: false,
  tags: ["monarchy", "island", "parliamentary"],
  names: {
    male: ["Oliver", "Harry", "George", "Jack", "Alfie", "Charlie", "Thomas", "Callum", "Liam", "Ollie", "Reece", "Kieran", "Rhys", "Archie", "Alistair", "Declan"],
    female: ["Amelia", "Olivia", "Isla", "Poppy", "Freya", "Charlotte", "Imogen", "Chloe", "Ellie", "Niamh", "Sophie", "Holly", "Bethany", "Rosie", "Harriet", "Megan"],
    neutral: ["Alex", "Charlie", "Robin", "Sam", "Frankie", "Jamie"],
    last: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Evans", "Thomas", "Roberts", "Walker", "Wright", "Hughes", "Edwards", "Green", "Hall", "Wood", "Clarke", "Patel", "Hussain", "Murphy"],
  },
};
