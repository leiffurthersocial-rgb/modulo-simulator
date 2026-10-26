import { career, EMPLOYERS, HS } from "./define";

export const SERVICE_CAREERS = [
  career("fast-food", "Fast Food", "service", "Utensils", { minAge: 16 }, [["Crew Member", 22_000], ["Shift Lead", 27_000], ["Assistant Manager", 35_000], ["Restaurant Manager", 52_000]], { employers: EMPLOYERS.food, difficulty: 5 }),
  career("retail", "Retail", "service", "ShoppingBag", { minAge: 16 }, [["Sales Associate", 24_000], ["Senior Associate", 28_000], ["Department Supervisor", 36_000], ["Store Manager", 58_000]], { employers: EMPLOYERS.retail, difficulty: 8, trains: "charisma" }),
  career("barista", "Coffee Shop", "service", "Utensils", { minAge: 16 }, [["Barista", 24_000], ["Head Barista", 29_000], ["Café Manager", 40_000]], { employers: ["Bean There", "Grind House", "The Daily Cup", "Steam & Co."], difficulty: 10 }),
  career("server", "Restaurant Server", "service", "Utensils", { minAge: 18 }, [["Server", 26_000], ["Head Server", 32_000], ["Maître d'", 45_000]], { employers: ["Le Petit Bistro", "The Oak Room", "Harbor Grill", "Casa Verde"], difficulty: 12, trains: "charisma" }),
  career("custodian", "Custodial", "service", "Sparkles", { minAge: 18 }, [["Custodian", 28_000], ["Head Custodian", 36_000], ["Facilities Supervisor", 50_000]], { employers: EMPLOYERS.school, difficulty: 5 }),
  career("delivery", "Delivery Driver", "service", "Car", { minAge: 18 }, [["Delivery Driver", 33_000], ["Route Lead", 40_000], ["Dispatch Manager", 55_000]], { employers: ["ParcelPro", "Swift Logistics", "QuickDrop"], difficulty: 10 }),
  career("warehouse", "Warehouse", "service", "Building2", { minAge: 18 }, [["Warehouse Associate", 32_000], ["Forklift Operator", 38_000], ["Shift Supervisor", 48_000], ["Warehouse Manager", 68_000]], { employers: ["Swift Logistics", "MegaMart Distribution", "Primeship"], difficulty: 8, trains: "athleticism" }),
  career("security", "Security", "service", "Shield", { minAge: 18, cleanRecord: true }, [["Security Guard", 31_000], ["Senior Guard", 37_000], ["Security Supervisor", 48_000], ["Head of Security", 70_000]], { employers: ["Guardian Security", "SafeWatch", "Sentinel Services"], difficulty: 15 }),
  career("receptionist", "Front Office", "service", "Users", { minAge: 18, degree: HS }, [["Receptionist", 32_000], ["Office Coordinator", 41_000], ["Office Manager", 58_000]], { difficulty: 20, trains: "charisma" }),
  career("call-center", "Customer Service", "service", "MessageCircle", { minAge: 18 }, [["Customer Service Rep", 33_000], ["Team Lead", 42_000], ["Call Center Manager", 62_000]], { difficulty: 10 }),
  career("bartender", "Bartending", "service", "Wine", { minAge: 21 }, [["Barback", 25_000], ["Bartender", 34_000], ["Head Bartender", 45_000], ["Bar Manager", 58_000]], { employers: ["The Rusty Anchor", "Velvet Lounge", "O'Malley's", "The Speakeasy"], difficulty: 20, trains: "charisma" }),
  career("hotel", "Hospitality", "service", "Building2", { minAge: 18, degree: HS }, [["Front Desk Agent", 30_000], ["Front Desk Supervisor", 38_000], ["Assistant Hotel Manager", 55_000], ["Hotel General Manager", 95_000]], { employers: EMPLOYERS.hotel, difficulty: 20 }),
  career("trucker", "Trucking", "service", "Car", { minAge: 21, cleanRecord: true }, [["Trainee Driver", 42_000], ["Truck Driver", 55_000], ["Owner-Operator", 85_000]], { employers: ["Roadrunner Freight", "Big Rig Logistics", "Interstate Haulers"], difficulty: 20, hazard: 0.002 }),
  career("stylist", "Hair Styling", "service", "Scissors", { minAge: 18, programs: ["cosmetology"] }, [["Junior Stylist", 28_000], ["Stylist", 40_000], ["Senior Stylist", 55_000], ["Salon Owner", 80_000]], { employers: ["Shear Genius", "Curl Up & Dye", "The Mane Event"], difficulty: 25, trains: "creativity" }),
  career("chef", "Kitchen", "service", "Utensils", { minAge: 18 }, [["Line Cook", 30_000], ["Sous Chef", 48_000], ["Head Chef", 70_000], ["Executive Chef", 105_000]], { employers: ["Le Petit Bistro", "Harbor Grill", "Casa Verde", "The Oak Room"], difficulty: 20, trains: "creativity", promoteYears: 3 }),
  career("cna", "Patient Care", "service", "HeartPulse", { minAge: 18, degree: HS }, [["Nursing Assistant", 32_000], ["Senior Nursing Assistant", 38_000], ["Patient Care Coordinator", 50_000]], { employers: EMPLOYERS.hospital, difficulty: 15 }),
  career("daycare", "Childcare", "service", "Baby", { minAge: 18, degree: HS, cleanRecord: true }, [["Childcare Worker", 27_000], ["Lead Teacher", 34_000], ["Daycare Director", 52_000]], { employers: ["Little Sprouts", "Sunshine Daycare", "Tiny Steps"], difficulty: 15 }),
  career("farmer", "Farming", "service", "Leaf", { minAge: 16 }, [["Farmhand", 28_000], ["Farmer", 45_000], ["Farm Owner", 75_000]], { employers: ["Green Acres", "Sunny Fields Farm", "Hollow Creek Ranch"], difficulty: 10, trains: "athleticism", promoteYears: 4 }),
  career("postal", "Postal Service", "public", "Building2", { minAge: 18, degree: HS, cleanRecord: true }, [["Mail Carrier", 42_000], ["Senior Carrier", 52_000], ["Postmaster", 80_000]], { employers: ["National Postal Service"], difficulty: 25, promoteYears: 4 }),
  career("clergy", "Clergy", "public", "Church", { minAge: 22, degree: ["college", "grad", "phd"] }, [["Youth Pastor", 35_000], ["Pastor", 55_000], ["Senior Pastor", 80_000]], { employers: ["First Community Church", "St. Mary's Parish", "Grace Fellowship"], difficulty: 30, trains: "charisma" }),
] as const;

