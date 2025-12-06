import { router } from "expo-router";
import { Heart, MessageCircle, Plus, Send, Star, X } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { FlatList } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Colors, Fonts } from "../../constants/Styles";

interface Review {
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

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function FeedScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Comments modal state
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  useEffect(() => {
    getCurrentUser();
    loadReviews();
  }, []);

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  }

  async function loadReviews() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          id,
          user_id,
          bread_type,
          rating_overall,
          rating_crust,
          rating_crumb,
          rating_flavor,
          review_text,
          image_url,
          created_at,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          bakeries (
            name,
            address
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get likes and comments counts for each review
      const reviewsWithCounts = await Promise.all(
        (data || []).map(async (review) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("review_id", review.id);

          // Get comments count
          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("review_id", review.id);

          // Check if current user has liked
          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("likes")
              .select("id")
              .eq("review_id", review.id)
              .eq("user_id", user.id)
              .single();
            userHasLiked = !!likeData;
          }

          return {
            ...review,
            profiles: Array.isArray(review.profiles)
              ? review.profiles[0]
              : review.profiles,
            bakeries: Array.isArray(review.bakeries)
              ? review.bakeries[0]
              : review.bakeries,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: userHasLiked,
          };
        })
      );

      setReviews(reviewsWithCounts as Review[]);
    } catch (error) {
      console.error("Error loading reviews:", error);
      Alert.alert("Error", "Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleLike(reviewId: string, currentlyLiked: boolean) {
    if (!currentUserId) {
      Alert.alert("Error", "You must be logged in to like reviews");
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", currentUserId);
      } else {
        // Like
        await supabase.from("likes").insert({
          review_id: reviewId,
          user_id: currentUserId,
        });
      }

      // Update UI optimistically
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                likes_count: currentlyLiked
                  ? review.likes_count - 1
                  : review.likes_count + 1,
                user_has_liked: !currentlyLiked,
              }
            : review
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to update like");
    }
  }

  async function openCommentsModal(reviewId: string) {
    setSelectedReviewId(reviewId);
    setCommentsModalVisible(true);
    loadComments(reviewId);
  }

  async function loadComments(reviewId: string) {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
        id,
        comment_text,
        created_at,
        user_id,
        profiles!comments_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `
        )
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      console.log("Comments data:", data); // Debug log

      const formattedComments = (data || []).map((comment) => ({
        ...comment,
        profiles: Array.isArray(comment.profiles)
          ? comment.profiles[0]
          : comment.profiles,
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim()) return;
    if (!currentUserId || !selectedReviewId) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from("comments").insert({
        review_id: selectedReviewId,
        user_id: currentUserId,
        comment_text: newComment.trim(),
      });

      if (error) throw error;

      // Reload comments
      await loadComments(selectedReviewId);

      // Update comments count in reviews list
      setReviews(
        reviews.map((review) =>
          review.id === selectedReviewId
            ? { ...review, comments_count: review.comments_count + 1 }
            : review
        )
      );

      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadReviews();
  }

  const renderReviewCard = ({ item }: { item: Review }) => (
    <View style={styles.card}>
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
            {item.bread_type.charAt(0).toUpperCase() + item.bread_type.slice(1)}
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id, item.user_has_liked)}
          >
            <Heart
              size={20}
              color={item.user_has_liked ? "#ef4444" : "#6b7280"}
              fill={item.user_has_liked ? "#ef4444" : "transparent"}
            />
            <Text
              style={[
                styles.actionText,
                item.user_has_liked && styles.actionTextLiked,
              ]}
            >
              {item.likes_count}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openCommentsModal(item.id)}
          >
            <MessageCircle size={20} color="#6b7280" />
            <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No reviews yet</Text>
          <Text style={styles.emptyStateText}>
            Be the first to share a bread review!
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push("/add-review")}
          >
            <Text style={styles.emptyStateButtonText}>
              Add Your First Review
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d97706"
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-review")}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {loadingComments ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#d97706" />
            </View>
          ) : (
            <ScrollView style={styles.commentsList}>
              {comments.length === 0 ? (
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>
                    Be the first to comment!
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Image
                      source={{
                        uri:
                          comment.profiles?.avatar_url ||
                          "https://i.pravatar.cc/150?img=2",
                      }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>
                        {comment.profiles?.full_name ||
                          comment.profiles?.username ||
                          "Anonymous"}
                      </Text>
                      <Text style={styles.commentText}>
                        {comment.comment_text}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.textLight}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || submittingComment) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Fonts.semibold,
  },
  listContent: {
    padding: 16,
  },
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 6,
    color: Colors.textLight,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  actionTextLiked: {
    color: Colors.error,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  noComments: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  noCommentsText: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.textLight,
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  commentUsername: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "flex-end",
    backgroundColor: Colors.surface,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
