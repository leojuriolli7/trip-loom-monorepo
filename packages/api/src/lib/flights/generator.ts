import { cabinClassEnum } from "../../db/schema";
import type {
  AirportSummaryDTO,
  FlightOptionDTO,
  FlightSearchQuery,
  FlightSeatMap,
} from "@trip-loom/contracts/dto/flights";

type CabinClass = (typeof cabinClassEnum.enumValues)[number];

const AIRLINES = [
  { code: "TL", name: "TripLoom Airways" },
  { code: "SK", name: "SkyWave Airlines" },
  { code: "GA", name: "Global Air" },
  { code: "PA", name: "Pacific Airlines" },
  { code: "NO", name: "North Orbit" },
] as const;

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  economy: 1,
  business: 1.9,
  first: 3.2,
};

const MINIMUM_SEAT_PRICE_IN_CENTS = 7_500;

const CABIN_LAYOUTS: Record<CabinClass, number[][]> = {
  economy: [[3, 3]],
  business: [
    [2, 2],
    [1, 2, 1],
    [2, 1, 2],
  ],
  first: [
    [1, 1],
    [1, 2, 1],
  ],
};

const CABIN_ROW_RANGE: Record<CabinClass, { min: number; max: number }> = {
  economy: { min: 22, max: 34 },
  business: { min: 8, max: 16 },
  first: { min: 4, max: 8 },
};

