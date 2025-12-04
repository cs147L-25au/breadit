import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, MapPin, Star, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { BakeryWithReviews, ReviewWithProfile } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_IMAGE_WIDTH = SCREEN_WIDTH - 64;

export default function MapScreen() {
  const [bakeries, setBakeries] = useState<BakeryWithReviews[]>([]);
  const [selectedBakery, setSelectedBakery] = useState<BakeryWithReviews | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<FlatList>(null);

  const fetchBakeries = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: bakeriesData, error: bakeriesError } = await supabase
        .from('bakeries')
        .select(`
          *,
          reviews (
            *,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (bakeriesError) throw bakeriesError;
      const bakeriesWithRatings: BakeryWithReviews[] = (bakeriesData || []).map((bakery: any) => {
        const reviews = (bakery.reviews || []) as ReviewWithProfile[];
        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + Number(r.rating_overall), 0) / reviews.length
            : 0;

        return {
          id: bakery.id,
          name: bakery.name,
          address: bakery.address,
          latitude: bakery.latitude,
          longitude: bakery.longitude,
          google_place_id: bakery.google_place_id,
          created_at: bakery.created_at,
          reviews,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      });

      setBakeries(bakeriesWithRatings);
    } catch (err) {
      console.log("ERROR FETCHING BAKERIES", err);
      setError('Failed to load bakeries. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBakeries();
  }, []);

  const handleMarkerPress = (bakery: BakeryWithReviews) => {
    setSelectedBakery(bakery);
    setShowDetails(true);
    setCurrentImageIndex(0);
  };

  const handleBakeryListPress = (bakery: BakeryWithReviews) => {
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
    setCurrentImageIndex(0);
  };

  const getImages = (bakery: BakeryWithReviews): string[] => {
    return bakery.reviews
      .filter((r) => r.image_url)
      .map((r) => r.image_url as string);
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (!selectedBakery) return;
    const images = getImages(selectedBakery);
    if (images.length === 0) return;

    let newIndex = currentImageIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    } else {
      newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    }

    setCurrentImageIndex(newIndex);
    carouselRef.current?.scrollToIndex({ index: newIndex, animated: true });
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} size={size} fill="#D97706" color="#D97706" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <View key={i} style={{ position: 'relative' }}>
            <Star size={size} color="#D97706" />
            <View style={{ position: 'absolute', overflow: 'hidden', width: size / 2 }}>
              <Star size={size} fill="#D97706" color="#D97706" />
            </View>
          </View>
        );
      } else {
        stars.push(
          <Star key={i} size={size} color="#D97706" />
        );
      }
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Finding bakeries near you...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBakeries}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
      >
        {bakeries.map((bakery) => (
          <Marker
            key={bakery.id}
            coordinate={{
              latitude: Number(bakery.latitude),
              longitude: Number(bakery.longitude),
            }}
            onPress={() => handleMarkerPress(bakery)}
          >
            <View style={styles.customMarker}>
              <View style={styles.markerBubble}>
                <Text style={styles.markerRating}>
                  {bakery.averageRating > 0 ? bakery.averageRating.toFixed(1) : '–'}
                </Text>
                <Star size={10} fill="#fff" color="#fff" />
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Bakery List */}
      <View style={styles.bakeryList}>
        <Text style={styles.listTitle}>
          {bakeries.length > 0 ? `${bakeries.length} Bakeries Found` : 'No Bakeries Found'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bakeries.map((bakery) => (
            <TouchableOpacity
              key={bakery.id}
              onPress={() => handleBakeryListPress(bakery)}
              style={[
                styles.bakeryCard,
                selectedBakery?.id === bakery.id && styles.selectedCard,
              ]}
            >
              {getImages(bakery).length > 0 ? (
                <Image
                  source={{ uri: getImages(bakery)[0] }}
                  style={styles.bakeryCardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.bakeryCardImagePlaceholder}>
                  <MapPin size={24} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.bakeryCardContent}>
                <Text style={styles.bakeryName} numberOfLines={1}>
                  {bakery.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Star size={12} fill="#D97706" color="#D97706" />
                  <Text style={styles.ratingText}>
                    {bakery.averageRating > 0 ? bakery.averageRating.toFixed(1) : 'No ratings'}
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({bakery.reviews.length})
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bakery Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetails}
      >
        {selectedBakery && (
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeDetails} style={styles.closeButton}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedBakery.name}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Image Carousel */}
              {getImages(selectedBakery).length > 0 ? (
                <View style={styles.carouselContainer}>
                  <FlatList
                    ref={carouselRef}
                    data={getImages(selectedBakery)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(
                        e.nativeEvent.contentOffset.x / CAROUSEL_IMAGE_WIDTH
                      );
                      setCurrentImageIndex(index);
                    }}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: item }}
                        style={styles.carouselImage}
                        contentFit="cover"
                      />
                    )}
                    keyExtractor={(item, index) => `${item}-${index}`}
                  />
                  
                  {/* Carousel Navigation */}
                  {getImages(selectedBakery).length > 1 && (
                    <>
                      <TouchableOpacity
                        style={[styles.carouselNav, styles.carouselNavLeft]}
                        onPress={() => navigateCarousel('prev')}
                      >
                        <ChevronLeft size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.carouselNav, styles.carouselNavRight]}
                        onPress={() => navigateCarousel('next')}
                      >
                        <ChevronRight size={24} color="#fff" />
                      </TouchableOpacity>
                      
                      {/* Pagination Dots */}
                      <View style={styles.paginationDots}>
                        {getImages(selectedBakery).map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.dot,
                              index === currentImageIndex && styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.noImagesPlaceholder}>
                  <MapPin size={48} color="#9CA3AF" />
                  <Text style={styles.noImagesText}>No photos yet</Text>
                </View>
              )}

              {/* Rating Summary */}
              <View style={styles.ratingSummary}>
                <View style={styles.overallRating}>
                  <Text style={styles.overallRatingNumber}>
                    {selectedBakery.averageRating > 0
                      ? selectedBakery.averageRating.toFixed(1)
                      : '–'}
                  </Text>
                  <View style={styles.starsContainer}>
                    {renderStars(selectedBakery.averageRating)}
                  </View>
                  <Text style={styles.reviewCountText}>
                    {selectedBakery.reviews.length} review
                    {selectedBakery.reviews.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Rating Breakdown */}
                {selectedBakery.reviews.length > 0 && (
                  <View style={styles.ratingBreakdown}>
                    {['Crust', 'Crumb', 'Flavor'].map((category) => {
                      const key = `rating_${category.toLowerCase()}` as keyof ReviewWithProfile;
                      const avg =
                        selectedBakery.reviews.reduce(
                          (sum, r) => sum + Number(r[key] || 0),
                          0
                        ) / selectedBakery.reviews.length;
                      return (
                        <View key={category} style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>{category}</Text>
                          <View style={styles.breakdownStars}>
                            {renderStars(avg, 12)}
                          </View>
                          <Text style={styles.breakdownValue}>{avg.toFixed(1)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Address */}
              <View style={styles.addressContainer}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.addressText}>{selectedBakery.address}</Text>
              </View>

              {/* Reviews List */}
              <View style={styles.reviewsSection}>
                <Text style={styles.reviewsSectionTitle}>Reviews</Text>
                {selectedBakery.reviews.length === 0 ? (
                  <Text style={styles.noReviewsText}>
                    No reviews yet. Be the first to review!
                  </Text>
                ) : (
                  selectedBakery.reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        {review.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: review.profiles.avatar_url }}
                            style={styles.reviewerAvatar}
                          />
                        ) : (
                          <View style={styles.reviewerAvatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                              {review.profiles?.username?.[0]?.toUpperCase() || '?'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reviewHeaderText}>
                          <Text style={styles.reviewerName}>
                            {review.profiles?.username || 'Anonymous'}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {formatDate(review.created_at)}
                          </Text>
                        </View>
                        <View style={styles.reviewRatingBadge}>
                          <Star size={12} fill="#fff" color="#fff" />
                          <Text style={styles.reviewRatingText}>
                            {Number(review.rating_overall).toFixed(1)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.breadTypeBadge}>
                        <Text style={styles.breadTypeText}>
                          🍞 {review.bread_type?.replace('_', ' ')}
                        </Text>
                      </View>

                      {review.image_url && (
                        <Image
                          source={{ uri: review.image_url }}
                          style={styles.reviewImage}
                          contentFit="cover"
                        />
                      )}

                      {review.review_text && (
                        <Text style={styles.reviewText}>{review.review_text}</Text>
                      )}

                      <View style={styles.reviewRatingsGrid}>
                        {[
                          { label: 'Crust', value: review.rating_crust },
                          { label: 'Crumb', value: review.rating_crumb },
                          { label: 'Flavor', value: review.rating_flavor },
                        ].map((item) => (
                          <View key={item.label} style={styles.miniRating}>
                            <Text style={styles.miniRatingLabel}>{item.label}</Text>
                            <View style={styles.miniRatingStars}>
                              {renderStars(Number(item.value), 10)}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6E9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF6E9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#78716C',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF6E9',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
  },
  markerBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
  },
  markerRating: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#D97706',
    marginTop: -1,
  },
  bakeryList: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292524',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  bakeryCard: {
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
  bakeryCardImage: {
    width: '100%',
    height: 100,
  },
  bakeryCardImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#E7E5E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bakeryCardContent: {
    padding: 12,
  },
  bakeryName: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292524',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselImage: {
    width: CAROUSEL_IMAGE_WIDTH,
    height: 280,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  carouselNav: {
    position: 'absolute',
    top: '50%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  carouselNavLeft: {
    left: 24,
  },
  carouselNavRight: {
    right: 24,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6D3D1',
  },
  activeDot: {
    backgroundColor: '#D97706',
    width: 24,
  },
  noImagesPlaceholder: {
    height: 200,
    backgroundColor: '#F5F5F4',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
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
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
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
  breakdownStars: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 8,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#292524',
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
  reviewCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerAvatarPlaceholder: {
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
  reviewHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292524',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewRatingText: {
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
  reviewImage: {
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
  reviewRatingsGrid: {
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
  miniRatingStars: {
    flexDirection: 'row',
    gap: 1,
  },
});
