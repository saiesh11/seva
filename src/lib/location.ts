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