export const PART_TIME_CAREERS = [
  career("babysitter", "Babysitting", "partTime", "Baby", { minAge: 13, maxAge: 25 }, [["Babysitter", 5_000]], { partTime: true, employers: EMPLOYERS.self, difficulty: 5 }),
  career("lifeguard", "Lifeguarding", "partTime", "Zap", { minAge: 15, stats: { athleticism: 40 } }, [["Lifeguard", 8_000]], { partTime: true, employers: ["City Pool", "Seaside Beach Patrol"], difficulty: 20, trains: "athleticism" }),
  career("dog-walker", "Dog Walking", "partTime", "PawPrint", { minAge: 13 }, [["Dog Walker", 6_000]], { partTime: true, employers: EMPLOYERS.self, difficulty: 3 }),
  career("tutor", "Tutoring", "partTime", "BookOpen", { minAge: 15, stats: { smarts: 65 } }, [["Tutor", 9_000]], { partTime: true, employers: ["BrightMinds Tutoring", "Self-employed"], difficulty: 20, trains: "smarts" }),
  career("bagger", "Grocery Store", "partTime", "ShoppingBag", { minAge: 14 }, [["Grocery Bagger", 7_000]], { partTime: true, employers: EMPLOYERS.retail, difficulty: 3 }),
  career("newspaper", "Paper Route", "partTime", "Bike", { minAge: 12, maxAge: 17 }, [["Paper Carrier", 3_000]], { partTime: true, employers: ["Daily Ledger"], difficulty: 2 }),
  career("cashier-pt", "Cinema", "partTime", "Film", { minAge: 15 }, [["Movie Theater Usher", 7_000]], { partTime: true, employers: ["Starlight Cinemas", "Megaplex 12"], difficulty: 5 }),
] as const;
