export type PricingSetup = {
  name: string;
  base_price: number;
};

export type PricingSessionType = {
  name: string;
  price_multiplier?: number | string | null;
};

const RACING_SESSION_PRICES: Record<string, number> = {
  "30 Minutes": 100,
  "10 Laps": 100,
};

export function isRacingSessionType(sessionTypeName: string) {
  return sessionTypeName in RACING_SESSION_PRICES;
}

export function calculateBookingPrice(setup: PricingSetup, sessionType: PricingSessionType) {
  if (setup.name === "racing") {
    const racingPrice = RACING_SESSION_PRICES[sessionType.name];
    if (typeof racingPrice === "number") {
      return racingPrice;
    }
  }

  if (sessionType.name === "Free Session") {
    return 0;
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
