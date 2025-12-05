import { Star } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { formatBreadType, formatDate, UserReview } from './types';

interface ReviewCardProps {
  review: UserReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.reviewCard}>
      {review.image_url ? (
        <Image source={{ uri: review.image_url }} style={styles.reviewImage} />
      ) : (
        <View style={[styles.reviewImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>🍞</Text>
        </View>
      )}
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewBakery} numberOfLines={1}>
            {review.bakeries?.name || 'Unknown Bakery'}
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <Text style={styles.ratingBadgeText}>{review.rating_overall.toFixed(1)}</Text>
          </View>
        </View>
        
        <Text style={styles.breadTypeBadge}>{formatBreadType(review.bread_type)}</Text>
        
        <View style={styles.subRatings}>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingLabel}>Crust</Text>
            <Text style={styles.subRatingValue}>{review.rating_crust}</Text>
          </View>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingLabel}>Crumb</Text>
            <Text style={styles.subRatingValue}>{review.rating_crumb}</Text>
          </View>
          <View style={styles.subRatingItem}>
            <Text style={styles.subRatingLabel}>Flavor</Text>
            <Text style={styles.subRatingValue}>{review.rating_flavor}</Text>
          </View>
        </View>

        {review.review_text && (
          <Text style={styles.reviewText} numberOfLines={2}>
            {review.review_text}
          </Text>
        )}
        
        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
  },
  placeholderText: {
    fontSize: 48,
  },
  reviewContent: {
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewBakery: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#b45309',
  },
  breadTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
    marginBottom: 10,
  },
  subRatings: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  subRatingItem: {
    alignItems: 'center',
  },
  subRatingLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  subRatingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

