import { StyleProp, ViewStyle } from 'react-native';

type MapProvider = {
  provider_id: string;
  full_name: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
};

type NearbyProvidersMapProps = {
  customerCoords: { latitude: number; longitude: number };
  providers: MapProvider[];
  style?: StyleProp<ViewStyle>;
};

// react-native-maps has no web support and crashes if imported into a web
// bundle (codegenNativeComponent is not implemented by react-native-web).
// The map toggle is hidden on web (see nearby-providers.tsx), so this
// should never actually render — this stub exists purely so Metro's web
// bundle never evaluates the native-only import above.
export function NearbyProvidersMap(_props: NearbyProvidersMapProps) {
  return null;
}
