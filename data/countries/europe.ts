import type { Country } from "@/engine/types";

export const france: Country = {
  id: "fr", name: "France", flag: "🇫🇷",
  currency: { code: "EUR", symbol: "€", perUsd: 0.92, symbolAfter: true },
  salaryIndex: 0.8, costIndex: 0.82,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 12_000, rate: 0.11 }, { from: 30_000, rate: 0.3 }, { from: 85_000, rate: 0.41 }, { from: 180_000, rate: 0.45 }],
  mortalityFactor: 0.82, freeCollege: true, conscription: false, tags: ["presidential", "wine"],
  names: {
    male: ["Lucas", "Hugo", "Louis", "Gabriel", "Arthur", "Jules", "Raphaël", "Théo", "Mathis", "Antoine", "Julien", "Nicolas"],
    female: ["Emma", "Jade", "Louise", "Alice", "Chloé", "Léa", "Manon", "Camille", "Inès", "Juliette", "Margaux", "Sarah"],
    neutral: ["Camille", "Dominique", "Claude", "Alix", "Sacha", "Charlie"],
    last: ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "Fontaine"],
  },
};

export const spain: Country = {
  id: "es", name: "Spain", flag: "🇪🇸",
  currency: { code: "EUR", symbol: "€", perUsd: 0.92, symbolAfter: true },
  salaryIndex: 0.6, costIndex: 0.68,
  taxBrackets: [{ from: 0, rate: 0.19 }, { from: 13_000, rate: 0.24 }, { from: 21_000, rate: 0.3 }, { from: 38_000, rate: 0.37 }, { from: 65_000, rate: 0.45 }],
  mortalityFactor: 0.78, freeCollege: false, conscription: false, tags: ["monarchy", "parliamentary", "football"],
  names: {
    male: ["Hugo", "Martín", "Lucas", "Mateo", "Leo", "Daniel", "Alejandro", "Pablo", "Manuel", "Álvaro", "Javier", "Diego"],
    female: ["Lucía", "Sofía", "Martina", "María", "Julia", "Paula", "Valeria", "Emma", "Daniela", "Carla", "Alba", "Elena"],
    neutral: ["Alex", "Ariel", "Noa", "Cruz", "Guadalupe", "Reyes"],
    last: ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz"],
  },
};

export const italy: Country = {
  id: "it", name: "Italy", flag: "🇮🇹",
  currency: { code: "EUR", symbol: "€", perUsd: 0.92, symbolAfter: true },
  salaryIndex: 0.65, costIndex: 0.72,
  taxBrackets: [{ from: 0, rate: 0.23 }, { from: 30_000, rate: 0.35 }, { from: 54_000, rate: 0.43 }],
  mortalityFactor: 0.8, freeCollege: false, conscription: false, tags: ["parliamentary", "football"],
  names: {
    male: ["Leonardo", "Francesco", "Alessandro", "Lorenzo", "Mattia", "Andrea", "Gabriele", "Riccardo", "Tommaso", "Marco", "Giuseppe", "Luca"],
    female: ["Sofia", "Giulia", "Aurora", "Alice", "Ginevra", "Emma", "Giorgia", "Beatrice", "Chiara", "Francesca", "Martina", "Anna"],
    neutral: ["Andrea", "Celeste", "Gioia", "Felice", "Simone", "Fiore"],
    last: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Costa", "Giordano"],
  },
};

export const netherlands: Country = {
  id: "nl", name: "Netherlands", flag: "🇳🇱",
  currency: { code: "EUR", symbol: "€", perUsd: 0.92, symbolAfter: true },
  salaryIndex: 0.9, costIndex: 0.88,
  taxBrackets: [{ from: 0, rate: 0.37 }, { from: 80_000, rate: 0.495 }],
  mortalityFactor: 0.86, freeCollege: false, conscription: false, tags: ["monarchy", "parliamentary", "bikes"],
  names: {
    male: ["Noah", "Sem", "Liam", "Lucas", "Daan", "Levi", "Finn", "Milan", "Jesse", "Bram", "Thijs", "Ruben"],
    female: ["Emma", "Julia", "Mila", "Tess", "Sophie", "Zoë", "Sara", "Nora", "Fenna", "Lotte", "Anna", "Eva"],
    neutral: ["Sam", "Robin", "Kim", "Jip", "Luca", "Charlie"],
    last: ["de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk", "Bakker", "Janssen", "Visser", "Smit", "Meijer", "de Boer", "Mulder", "de Groot", "Bos", "Vos", "Peters"],
  },
};

