import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ReviewWithProfile } from '../../lib/database.types';
import { StarRating } from './star-rating';

interface ReviewCardProps {
  review: ReviewWithProfile;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {review.profiles?.avatar_url ? (
          <Image source={{ uri: review.profiles.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {review.profiles?.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.name}>{review.profiles?.username || 'Anonymous'}</Text>
          <Text style={styles.date}>{formatDate(review.created_at)}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Star size={12} fill="#fff" color="#fff" />
          <Text style={styles.ratingText}>{Number(review.rating_overall).toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.breadTypeBadge}>
        <Text style={styles.breadTypeText}>🍞 {review.bread_type?.replace('_', ' ')}</Text>
      </View>

      {review.image_url && (
        <Image source={{ uri: review.image_url }} style={styles.image} contentFit="cover" />
      )}

      {review.review_text && <Text style={styles.reviewText}>{review.review_text}</Text>}

      <View style={styles.ratingsGrid}>
        {[
          { label: 'Crust', value: review.rating_crust },
          { label: 'Crumb', value: review.rating_crumb },
          { label: 'Flavor', value: review.rating_flavor },
        ].map((item) => (
          <View key={item.label} style={styles.miniRating}>
            <Text style={styles.miniRatingLabel}>{item.label}</Text>
            <StarRating rating={Number(item.value)} size={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292524',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  breadTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  breadTypeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    color: '#44403C',
    lineHeight: 22,
    marginBottom: 12,
  },
  ratingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  miniRating: {
    alignItems: 'center',
  },
  miniRatingLabel: {
    fontSize: 10,
    color: '#78716C',
    marginBottom: 4,
  },
});

