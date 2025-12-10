import { Star } from "lucide-react-native";
import React, { memo, useCallback } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Reanimated, { FadeInDown } from "react-native-reanimated";
import CommentButton from "../../components/feed/CommentButton";
import LikeButton from "../../components/feed/LikeButton";
import { Colors, Fonts } from "../../constants/Styles";

export interface Review {
  id: string;
  user_id: string;
  bread_type: string;
  rating_overall: number;
  rating_crust: number | null;
  rating_crumb: number | null;
  rating_flavor: number | null;
  review_text: string | null;
  image_url: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  bakeries: {
    name: string;
    address: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

interface FeedCardProps {
  item: Review;
  index: number;
  onLike: (reviewId: string, currentlyLiked: boolean) => void;
  onComment: (reviewId: string) => void;
}

function formatBreadType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function FeedCard({
  item,
  index,
  onLike,
  onComment,
}: FeedCardProps) {
  // Memoize callbacks to prevent unnecessary re-renders of child components
  const handleLike = useCallback(() => {
    onLike(item.id, item.user_has_liked);
  }, [item.id, item.user_has_liked, onLike]);

  const handleComment = useCallback(() => {
    onComment(item.id);
  }, [item.id, onComment]);

  return (
    <Reanimated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          {item.profiles?.avatar_url ? (
            <Image
              source={{ uri: item.profiles.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.profiles?.username?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View style={styles.userTextInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.profiles?.full_name ||
                item.profiles?.username ||
                "Anonymous"}
            </Text>
            <Text style={styles.bakeryName} numberOfLines={1}>
              {item.bakeries?.name}
            </Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Star size={16} fill="#f59e0b" color="#f59e0b" />
          <Text style={styles.ratingText}>
            {item.rating_overall.toFixed(1)}
          </Text>
        </View>
      </View>

      <Image source={{ uri: item.image_url }} style={styles.breadImage} />

      <View style={styles.cardContent}>
        <View style={styles.breadTypeRow}>
          <Text style={styles.breadType}>
            {formatBreadType(item.bread_type)}
          </Text>
        </View>

        {(item.rating_crust || item.rating_crumb || item.rating_flavor) && (
          <View style={styles.ratingsRow}>
            {item.rating_crust && (
              <View>
                <Text style={styles.ratingLabel}>Crust</Text>
                <Text style={styles.ratingValue}>
                  {item.rating_crust.toFixed(1)}
                </Text>
              </View>
            )}
            {item.rating_crumb && (
              <View>
                <Text style={styles.ratingLabel}>Crumb</Text>
                <Text style={styles.ratingValue}>
                  {item.rating_crumb.toFixed(1)}
                </Text>
              </View>
            )}
            {item.rating_flavor && (
              <View>
                <Text style={styles.ratingLabel}>Flavor</Text>
                <Text style={styles.ratingValue}>
                  {item.rating_flavor.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {item.review_text && (
          <Text style={styles.reviewText} numberOfLines={3}>
            {item.review_text}
          </Text>
        )}

        <View style={styles.actions}>
          <LikeButton
            isLiked={item.user_has_liked}
            likesCount={item.likes_count}
            onPress={handleLike}
          />
          <CommentButton
            commentsCount={item.comments_count}
            onPress={handleComment}
          />
        </View>
      </View>
    </Reanimated.View>
  );
}

// Custom comparison function for memo - only re-render if relevant data changes
function arePropsEqual(prevProps: FeedCardProps, nextProps: FeedCardProps) {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.likes_count === nextProps.item.likes_count &&
    prevProps.item.comments_count === nextProps.item.comments_count &&
    prevProps.item.user_has_liked === nextProps.item.user_has_liked &&
    prevProps.index === nextProps.index
  );
}

export default memo(FeedCard, arePropsEqual);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  userTextInfo: {
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitial: {
    color: Colors.primary,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  userName: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.text,
  },
  bakeryName: {
    color: Colors.textLight,
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.primary,
  },
  breadImage: {
    width: "100%",
    height: 300,
    backgroundColor: Colors.borderLight,
  },
  cardContent: {
    padding: 16,
  },
  breadTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  breadType: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.primary,
  },
  ratingsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  ratingValue: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  reviewText: {
    color: Colors.text,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    marginTop: 4,
    gap: 24,
  },
});
