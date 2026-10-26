import type { Country } from "@/engine/types";

export const germany: Country = {
  id: "de",
  name: "Germany",
  flag: "🇩🇪",
  currency: { code: "EUR", symbol: "€", perUsd: 0.92, symbolAfter: true },
  salaryIndex: 0.85,
  costIndex: 0.8,
  taxBrackets: [
    { from: 0, rate: 0 },
    { from: 12_500, rate: 0.14 },
    { from: 18_500, rate: 0.24 },
    { from: 72_000, rate: 0.42 },
    { from: 300_000, rate: 0.45 },
  ],
  mortalityFactor: 0.88,
  freeCollege: true,
  conscription: false,
  tags: ["parliamentary"],
  names: {
    male: ["Lukas", "Finn", "Jonas", "Leon", "Maximilian", "Felix", "Paul", "Moritz", "Tobias", "Niklas", "Jan", "Florian", "Sebastian", "Matthias", "Till", "Ben"],
    female: ["Mia", "Emma", "Hannah", "Lea", "Lena", "Sophie", "Anna", "Marie", "Laura", "Johanna", "Clara", "Katharina", "Julia", "Lisa", "Greta", "Paula"],
    neutral: ["Kim", "Luca", "Robin", "Charlie", "Mika", "Sascha"],
    last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf", "Neumann", "Schwarz", "Braun", "Zimmermann", "Krüger", "Hartmann"],
  },
};
