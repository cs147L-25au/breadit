import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";

import {
  BakeryCard,
  BakeryDetailsModal,
  BakeryMarker,
} from "../../components/map";
import { useBakeries } from "../../hooks/use-bakeries";
import { BakeryWithReviews } from "../../lib/database.types";
import { Fonts, Colors } from "../../constants/Styles";

export default function MapScreen() {
  const { bakeries, loading, error, refetch } = useBakeries();
  const [selectedBakery, setSelectedBakery] =
    useState<BakeryWithReviews | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const handleMarkerPress = (bakery: BakeryWithReviews) => {
    setSelectedBakery(bakery);
    setShowDetails(true);
  };

  const handleCardPress = (bakery: BakeryWithReviews) => {
    setSelectedBakery(bakery);
    mapRef.current?.animateToRegion({
      latitude: Number(bakery.latitude),
      longitude: Number(bakery.longitude),
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const closeDetails = () => {
    setShowDetails(false);
  };

  const getInitialRegion = (): Region => {
    if (bakeries.length > 0) {
      const lats = bakeries.map((b) => Number(b.latitude));
      const lngs = bakeries.map((b) => Number(b.longitude));
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
        longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
      };
    }

    // Default to San Francisco
    return {
      latitude: 37.7599,
      longitude: -122.4148,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Finding bakeries near you...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        showsUserLocation={true}
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
      >
        {bakeries.map((bakery) => (
          <BakeryMarker
            key={bakery.id}
            bakery={bakery}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Bakery List */}
      <View style={styles.bakeryList}>
        <Text style={styles.listTitle}>
          {bakeries.length > 0
            ? `${bakeries.length} Bakeries Found`
            : "No Bakeries Found"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bakeries.map((bakery) => (
            <BakeryCard
              key={bakery.id}
              bakery={bakery}
              isSelected={selectedBakery?.id === bakery.id}
              onPress={handleCardPress}
            />
          ))}
        </ScrollView>
      </View>

      {/* Bakery Details Modal */}
      <BakeryDetailsModal
        bakery={selectedBakery}
        visible={showDetails}
        onClose={closeDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: Fonts.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: Fonts.regular,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  bakeryList: {
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
});
