import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const bakeries = [
  { id: '1', name: 'Tartine Bakery', rating: 4.8, latitude: 37.7599, longitude: -122.4148 },
  { id: '2', name: 'La Boulangerie', rating: 4.5, latitude: 37.7620, longitude: -122.4100 },
  { id: '3', name: 'Acme Bread', rating: 4.9, latitude: 37.7580, longitude: -122.4180 },
];

export default function MapScreen() {
  const [selectedBakery, setSelectedBakery] = useState(null);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.7599,
          longitude: -122.4148,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {bakeries.map(bakery => (
          <Marker
            key={bakery.id}
            coordinate={{ latitude: bakery.latitude, longitude: bakery.longitude }}
            title={bakery.name}
            description={`Rating: ${bakery.rating}`}
            onPress={() => setSelectedBakery(bakery)}
          />
        ))}
      </MapView>

      <View style={styles.bakeryList}>
        <Text style={styles.listTitle}>Nearby Bakeries</Text>
        {bakeries.map(bakery => (
          <TouchableOpacity
            key={bakery.id}
            onPress={() => setSelectedBakery(bakery)}
            style={[
              styles.bakeryItem,
              selectedBakery?.id === bakery.id && styles.selectedItem,
            ]}
          >
            <Text style={styles.bakeryName}>{bakery.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <Text style={styles.ratingText}>{bakery.rating}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  map: {
    flex: 1,
  },
  bakeryList: {
    padding: 16,
    backgroundColor: '#fff',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bakeryItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  bakeryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
  },
});