export const sweden: Country = {
  id: "se", name: "Sweden", flag: "🇸🇪",
  currency: { code: "SEK", symbol: "kr", perUsd: 10.5, symbolAfter: true },
  salaryIndex: 0.82, costIndex: 0.85,
  taxBrackets: [{ from: 0, rate: 0.32 }, { from: 56_000, rate: 0.52 }],
  mortalityFactor: 0.82, freeCollege: true, conscription: true, tags: ["monarchy", "parliamentary"],
  names: {
    male: ["William", "Liam", "Noah", "Hugo", "Lucas", "Oliver", "Elias", "Alexander", "Erik", "Oscar", "Axel", "Leo"],
    female: ["Alice", "Maja", "Elsa", "Astrid", "Wilma", "Freja", "Olivia", "Selma", "Ebba", "Saga", "Agnes", "Ella"],
    neutral: ["Kim", "Robin", "Alex", "Charlie", "Love", "Sam"],
    last: ["Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson", "Pettersson", "Jonsson", "Lindberg", "Lindqvist", "Berg", "Holm"],
  },
};

export const ireland: Country = {
  id: "ie", name: "Ireland", flag: "🇮🇪",
  currency: { code: "EUR", symbol: "€", perUsd: 0.92, symbolAfter: true },
  salaryIndex: 0.88, costIndex: 0.9,
  taxBrackets: [{ from: 0, rate: 0.2 }, { from: 46_000, rate: 0.4 }],
  mortalityFactor: 0.85, freeCollege: false, conscription: false, tags: ["parliamentary", "island"],
  names: {
    male: ["Jack", "Noah", "James", "Conor", "Darragh", "Seán", "Cian", "Liam", "Oisín", "Fionn", "Tadhg", "Ronan"],
    female: ["Emily", "Grace", "Fiadh", "Sophie", "Aoife", "Saoirse", "Ella", "Niamh", "Caoimhe", "Róisín", "Clodagh", "Ciara"],
    neutral: ["Rory", "Shannon", "Sam", "Alex", "Casey", "Morgan"],
    last: ["Murphy", "Kelly", "O'Sullivan", "Walsh", "Smith", "O'Brien", "Byrne", "Ryan", "O'Connor", "O'Neill", "Doyle", "McCarthy", "Gallagher", "Kennedy", "Lynch", "Quinn"],
  },
};

export const poland: Country = {
  id: "pl", name: "Poland", flag: "🇵🇱",
  currency: { code: "PLN", symbol: "zł", perUsd: 4, symbolAfter: true },
  salaryIndex: 0.42, costIndex: 0.5,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 7_500, rate: 0.12 }, { from: 30_000, rate: 0.32 }],
  mortalityFactor: 1.05, freeCollege: true, conscription: false, tags: ["parliamentary"],
  names: {
    male: ["Antoni", "Jan", "Aleksander", "Franciszek", "Jakub", "Szymon", "Filip", "Mikołaj", "Wojciech", "Piotr", "Kacper", "Tomasz"],
    female: ["Zuzanna", "Julia", "Zofia", "Hanna", "Maja", "Lena", "Alicja", "Oliwia", "Natalia", "Wiktoria", "Agnieszka", "Magda"],
    neutral: ["Sasza", "Alex", "Nikola", "Kim", "Maks", "Ola"],
    last: ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Krawczyk", "Kaczmarek"],
  },
};

export const russia: Country = {
  id: "ru", name: "Russia", flag: "🇷🇺",
  currency: { code: "RUB", symbol: "₽", perUsd: 92, symbolAfter: true },
  salaryIndex: 0.3, costIndex: 0.4,
  taxBrackets: [{ from: 0, rate: 0.13 }, { from: 27_000, rate: 0.15 }],
  mortalityFactor: 1.4, freeCollege: true, conscription: true, tags: ["presidential"],
  names: {
    male: ["Alexander", "Mikhail", "Ivan", "Dmitry", "Maxim", "Artyom", "Sergei", "Nikolai", "Andrei", "Pavel", "Yuri", "Vladislav"],
    female: ["Anastasia", "Maria", "Anna", "Sofia", "Ekaterina", "Daria", "Polina", "Natalia", "Olga", "Tatiana", "Svetlana", "Irina"],
    neutral: ["Sasha", "Zhenya", "Valya", "Slava", "Shura", "Tosha"],
    last: ["Ivanov", "Smirnov", "Kuznetsov", "Popov", "Vasiliev", "Petrov", "Sokolov", "Mikhailov", "Novikov", "Fedorov", "Morozov", "Volkov", "Alekseev", "Lebedev", "Semenov", "Egorov"],
  },
};
