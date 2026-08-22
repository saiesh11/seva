import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

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

function isValidCoordinate(latitude: unknown, longitude: unknown): latitude is number {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export function NearbyProvidersMap({ customerCoords, providers, style }: NearbyProvidersMapProps) {
  const { t } = useTranslation();

  const validProviders = providers.filter((item) => isValidCoordinate(item.latitude, item.longitude));

  return (
    <MapView
      style={[styles.map, style]}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: customerCoords.latitude,
        longitude: customerCoords.longitude,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      }}>
      <Marker coordinate={customerCoords} title={t('nearbyProviders.yourLocation')} pinColor="#0274DF" />
      {validProviders.map((item) => (
        <Marker
          key={item.provider_id}
          coordinate={{ latitude: item.latitude, longitude: item.longitude }}
          title={item.full_name ?? t('nearbyProviders.fallbackName')}
          description={t('nearbyProviders.distanceAway', { distance: item.distance_km.toFixed(1) })}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
