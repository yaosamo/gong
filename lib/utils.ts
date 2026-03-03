export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatCelebrationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildLocationLabel({
  city,
  region,
  country,
}: {
  city: string | null;
  region: string | null;
  country: string | null;
}) {
  return [city, region, country].filter(Boolean).join(", ") || "Unknown location";
}
