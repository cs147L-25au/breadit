import { Bookmark, MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatDate, SavedPlace } from './types';

interface SavedPlaceCardProps {
  place: SavedPlace;
}

export function SavedPlaceCard({ place }: SavedPlaceCardProps) {
  return (
    <View style={styles.savedCard}>
      <View style={styles.savedIconContainer}>
        <MapPin size={24} color="#d97706" />
      </View>
      <View style={styles.savedContent}>
        <Text style={styles.savedName}>{place.bakeries?.name || 'Unknown Bakery'}</Text>
        <Text style={styles.savedAddress} numberOfLines={2}>
          {place.bakeries?.address || 'No address available'}
        </Text>
        <Text style={styles.savedDate}>Saved {formatDate(place.created_at)}</Text>
      </View>
      <Bookmark size={20} fill="#d97706" color="#d97706" />
    </View>
  );
}

const styles = StyleSheet.create({
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  savedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedContent: {
    flex: 1,
  },
  savedName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 2,
  },
  savedAddress: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  savedDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
});

