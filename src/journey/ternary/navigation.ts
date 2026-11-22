/** The ternary's screens, opened from the card on Journey. */
export type TernaryStackParamList = {
  /** The flock and the shared bird, or what a ternary is. `arrived`: just joined or started. */
  TernaryHome: { arrived?: boolean } | undefined;
  /** Naming a new ternary and choosing its migration. */
  StartTernary: undefined;
  /** Joining a friend's ternary with its invite code. */
  JoinTernary: undefined;
  /** Sharing a meal you love, and the ones friends shared. */
  RecipeSwap: undefined;
  /** One recipe: a dish at the swap, or one you kept (`id` is the dish's either way). */
  Recipe: { id: string };
  Postcards: undefined;
  TernarySettings: undefined;
  /** What a ternary is for, and what friends can and can't see. */
  AboutTernary: undefined;
};
