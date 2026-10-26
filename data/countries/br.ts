import type { Country } from "@/engine/types";

export const brazil: Country = {
  id: "br",
  name: "Brazil",
  flag: "🇧🇷",
  currency: { code: "BRL", symbol: "R$", perUsd: 5.3 },
  salaryIndex: 0.25,
  costIndex: 0.35,
  taxBrackets: [
    { from: 0, rate: 0 },
    { from: 5_400, rate: 0.075 },
    { from: 8_100, rate: 0.15 },
    { from: 10_800, rate: 0.225 },
    { from: 13_400, rate: 0.275 },
  ],
  mortalityFactor: 1.25,
  freeCollege: true,
  conscription: true,
  tags: ["presidential", "carnival", "football"],
  names: {
    male: ["Miguel", "Arthur", "Gael", "Heitor", "Davi", "Lucas", "Gabriel", "Rafael", "Pedro", "Thiago", "Matheus", "Bruno", "João", "Felipe", "Caio", "Rodrigo"],
    female: ["Helena", "Alice", "Laura", "Maria", "Valentina", "Beatriz", "Larissa", "Camila", "Juliana", "Fernanda", "Gabriela", "Ana", "Mariana", "Letícia", "Bianca", "Isabela"],
    neutral: ["Ariel", "Darcy", "Juci", "Noa", "Sasha", "Cris"],
    last: ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"],
  },
};
