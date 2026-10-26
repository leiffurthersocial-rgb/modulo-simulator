import {
  AlertTriangle, Baby, BookOpen, Brain, Briefcase, Building2, Camera, Car, Check, ChevronLeft, ChevronRight, Cigarette,
  Clock, Coins, Crown, Dice5, Download, Dumbbell, Eye, Film, Flame, Gavel, Gem, Ghost, Gift, GraduationCap, HandCoins,
  HandHeart, Heart, HeartPulse, Home, Info, Landmark, Leaf, Lock, Megaphone, MessageCircle, Mic, Moon, Music, Palette,
  PawPrint, PenTool, Pill, Plane, Rocket, Scissors, Settings, Shield, Ship, ShoppingBag, Shuffle, Siren, Skull, Smile,
  Sparkles, Star, Stethoscope, Sun, Swords, Syringe, Tent, ThumbsDown, ThumbsUp, Trash2, TrendingUp, Trophy, Undo2,
  Upload, User, Users, Utensils, Wine, X, Zap, Bike, Flower2, Hammer, Laptop, Scale, Church, Target, Tv, Bomb,
  type LucideIcon,
} from "lucide-react";

/** Icons usable by name from data files. Add here when content needs a new one. */
const ICONS: Record<string, LucideIcon> = {
  AlertTriangle, Baby, BookOpen, Brain, Briefcase, Building2, Camera, Car, Check, ChevronLeft, ChevronRight, Cigarette,
  Clock, Coins, Crown, Dice5, Download, Dumbbell, Eye, Film, Flame, Gavel, Gem, Ghost, Gift, GraduationCap, HandCoins,
  HandHeart, Heart, HeartPulse, Home, Info, Landmark, Leaf, Lock, Megaphone, MessageCircle, Mic, Moon, Music, Palette,
  PawPrint, PenTool, Pill, Plane, Rocket, Scissors, Settings, Shield, Ship, ShoppingBag, Shuffle, Siren, Skull, Smile,
  Sparkles, Star, Stethoscope, Sun, Swords, Syringe, Tent, ThumbsDown, ThumbsUp, Trash2, TrendingUp, Trophy, Undo2,
  Upload, User, Users, Utensils, Wine, X, Zap, Bike, Flower2, Hammer, Laptop, Scale, Church, Target, Tv, Bomb,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, size = 18, className }: { name?: string; size?: number; className?: string }) {
  const Cmp = (name && ICONS[name]) || Sparkles;
  return <Cmp size={size} className={className} aria-hidden />;
}
