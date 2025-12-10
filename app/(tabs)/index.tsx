import { router } from "expo-router";
import { Plus, Send, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import {
  GemAnimation,
  PointsDisplay,
} from "../../components/animations/GemAnimation";
import { BreaditText } from "../../components/BreaditText";
import FeedCard, { Review } from "../../components/feed/FeedCard";
import { Colors, Fonts } from "../../constants/Styles";
import { supabase } from "../../lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Points configuration
const POINTS = {
  POST_REVIEW: 10,
  COMMENT: 5,
};

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

interface GemAnimationState {
  visible: boolean;
  fromPosition: { x: number; y: number };
  pointsAwarded: number;
}

export default function FeedScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState(0);

  // Points display position for animation target
  const [pointsDisplayPosition, setPointsDisplayPosition] = useState({
    x: SCREEN_WIDTH - 60,
    y: 70,
  });

  // Gem animation state
  const [gemAnimation, setGemAnimation] = useState<GemAnimationState>({
    visible: false,
    fromPosition: { x: 0, y: 0 },
    pointsAwarded: 0,
  });

  // Comments modal state
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Comment button position ref for animation
  const commentButtonPositionRef = useRef<{ x: number; y: number } | null>(
    null
  );

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

    if (user) {
      // Load user's points
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserPoints(profile.points || 0);
      }
    }
  }

  // Function to award points and trigger gem animation
  const awardPoints = useCallback(
    async (
      points: number,
      fromPosition: { x: number; y: number }
    ): Promise<boolean> => {
      if (!currentUserId) return false;

      try {
        // Update points in database
        const { error } = await supabase.rpc("increment_user_points", {
          user_id_input: currentUserId,
          points_to_add: points,
        });

        // If RPC doesn't exist, fall back to direct update
        if (error) {
          const { data: currentProfile } = await supabase
            .from("profiles")
            .select("points")
            .eq("id", currentUserId)
            .single();

          const currentPoints = currentProfile?.points || 0;

          await supabase
            .from("profiles")
            .update({ points: currentPoints + points })
            .eq("id", currentUserId);
        }

        // Trigger gem animation
        setGemAnimation({
          visible: true,
          fromPosition,
          pointsAwarded: points,
        });

        // Update local state after animation starts
        setUserPoints((prev) => prev + points);

        return true;
      } catch (err) {
        console.error("Error awarding points:", err);
        return false;
      }
    },
    [currentUserId]
  );

  const handleGemAnimationComplete = useCallback(() => {
    setGemAnimation((prev) => ({ ...prev, visible: false }));
  }, []);

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
        await supabase
          .from("likes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", currentUserId);
      } else {
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

    // Find the review to check if commenting on own post
    const review = reviews.find((r) => r.id === selectedReviewId);
    const isOwnPost = review?.user_id === currentUserId;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from("comments").insert({
        review_id: selectedReviewId,
        user_id: currentUserId,
        comment_text: newComment.trim(),
      });

      if (error) throw error;

      await loadComments(selectedReviewId);

      setReviews(
        reviews.map((review) =>
          review.id === selectedReviewId
            ? { ...review, comments_count: review.comments_count + 1 }
            : review
        )
      );

      setNewComment("");

      // Award points for commenting on other people's posts
      if (!isOwnPost) {
        // Use a position near the send button for the animation
        const fromPosition = {
          x: SCREEN_WIDTH - 60,
          y: Dimensions.get("window").height - 100,
        };
        await awardPoints(POINTS.COMMENT, fromPosition);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    getCurrentUser(); // Refresh points too
    loadReviews();
  }

  const handlePointsDisplayLayout = useCallback(
    (position: { x: number; y: number }) => {
      setPointsDisplayPosition(position);
    },
    []
  );

  const renderReviewCard = ({
    item,
    index,
  }: {
    item: Review;
    index: number;
  }) => (
    <FeedCard
      item={item}
      index={index}
      onLike={handleLike}
      onComment={openCommentsModal}
    />
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
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <BreaditText width={100} color={Colors.primary} />
          <PointsDisplay
            points={userPoints}
            onLayout={handlePointsDisplayLayout}
          />
        </View>
      </Animated.View>

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
        <Animated.FlatList
          data={reviews}
          renderItem={renderReviewCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingTop: 104 }]}
          contentInsetAdjustmentBehavior="never"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              progressViewOffset={90}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-review")}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Gem Animation Overlay */}
      {gemAnimation.visible && (
        <GemAnimation
          fromPosition={gemAnimation.fromPosition}
          toPosition={pointsDisplayPosition}
          gemCount={6}
          pointsAwarded={gemAnimation.pointsAwarded}
          onAnimationComplete={handleGemAnimationComplete}
        />
      )}

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
              <ActivityIndicator size="large" color={Colors.primary} />
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
                    {comment.profiles?.avatar_url ? (
                      <Image
                        source={{ uri: comment.profiles.avatar_url }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarPlaceholder,
                          {
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            marginRight: 12,
                          },
                        ]}
                      >
                        <Text style={[styles.avatarInitial, { fontSize: 14 }]}>
                          {comment.profiles?.username?.[0]?.toUpperCase() ||
                            "?"}
                        </Text>
                      </View>
                    )}
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

          {/* Points indicator in modal */}
          <View style={styles.modalPointsHint}>
            <Text style={styles.modalPointsHintText}>
              🍞 Earn {POINTS.COMMENT} points for commenting on others' posts!
            </Text>
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
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 0,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 120,
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
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
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
  modalPointsHint: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  modalPointsHintText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textLight,
    textAlign: "center",
  },
});
