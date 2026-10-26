import type { Rng } from "../rng";

export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export interface Card {
  rank: (typeof RANKS)[number];
  suit: (typeof SUITS)[number];
}

export function newDeck(rng: Rng): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return rng.shuffle(deck);
}

/** Best blackjack total, counting aces as 11 where it doesn't bust. */
export function handValue(cards: readonly Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      aces++;
      total += 11;
    } else if (c.rank === "J" || c.rank === "Q" || c.rank === "K") total += 10;
    else total += Number(c.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export const isBlackjack = (cards: readonly Card[]) => cards.length === 2 && handValue(cards) === 21;

/** Dealer draws to 17 (stands on soft 17). Mutates the deck. */
export function dealerPlay(deck: Card[], dealer: Card[]): Card[] {
  const hand = [...dealer];
  while (handValue(hand) < 17) {
    const c = deck.pop();
    if (!c) break;
    hand.push(c);
  }
  return hand;
}

/** Net winnings for a finished hand (negative = loss). Blackjack pays 3:2. */
export function settleHand(player: readonly Card[], dealer: readonly Card[], bet: number): number {
  const p = handValue(player);
  const d = handValue(dealer);
  if (p > 21) return -bet;
  if (isBlackjack(player) && !isBlackjack(dealer)) return Math.floor(bet * 1.5);
  if (isBlackjack(dealer) && !isBlackjack(player)) return -bet;
  if (d > 21 || p > d) return bet;
  if (p < d) return -bet;
  return 0;
}
