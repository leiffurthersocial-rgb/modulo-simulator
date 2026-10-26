import type { Country } from "@/engine/types";

export const japan: Country = {
  id: "jp",
  name: "Japan",
  flag: "🇯🇵",
  currency: { code: "JPY", symbol: "¥", perUsd: 150 },
  salaryIndex: 0.7,
  costIndex: 0.75,
  taxBrackets: [
    { from: 0, rate: 0.15 },
    { from: 13_000, rate: 0.2 },
    { from: 23_000, rate: 0.3 },
    { from: 46_000, rate: 0.33 },
    { from: 60_000, rate: 0.43 },
    { from: 120_000, rate: 0.5 },
    { from: 270_000, rate: 0.55 },
  ],
  mortalityFactor: 0.75,
  freeCollege: false,
  conscription: false,
  tags: ["monarchy", "island", "parliamentary", "deathPenalty"],
  names: {
    male: ["Haruto", "Sota", "Yuto", "Riku", "Takumi", "Kenji", "Daiki", "Hiroshi", "Ren", "Kaito", "Shota", "Yusuke", "Kazuki", "Takeshi", "Ryo", "Sho"],
    female: ["Yui", "Sakura", "Hina", "Aoi", "Mei", "Yuna", "Rin", "Haruka", "Misaki", "Nanami", "Ayaka", "Emi", "Kaori", "Mio", "Akari", "Saki"],
    neutral: ["Hikaru", "Makoto", "Akira", "Kaoru", "Nao", "Tsubasa"],
    last: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Shimizu", "Mori"],
  },
};
