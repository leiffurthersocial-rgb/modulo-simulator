import type { Country } from "@/engine/types";

export const india: Country = {
  id: "in",
  name: "India",
  flag: "🇮🇳",
  currency: { code: "INR", symbol: "₹", perUsd: 84 },
  salaryIndex: 0.12,
  costIndex: 0.2,
  taxBrackets: [
    { from: 0, rate: 0 },
    { from: 3_600, rate: 0.05 },
    { from: 8_500, rate: 0.1 },
    { from: 14_500, rate: 0.15 },
    { from: 18_000, rate: 0.2 },
    { from: 24_000, rate: 0.3 },
  ],
  mortalityFactor: 1.45,
  freeCollege: false,
  conscription: false,
  tags: ["parliamentary", "cricket", "deathPenalty"],
  names: {
    male: ["Aarav", "Vihaan", "Arjun", "Rohan", "Aditya", "Karan", "Rahul", "Vikram", "Siddharth", "Ishaan", "Nikhil", "Rajesh", "Amit", "Pranav", "Kabir", "Dev"],
    female: ["Aanya", "Diya", "Priya", "Ananya", "Isha", "Kavya", "Neha", "Pooja", "Riya", "Sneha", "Meera", "Tanvi", "Shreya", "Lakshmi", "Nisha", "Aditi"],
    neutral: ["Kiran", "Sasha", "Ashwin", "Jyoti", "Noor", "Shan"],
    last: ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Reddy", "Iyer", "Nair", "Mehta", "Joshi", "Rao", "Das", "Chopra", "Malhotra", "Banerjee", "Kapoor", "Verma", "Pillai", "Desai", "Bose"],
  },
};
