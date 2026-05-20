export type PricingSetup = {
  name: string;
  base_price: number;
};

export type PricingSessionType = {
  name: string;
  price_multiplier?: number | string | null;
};

export function calculateBookingPrice(setup: PricingSetup, sessionType: PricingSessionType) {
  const fallbackMultipliers: Record<string, number> = {
    Solo: 1,
    Duo: 1.5,
    Squad: 2,
  };

  const multiplier =
    typeof sessionType.price_multiplier === "number"
      ? sessionType.price_multiplier
      : typeof sessionType.price_multiplier === "string"
        ? Number(sessionType.price_multiplier)
        : fallbackMultipliers[sessionType.name] ?? 1;

  return Math.round(setup.base_price * (Number.isFinite(multiplier) ? multiplier : 1));
}
