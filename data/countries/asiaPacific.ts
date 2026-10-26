import type { Country } from "@/engine/types";

export const australia: Country = {
  id: "au", name: "Australia", flag: "🇦🇺",
  currency: { code: "AUD", symbol: "A$", perUsd: 1.52 },
  salaryIndex: 0.9, costIndex: 0.9,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 12_000, rate: 0.16 }, { from: 30_000, rate: 0.3 }, { from: 90_000, rate: 0.37 }, { from: 125_000, rate: 0.45 }],
  mortalityFactor: 0.8, freeCollege: false, conscription: false, tags: ["parliamentary", "monarchy", "island", "cricket"],
  names: {
    male: ["Oliver", "Noah", "Jack", "William", "Leo", "Lucas", "Thomas", "Henry", "Charlie", "Mason", "Lachlan", "Cooper"],
    female: ["Charlotte", "Olivia", "Amelia", "Isla", "Mia", "Ava", "Grace", "Willow", "Matilda", "Harper", "Chloe", "Ruby"],
    neutral: ["Kai", "Jordan", "Riley", "Bailey", "Frankie", "Sam"],
    last: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson", "Thompson", "Nguyen", "Thomas", "Walker", "Harris", "Kelly"],
  },
};

export const newZealand: Country = {
  id: "nz", name: "New Zealand", flag: "🇳🇿",
  currency: { code: "NZD", symbol: "NZ$", perUsd: 1.65 },
  salaryIndex: 0.75, costIndex: 0.85,
  taxBrackets: [{ from: 0, rate: 0.105 }, { from: 8_500, rate: 0.175 }, { from: 32_000, rate: 0.3 }, { from: 42_000, rate: 0.33 }, { from: 110_000, rate: 0.39 }],
  mortalityFactor: 0.85, freeCollege: false, conscription: false, tags: ["parliamentary", "monarchy", "island", "rugby"],
  names: {
    male: ["Oliver", "Noah", "Jack", "Leo", "George", "Charlie", "Arlo", "Nikau", "Hunter", "Tama", "Rawiri", "James"],
    female: ["Isla", "Charlotte", "Amelia", "Olivia", "Mia", "Aria", "Lily", "Ava", "Hana", "Mere", "Ruby", "Georgia"],
    neutral: ["Kai", "Ari", "Jordan", "Ngaio", "Riley", "Sam"],
    last: ["Smith", "Wilson", "Williams", "Brown", "Taylor", "Jones", "Ngata", "Walker", "Thompson", "Te Whata", "Anderson", "Clark", "Harris", "Martin", "Parata", "Robinson"],
  },
};

export const southKorea: Country = {
  id: "kr", name: "South Korea", flag: "🇰🇷",
  currency: { code: "KRW", symbol: "₩", perUsd: 1350 },
  salaryIndex: 0.62, costIndex: 0.72,
  taxBrackets: [{ from: 0, rate: 0.06 }, { from: 10_500, rate: 0.15 }, { from: 37_000, rate: 0.24 }, { from: 66_000, rate: 0.35 }, { from: 110_000, rate: 0.38 }, { from: 225_000, rate: 0.4 }],
  mortalityFactor: 0.78, freeCollege: false, conscription: true, tags: ["presidential"],
  names: {
    male: ["Min-jun", "Seo-jun", "Do-yun", "Ha-jun", "Ji-ho", "Joon-ho", "Hyun-woo", "Ji-hoon", "Sung-min", "Tae-yang", "Woo-jin", "Dong-hyun"],
    female: ["Seo-yeon", "Ji-woo", "Ha-eun", "Seo-yun", "Min-seo", "Ji-yoo", "Soo-ah", "Ye-jin", "Hye-jin", "Eun-ji", "Da-eun", "Yu-na"],
    neutral: ["Ha-neul", "Ji-min", "Yoon", "Eun", "Sol", "Bit-na"],
    last: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han", "Oh", "Seo", "Shin", "Kwon", "Hwang"],
  },
};

export const china: Country = {
  id: "cn", name: "China", flag: "🇨🇳",
  currency: { code: "CNY", symbol: "¥", perUsd: 7.2 },
  salaryIndex: 0.3, costIndex: 0.45,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 8_300, rate: 0.03 }, { from: 13_300, rate: 0.1 }, { from: 28_000, rate: 0.2 }, { from: 42_000, rate: 0.25 }, { from: 63_000, rate: 0.3 }, { from: 93_000, rate: 0.35 }, { from: 132_000, rate: 0.45 }],
  mortalityFactor: 0.98, freeCollege: false, conscription: false, tags: ["deathPenalty"],
  names: {
    male: ["Wei", "Jun", "Hao", "Yi", "Lei", "Jie", "Tao", "Ming", "Zhi", "Yang", "Bo", "Chen"],
    female: ["Li", "Xin", "Mei", "Ying", "Jing", "Fang", "Yan", "Hui", "Lan", "Xiu", "Na", "Ting"],
    neutral: ["Yu", "An", "Ping", "Xiao", "Rui", "Lin"],
    last: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo"],
  },
};

export const philippines: Country = {
  id: "ph", name: "Philippines", flag: "🇵🇭",
  currency: { code: "PHP", symbol: "₱", perUsd: 56 },
  salaryIndex: 0.12, costIndex: 0.25,
  taxBrackets: [{ from: 0, rate: 0 }, { from: 4_500, rate: 0.15 }, { from: 7_000, rate: 0.2 }, { from: 14_000, rate: 0.25 }, { from: 35_000, rate: 0.3 }, { from: 140_000, rate: 0.35 }],
  mortalityFactor: 1.5, freeCollege: true, conscription: false, tags: ["presidential", "island"],
  names: {
    male: ["Juan", "Jose", "Mark", "John Paul", "Christian", "Rafael", "Gabriel", "Miguel", "Angelo", "Carlo", "Paolo", "Jerome"],
    female: ["Maria", "Angel", "Princess", "Mary Grace", "Andrea", "Nicole", "Kristine", "Jasmine", "Camille", "Bea", "Joy", "Patricia"],
    neutral: ["Jun", "Ali", "Jamie", "Chris", "Pat", "Andy"],
    last: ["Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andrada", "Castillo", "Flores", "Villanueva", "Ramos", "Castro", "Aquino"],
  },
};
