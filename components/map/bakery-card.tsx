import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BakeryWithReviews } from '../../lib/database.types';

interface BakeryCardProps {
  bakery: BakeryWithReviews;
  isSelected: boolean;
  onPress: (bakery: BakeryWithReviews) => void;
}

export function BakeryCard({ bakery, isSelected, onPress }: BakeryCardProps) {
  const firstImage = bakery.reviews.find((r) => r.image_url)?.image_url;

  return (
    <TouchableOpacity
      onPress={() => onPress(bakery)}
      style={[styles.card, isSelected && styles.selectedCard]}
    >
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MapPin size={24} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {bakery.name}
        </Text>
        <View style={styles.ratingRow}>
          <Star size={12} fill="#D97706" color="#D97706" />
          <Text style={styles.ratingText}>
            {bakery.averageRating > 0 ? bakery.averageRating.toFixed(1) : 'No ratings'}
          </Text>
          <Text style={styles.reviewCount}>({bakery.reviews.length})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginLeft: 12,
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  image: {
    width: '100%',
    height: 100,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#E7E5E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292524',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
  },
  reviewCount: {
    fontSize: 12,
    color: '#A8A29E',
  },
});

