import { MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const bakeries = [
  { id: '1', name: 'Tartine Bakery', rating: 4.8 },
  { id: '2', name: 'La Boulangerie', rating: 4.5 },
  { id: '3', name: 'Acme Bread', rating: 4.9 },
];

export default function MapScreen() {
  const [selectedBakery, setSelectedBakery] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={64} color="#d97706" />
        <Text style={styles.placeholderText}>Map view coming soon</Text>
        <Text style={styles.placeholderSubtext}>Will use react-native-maps</Text>
      </View>

      <View style={styles.bakeryList}>
        <Text style={styles.listTitle}>Nearby Bakeries</Text>
        {bakeries.map(bakery => (
          <TouchableOpacity
            key={bakery.id}
            onPress={() => setSelectedBakery(bakery)}
            style={styles.bakeryItem}
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6b7280',
  },
  placeholderSubtext: {
    marginTop: 8,
    color: '#9ca3af',
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