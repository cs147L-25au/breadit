import { MapPin, X } from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BakeryWithReviews, ReviewWithProfile } from '../../lib/database.types';
import { ImageCarousel } from './image-carousel';
import { ReviewCard } from './review-card';
import { StarRating } from './star-rating';

interface BakeryDetailsModalProps {
  bakery: BakeryWithReviews | null;
  visible: boolean;
  onClose: () => void;
}

function getImages(bakery: BakeryWithReviews): string[] {
  return bakery.reviews.filter((r) => r.image_url).map((r) => r.image_url as string);
}

export function BakeryDetailsModal({ bakery, visible, onClose }: BakeryDetailsModalProps) {
  if (!bakery) return null;

  const images = getImages(bakery);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {bakery.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Carousel */}
          <ImageCarousel images={images} />

          {/* Rating Summary */}
          <RatingSummary bakery={bakery} />

          {/* Address */}
          <View style={styles.addressContainer}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.addressText}>{bakery.address}</Text>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsSectionTitle}>Reviews</Text>
            {bakery.reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            ) : (
              bakery.reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

interface RatingSummaryProps {
  bakery: BakeryWithReviews;
}

function RatingSummary({ bakery }: RatingSummaryProps) {
  return (
    <View style={styles.ratingSummary}>
      <View style={styles.overallRating}>
        <Text style={styles.overallRatingNumber}>
          {bakery.averageRating > 0 ? bakery.averageRating.toFixed(1) : '–'}
        </Text>
        <StarRating rating={bakery.averageRating} />
        <Text style={styles.reviewCountText}>
          {bakery.reviews.length} review{bakery.reviews.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Rating Breakdown */}
      {bakery.reviews.length > 0 && (
        <View style={styles.ratingBreakdown}>
          {['Crust', 'Crumb', 'Flavor'].map((category) => {
            const key = `rating_${category.toLowerCase()}` as keyof ReviewWithProfile;
            const avg =
              bakery.reviews.reduce((sum, r) => sum + Number(r[key] || 0), 0) /
              bakery.reviews.length;
            return (
              <View key={category} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{category}</Text>
                <StarRating rating={avg} size={12} />
                <Text style={styles.breakdownValue}>{avg.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292524',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  ratingSummary: {
    padding: 20,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
  },
  overallRating: {
    alignItems: 'center',
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: '#E7E5E4',
  },
  overallRatingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#292524',
  },
  reviewCountText: {
    marginTop: 4,
    fontSize: 12,
    color: '#78716C',
  },
  ratingBreakdown: {
    flex: 1,
    paddingLeft: 24,
    justifyContent: 'center',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    width: 50,
    fontSize: 12,
    color: '#78716C',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#292524',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  reviewsSection: {
    padding: 20,
  },
  reviewsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#292524',
    marginBottom: 16,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 32,
  },
});

