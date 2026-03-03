import { buildLocationLabel } from "@/lib/utils";

type LocationPayload = {
  city: string | null;
  region: string | null;
  country: string | null;
  locationLabel: string;
};

export async function resolveLocationFromRequest(
  request: Request,
): Promise<LocationPayload> {
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
    const region = payload.region ?? null;
    const country = payload.country ?? null;

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
