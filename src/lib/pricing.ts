export type PricingSetup = {
  name: string;
  base_price: number;
};

export type PricingSessionType = {
  name: string;
  price_multiplier?: number | string | null;
};

export function calculateBookingPrice(setup: PricingSetup, sessionType: PricingSessionType) {
  if (setup.name === "racing") {
    if (sessionType.name === "Solo") return 50;
    if (sessionType.name === "Duo") return 80;
    if (sessionType.name === "Squad") return 150;
  }

  if (setup.name === "arcade") {
    if (sessionType.name === "Solo") return 50;
    if (sessionType.name === "Duo") return 80;
    if (sessionType.name === "Squad") return 120;
  }

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
