import { Bookmark, MapPin, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BakeryWithReviews, ReviewWithProfile } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";
import { ImageCarousel } from "./image-carousel";
import { ReviewCard } from "./review-card";
import { StarRating } from "./star-rating";
import { Fonts, Colors } from "../../constants/Styles";

interface BakeryDetailsModalProps {
  bakery: BakeryWithReviews | null;
  visible: boolean;
  onClose: () => void;
}

function getImages(bakery: BakeryWithReviews): string[] {
  return bakery.reviews
    .filter((r) => r.image_url)
    .map((r) => r.image_url as string);
}

export function BakeryDetailsModal({
  bakery,
  visible,
  onClose,
}: BakeryDetailsModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && bakery) {
      getCurrentUser();
    }
  }, [visible, bakery]);

  useEffect(() => {
    if (userId && bakery) {
      checkIfSaved();
    }
  }, [userId, bakery]);

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  }

  async function checkIfSaved() {
    if (!userId || !bakery) return;

    const { data } = await supabase
      .from("saved")
      .select("id")
      .eq("user", userId)
      .eq("bakery", bakery.id)
      .maybeSingle();

    setIsSaved(!!data);
  }

  async function toggleSave() {
    if (!userId || !bakery || isSaving) return;

    setIsSaving(true);

    try {
      if (isSaved) {
        await supabase
          .from("saved")
          .delete()
          .eq("user", userId)
          .eq("bakery", bakery.id);

        setIsSaved(false);
      } else {
        const insertData: { user: string; bakery: string } = {
          user: userId,
          bakery: bakery.id,
        };
        const { error } = await supabase
          .from("saved")
          .insert(insertData as any);
        if (error) throw error;
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    } finally {
      setIsSaving(false);
    }
  }

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
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {bakery.name}
          </Text>
          <TouchableOpacity
            onPress={toggleSave}
            style={styles.iconButton}
            disabled={isSaving || !userId}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Bookmark
                size={24}
                color={isSaved ? Colors.primary : Colors.text}
                fill={isSaved ? Colors.primary : "transparent"}
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Carousel */}
          <ImageCarousel images={images} />

          {/* Rating Summary */}
          <RatingSummary bakery={bakery} />

          {/* Address */}
          <View style={styles.addressContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.addressText}>{bakery.address}</Text>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsSectionTitle}>Reviews</Text>
            {bakery.reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to review!
              </Text>
            ) : (
              bakery.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
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
          {bakery.averageRating > 0 ? bakery.averageRating.toFixed(1) : "–"}
        </Text>
        <StarRating rating={bakery.averageRating} />
        <Text style={styles.reviewCountText}>
          {bakery.reviews.length} review{bakery.reviews.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Rating Breakdown */}
      {bakery.reviews.length > 0 && (
        <View style={styles.ratingBreakdown}>
          {["Crust", "Crumb", "Flavor"].map((category) => {
            const key =
              `rating_${category.toLowerCase()}` as keyof ReviewWithProfile;
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
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  ratingSummary: {
    padding: 20,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  overallRating: {
    alignItems: "center",
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  overallRatingNumber: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  reviewCountText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  ratingBreakdown: {
    flex: 1,
    paddingLeft: 24,
    justifyContent: "center",
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownLabel: {
    width: 50,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textLight,
  },
  breakdownValue: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  reviewsSection: {
    padding: 20,
  },
  reviewsSectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  noReviewsText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
    textAlign: "center",
    paddingVertical: 32,
  },
});
