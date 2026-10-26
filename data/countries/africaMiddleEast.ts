import type { Country } from "@/engine/types";

export const nigeria: Country = {
  id: "ng", name: "Nigeria", flag: "🇳🇬",
  currency: { code: "NGN", symbol: "₦", perUsd: 1500 },
  salaryIndex: 0.08, costIndex: 0.18,
  taxBrackets: [{ from: 0, rate: 0.07 }, { from: 200, rate: 0.11 }, { from: 400, rate: 0.15 }, { from: 700, rate: 0.19 }, { from: 1_100, rate: 0.21 }, { from: 2_100, rate: 0.24 }],
  mortalityFactor: 2.1, freeCollege: false, conscription: false, tags: ["presidential", "football", "deathPenalty"],
  names: {
    male: ["Chinedu", "Emeka", "Oluwaseun", "Tunde", "Ibrahim", "Musa", "Chukwuemeka", "Ayodele", "Femi", "Uche", "Babajide", "Obinna"],
    female: ["Chiamaka", "Ngozi", "Adaeze", "Funmilayo", "Aisha", "Zainab", "Yetunde", "Amaka", "Folake", "Nneka", "Ifeoma", "Bisi"],
    neutral: ["Tobi", "Ayo", "Dami", "Kene", "Tosin", "Chidi"],
    last: ["Okafor", "Adeyemi", "Okeke", "Bello", "Ibrahim", "Okonkwo", "Adebayo", "Eze", "Abubakar", "Nwosu", "Ogunleye", "Olawale", "Chukwu", "Musa", "Balogun", "Obi"],
  },
};

export const southAfrica: Country = {
  id: "za", name: "South Africa", flag: "🇿🇦",
  currency: { code: "ZAR", symbol: "R", perUsd: 18.5 },
  salaryIndex: 0.3, costIndex: 0.4,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 5_000, rate: 0.18 }, { from: 13_000, rate: 0.26 }, { from: 20_000, rate: 0.31 }, { from: 28_000, rate: 0.36 }, { from: 38_000, rate: 0.39 }, { from: 95_000, rate: 0.45 }],
  mortalityFactor: 1.85, freeCollege: false, conscription: false, tags: ["parliamentary", "rugby", "cricket"],
  names: {
    male: ["Thabo", "Sipho", "Lwazi", "Bongani", "Johan", "Pieter", "Kabelo", "Themba", "Mandla", "Liam", "Ruan", "Tshepo"],
    female: ["Thandi", "Lerato", "Nomvula", "Zanele", "Ayanda", "Anika", "Palesa", "Naledi", "Lindiwe", "Mia", "Karabo", "Refilwe"],
    neutral: ["Lesedi", "Ayanda", "Bonolo", "Kamogelo", "Neo", "Tumelo"],
    last: ["Dlamini", "Nkosi", "Ndlovu", "Khumalo", "Mokoena", "Botha", "van der Merwe", "Naidoo", "Mahlangu", "Pretorius", "Zulu", "Mthembu", "Smith", "Molefe", "Sithole", "Venter"],
  },
};

export const egypt: Country = {
  id: "eg", name: "Egypt", flag: "🇪🇬",
  currency: { code: "EGP", symbol: "E£", perUsd: 48 },
  salaryIndex: 0.1, costIndex: 0.2,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 850, rate: 0.1 }, { from: 1_150, rate: 0.15 }, { from: 1_500, rate: 0.2 }, { from: 4_200, rate: 0.225 }, { from: 8_300, rate: 0.25 }, { from: 25_000, rate: 0.275 }],
  mortalityFactor: 1.4, freeCollege: true, conscription: true, tags: ["presidential", "football", "deathPenalty"],
  names: {
    male: ["Mohamed", "Ahmed", "Mahmoud", "Omar", "Youssef", "Mostafa", "Ali", "Karim", "Hassan", "Tarek", "Amr", "Khaled"],
    female: ["Fatma", "Mariam", "Nour", "Salma", "Habiba", "Yasmin", "Aya", "Hana", "Menna", "Rana", "Dina", "Laila"],
    neutral: ["Nour", "Salam", "Amal", "Iman", "Safa", "Wafa"],
    last: ["Mohamed", "Ahmed", "Hassan", "Ali", "Ibrahim", "Mahmoud", "Mostafa", "Said", "Abdel Rahman", "Farouk", "Saleh", "Kamal", "Nasser", "Fawzy", "Gamal", "Shaker"],
  },
};

export const turkey: Country = {
  id: "tr", name: "Turkey", flag: "🇹🇷",
  currency: { code: "TRY", symbol: "₺", perUsd: 32 },
  salaryIndex: 0.25, costIndex: 0.35,
  taxBrackets: [{ from: 0, rate: 0.15 }, { from: 3_100, rate: 0.2 }, { from: 6_800, rate: 0.27 }, { from: 24_000, rate: 0.35 }, { from: 90_000, rate: 0.4 }],
  mortalityFactor: 1.1, freeCollege: true, conscription: true, tags: ["presidential", "football"],
  names: {
    male: ["Yusuf", "Eymen", "Ömer", "Mustafa", "Mehmet", "Emir", "Ahmet", "Ali", "Kerem", "Burak", "Emre", "Can"],
    female: ["Zeynep", "Elif", "Defne", "Eylül", "Azra", "Asel", "Ecrin", "Merve", "Ayşe", "Fatma", "Selin", "Esra"],
    neutral: ["Deniz", "Derya", "Umut", "Evren", "Ilkin", "Toprak"],
    last: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara"],
  },
};