const hashString = (value: string): number => {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;

  return (): number => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const randomInt = (
  random: () => number,
  minInclusive: number,
  maxInclusive: number,
): number =>
  Math.floor(random() * (maxInclusive - minInclusive + 1)) + minInclusive;

const getBaseRouteDurationMinutes = (fromCode: string, toCode: string): number => {
  // Deterministic pseudo-distance from airport pair; avoids route hardcoding.
  return 60 + (hashString(`${fromCode}:${toCode}`) % 781);
};

const addMinutesUtc = (date: string, minutesSinceMidnight: number): Date => {
  const baseDate = new Date(`${date}T00:00:00.000Z`);
  return new Date(baseDate.getTime() + minutesSinceMidnight * 60_000);
};

const buildSeatLetters = (layout: number[]): string[][] => {
  let letterCode = "A".charCodeAt(0);

  return layout.map((sectionWidth) =>
    Array.from({ length: sectionWidth }, () => {
      const letter = String.fromCharCode(letterCode);
      letterCode += 1;
      return letter;
    }),
  );
};

const getMinimumAvailableSeatPriceInCents = (seatMap: FlightSeatMap): number => {
  let minimumPrice = Number.POSITIVE_INFINITY;

  for (const row of seatMap) {
    for (const section of row.sections) {
      for (const seat of section) {
        if (seat.isBooked) {
          continue;
        }

        minimumPrice = Math.min(minimumPrice, seat.priceInCents);
      }
    }
  }

  if (Number.isFinite(minimumPrice)) {
    return minimumPrice;
  }

  return MINIMUM_SEAT_PRICE_IN_CENTS;
};

export function generateSeatMapForFlight({
  seedKey,
  cabinClass,
  baseSeatPriceInCents,
}: {
  seedKey: string;
  cabinClass: CabinClass;
  baseSeatPriceInCents: number;
}): {
  seatMap: FlightSeatMap;
  availableSeatCount: number;
} {
  const random = createSeededRandom(hashString(seedKey));
  const layoutOptions = CABIN_LAYOUTS[cabinClass];
  const layout = layoutOptions[randomInt(random, 0, layoutOptions.length - 1)];
  const lettersBySection = buildSeatLetters(layout);

  const { min, max } = CABIN_ROW_RANGE[cabinClass];
  const totalRows = randomInt(random, min, max);
  const normalizedBaseSeatPriceInCents = Math.max(
    MINIMUM_SEAT_PRICE_IN_CENTS,
    Math.round(baseSeatPriceInCents),
  );

  const seatMap: FlightSeatMap = [];
  let availableSeatCount = 0;

  for (let rowNumber = 1; rowNumber <= totalRows; rowNumber += 1) {
    const rowProgress = (rowNumber - 1) / Math.max(totalRows - 1, 1);
    const rowMultiplier = 1.28 - rowProgress * 0.42;

    const sections = lettersBySection.map((sectionLetters) =>
      sectionLetters.map((letter) => {
        const jitter = randomInt(random, -1_600, 2_400);
        const priceInCents = Math.max(
          MINIMUM_SEAT_PRICE_IN_CENTS,
          Math.round(normalizedBaseSeatPriceInCents * rowMultiplier) + jitter,
        );
        const bookedProbability = 0.2 + rowProgress * 0.35;
        const isBooked = random() < bookedProbability;

        if (!isBooked) {
          availableSeatCount += 1;
        }

        return {
          id: `${rowNumber}${letter}`,
          priceInCents,
          isBooked,
        };
      }),
    );

    seatMap.push({
      rowNumber,
      sections,
    });
  }

  if (availableSeatCount === 0 && seatMap.length > 0) {
    const firstSeat = seatMap[0]?.sections[0]?.[0];
    if (firstSeat) {
      firstSeat.isBooked = false;
      availableSeatCount = 1;
    }
  }

  return {
    seatMap,
    availableSeatCount,
  };
}

export function generateFlightOptions({
  params,
  departureAirport,
  arrivalAirport,
}: {
  params: FlightSearchQuery;
  departureAirport: AirportSummaryDTO;
  arrivalAirport: AirportSummaryDTO;
}): FlightOptionDTO[] {
  const from = departureAirport.code;
  const to = arrivalAirport.code;
  const seedKey = `${from}|${to}|${params.date}|${params.cabinClass}|${params.passengers}`;
  const random = createSeededRandom(hashString(seedKey));
  const optionCount = randomInt(random, 5, 10);
  const baseRouteDuration = getBaseRouteDurationMinutes(from, to);

  const options: FlightOptionDTO[] = [];
  const departureCity = departureAirport.city?.trim() || departureAirport.name;
  const arrivalCity = arrivalAirport.city?.trim() || arrivalAirport.name;

  for (let index = 0; index < optionCount; index += 1) {
    const airline = AIRLINES[randomInt(random, 0, AIRLINES.length - 1)];
    const departureMinutes =
      240 + index * 90 + randomInt(random, 0, 95) + randomInt(random, 0, 35);
    const durationMinutes = Math.max(
      45,
      baseRouteDuration + randomInt(random, -50, 95),
    );
    const departureTime = addMinutesUtc(params.date, departureMinutes);
    const arrivalTime = new Date(
      departureTime.getTime() + durationMinutes * 60_000,
    );

    const baseSeatPriceInCents = Math.round(
      (durationMinutes * 52 + randomInt(random, 3_000, 12_500)) *
        CABIN_MULTIPLIER[params.cabinClass],
    );
    const seatMapData = generateSeatMapForFlight({
      seedKey: `${seedKey}|${index + 1}`,
      cabinClass: params.cabinClass,
      baseSeatPriceInCents,
    });

    options.push({
      id: `flight_opt_${hashString(`${seedKey}|${index}`).toString(36)}`,
      flightNumber: `${airline.code}${randomInt(random, 100, 999)}`,
      airline: airline.name,
      departureAirportCode: from,
      departureCity,
      departureAirport,
      departureTime: departureTime.toISOString(),
      arrivalAirportCode: to,
      arrivalCity,
      arrivalAirport,
      arrivalTime: arrivalTime.toISOString(),
      durationMinutes,
      cabinClass: params.cabinClass,
      availableSeats: seatMapData.availableSeatCount,
      seatMap: seatMapData.seatMap,
    });
  }

  return options.sort(
    (a, b) =>
      getMinimumAvailableSeatPriceInCents(a.seatMap) -
        getMinimumAvailableSeatPriceInCents(b.seatMap) ||
      a.departureTime.localeCompare(b.departureTime),
  );
}
