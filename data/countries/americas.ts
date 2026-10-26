import type { Country } from "@/engine/types";

export const canada: Country = {
  id: "ca", name: "Canada", flag: "🇨🇦",
  currency: { code: "CAD", symbol: "C$", perUsd: 1.36 },
  salaryIndex: 0.85, costIndex: 0.88,
  taxBrackets: [{ from: 0, rate: 0.2 }, { from: 40_000, rate: 0.3 }, { from: 80_000, rate: 0.38 }, { from: 160_000, rate: 0.46 }],
  mortalityFactor: 0.85, freeCollege: false, conscription: false, tags: ["parliamentary", "monarchy", "hockey"],
  names: {
    male: ["Liam", "Noah", "Oliver", "William", "Benjamin", "Lucas", "Jacob", "Ethan", "Logan", "Owen", "Nathan", "Félix"],
    female: ["Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Chloé", "Ava", "Léa", "Abigail", "Hannah", "Madison", "Zoé"],
    neutral: ["Jordan", "Riley", "Avery", "Rowan", "Quinn", "Dakota"],
    last: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Wilson", "MacDonald", "Gagnon", "Johnson", "Taylor", "Côté", "Campbell", "Anderson", "Leblanc", "Lee", "Wong"],
  },
};

export const mexico: Country = {
  id: "mx", name: "Mexico", flag: "🇲🇽",
  currency: { code: "MXN", symbol: "MX$", perUsd: 17.5 },
  salaryIndex: 0.22, costIndex: 0.35,
  taxBrackets: [{ from: 0, rate: 0.02 }, { from: 500, rate: 0.064 }, { from: 4_500, rate: 0.1088 }, { from: 7_900, rate: 0.16 }, { from: 9_200, rate: 0.214 }, { from: 22_000, rate: 0.3 }],
  mortalityFactor: 1.15, freeCollege: true, conscription: false, tags: ["presidential", "football"],
  names: {
    male: ["Santiago", "Mateo", "Sebastián", "Leonardo", "Diego", "Emiliano", "Daniel", "Miguel", "José", "Alejandro", "Juan", "Carlos"],
    female: ["Sofía", "María José", "Valentina", "Regina", "Camila", "Ximena", "Renata", "Fernanda", "Valeria", "Mariana", "Guadalupe", "Daniela"],
    neutral: ["Guadalupe", "Cruz", "Ariel", "Rosario", "Trinidad", "Alex"],
    last: ["Hernández", "García", "Martínez", "López", "González", "Rodríguez", "Pérez", "Sánchez", "Ramírez", "Cruz", "Flores", "Gómez", "Morales", "Vázquez", "Reyes", "Jiménez"],
  },
};

export const argentina: Country = {
  id: "ar", name: "Argentina", flag: "🇦🇷",
  currency: { code: "ARS", symbol: "AR$", perUsd: 900 },
  salaryIndex: 0.22, costIndex: 0.32,
  taxBrackets: [{ from: 0, rate: 0.05 }, { from: 2_000, rate: 0.15 }, { from: 6_000, rate: 0.27 }, { from: 12_000, rate: 0.35 }],
  mortalityFactor: 1.1, freeCollege: true, conscription: false, tags: ["presidential", "football"],
  names: {
    male: ["Mateo", "Benjamín", "Bautista", "Felipe", "Thiago", "Joaquín", "Santino", "Lautaro", "Facundo", "Martín", "Nicolás", "Agustín"],
    female: ["Isabella", "Martina", "Catalina", "Emilia", "Delfina", "Valentina", "Olivia", "Sofía", "Florencia", "Agustina", "Lucía", "Camila"],
    neutral: ["Alex", "Ariel", "Sasha", "Guadalupe", "Noa", "Cruz"],
    last: ["González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "Pérez", "Romero", "Sosa", "Álvarez", "Torres", "Ruiz", "Acosta", "Benítez", "Medina"],
  },
};
