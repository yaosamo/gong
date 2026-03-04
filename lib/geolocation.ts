import { buildLocationLabel } from "@/lib/utils";

type LocationPayload = {
  city: string | null;
  region: string | null;
  country: string | null;
  locationLabel: string;
};

const usStateNames: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const countryNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function cleanHeaderValue(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function normalizeCountry(country: string | null) {
  if (!country) {
    return null;
  }

  const upper = country.toUpperCase();

  if (upper.length === 2 && countryNames) {
    return countryNames.of(upper) ?? upper;
  }

  return country;
}

function normalizeRegion(region: string | null, country: string | null) {
  if (!region) {
    return null;
  }

  const upperRegion = region.toUpperCase();
  const upperCountry = country?.toUpperCase() ?? null;

  if (upperCountry === "US" || upperCountry === "UNITED STATES") {
    return usStateNames[upperRegion] ?? region;
  }

  return region;
}

export async function resolveLocationFromRequest(
  request: Request,
): Promise<LocationPayload> {
  const vercelCity = cleanHeaderValue(request.headers.get("x-vercel-ip-city"));
  const vercelCountryCode = cleanHeaderValue(request.headers.get("x-vercel-ip-country"));
  const vercelRegionCode = cleanHeaderValue(request.headers.get("x-vercel-ip-country-region"));

  if (vercelCity || vercelRegionCode || vercelCountryCode) {
    const country = normalizeCountry(vercelCountryCode);
    const region = normalizeRegion(vercelRegionCode, vercelCountryCode);

    return {
      city: vercelCity,
      region,
      country,
      locationLabel: buildLocationLabel({ city: vercelCity, region, country }),
    };
  }

  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim();

  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return {
      city: null,
      region: null,
      country: null,
      locationLabel: "Local session",
    };
  }

  const token = process.env.IPINFO_TOKEN;

  if (!token) {
    return {
      city: null,
      region: null,
      country: null,
      locationLabel: "Unknown location",
    };
  }

  try {
    const response = await fetch(`https://ipinfo.io/${ip}?token=${token}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ipinfo failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      city?: string;
      region?: string;
      country?: string;
    };

    const city = payload.city ?? null;
    const country = normalizeCountry(payload.country ?? null);
    const region = normalizeRegion(payload.region ?? null, payload.country ?? null);

    return {
      city,
      region,
      country,
      locationLabel: buildLocationLabel({ city, region, country }),
    };
  } catch {
    return {
      city: null,
      region: null,
      country: null,
      locationLabel: "Unknown location",
    };
  }
}
