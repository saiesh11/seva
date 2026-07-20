import * as Location from 'expo-location';

type Coords = { latitude: number; longitude: number };

const CACHE_TTL_MS = 5 * 60 * 1000;

let cached: (Coords & { timestamp: number }) | null = null;

export async function requestAndGetLocation(options?: {
  forceRefresh?: boolean;
}): Promise<
  { granted: true; coords: Coords } | { granted: false; canAskAgain: boolean }
> {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { granted: false, canAskAgain };
  }

  if (!options?.forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { granted: true, coords: cached };
  }

  const lastKnown = options?.forceRefresh
    ? null
    : await Location.getLastKnownPositionAsync({ maxAge: CACHE_TTL_MS });
  const position =
    lastKnown ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

  cached = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: Date.now(),
  };

  return { granted: true, coords: cached };
}

export async function labelForCoords(coords: Coords): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync(coords);
    if (!address) {
      return `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
    }
    if (address.formattedAddress) {
      return address.formattedAddress;
    }
    const parts = [address.city ?? address.district, address.region, address.country].filter(
      (part): part is string => Boolean(part)
    );
    return parts.length > 0 ? parts.join(', ') : `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
  } catch {
    return `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
  }
}

export async function searchForLocation(
  query: string
): Promise<{ coords: Coords; label: string } | null> {
  const results = await Location.geocodeAsync(query);
  const [first] = results;
  if (!first) return null;

  const coords = { latitude: first.latitude, longitude: first.longitude };
  const label = await labelForCoords(coords);
  return { coords, label };
}