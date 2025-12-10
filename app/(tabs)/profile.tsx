import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  BREAD_TYPES,
  EmptyState,
  FilterBar,
  FilterModal,
  formatBreadType,
  ProfileHeader,
  ProfileTabs,
  ReviewCard,
  SavedPlaceCard,
  type SavedPlace,
  type SortOption,
  type TabType,
  type UserProfile,
  type UserReview,
} from "../../components/profile";
import { BreadType } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";
import { Fonts, Colors } from "../../constants/Styles";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  // Filter & sort state
  const [selectedBreadType, setSelectedBreadType] = useState<BreadType | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showBreadFilter, setShowBreadFilter] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }

  async function loadUserData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load user's reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(
          `
          id,
          bread_type,
          rating_overall,
          rating_crust,
          rating_crumb,
          rating_flavor,
          review_text,
          image_url,
          created_at,
          bakeries (
            id,
            name,
            address
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (reviewsData) {
        const formattedReviews = reviewsData.map((review) => ({
          ...review,
          bakeries: Array.isArray(review.bakeries) ? review.bakeries[0] : review.bakeries,
        }));
        setReviews(formattedReviews as UserReview[]);
      }

      // Load saved places
      const { data: savedData } = await supabase
        .from("saved")
        .select(
          `
          id,
          created_at,
          bakeries:bakery (
            id,
            name,
            address,
            latitude,
            longitude
          )
        `
        )
        .eq("user", user.id)
        .order("created_at", { ascending: false });

      if (savedData) {
        setSavedPlaces(savedData as unknown as SavedPlace[]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(
      (review) =>
        selectedBreadType === "all" || review.bread_type === selectedBreadType
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "highest":
          return b.rating_overall - a.rating_overall;
        case "lowest":
          return a.rating_overall - b.rating_overall;
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  // Calculate stats
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const uniqueBakeries = new Set(reviews.map((r) => r.bakeries?.id)).size;

  // Filter options
  const breadTypeOptions = BREAD_TYPES.map((type) => ({
    value: type,
    label: type === "all" ? "All Types" : formatBreadType(type),
  }));

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
  ];

  const breadTypeLabel =
    selectedBreadType === "all"
      ? "All Types"
      : formatBreadType(selectedBreadType);
  const sortLabel =
    sortBy === "newest"
      ? "Newest"
      : sortBy === "highest"
      ? "Highest Rated"
      : "Lowest Rated";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfileHeader
        profile={profile}
        reviewCount={reviews.length}
        avgRating={avgRating}
        uniqueBakeries={uniqueBakeries}
        savedCount={savedPlaces.length}
        onLogout={handleLogout}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "reviews" && (
        <>
          <FilterBar
            breadTypeLabel={breadTypeLabel}
            sortLabel={sortLabel}
            onBreadTypePress={() => setShowBreadFilter(true)}
            onSortPress={() => setShowSortOptions(true)}
          />

          {filteredReviews.length === 0 ? (
            <EmptyState
              icon="🍞"
              title={
                selectedBreadType === "all"
                  ? "No reviews yet"
                  : `No ${formatBreadType(selectedBreadType)} reviews`
              }
              message="Start reviewing bread to build your collection!"
            />
          ) : (
            <FlatList
              data={filteredReviews}
              renderItem={({ item }) => <ReviewCard review={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#d97706"
                  colors={["#d97706"]}
                />
              }
            />
          )}
        </>
      )}

      {activeTab === "saved" && (
        <>
          {savedPlaces.length === 0 ? (
            <EmptyState
              icon="📍"
              title="No saved places yet"
              message="Save bakeries from the map to find them easily later!"
            />
          ) : (
            <FlatList
              data={savedPlaces}
              renderItem={({ item }) => <SavedPlaceCard place={item} />}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#d97706"
                  colors={["#d97706"]}
                />
              }
            />
          )}
        </>
      )}

      <FilterModal
        visible={showBreadFilter}
        title="Filter by Bread Type"
        options={breadTypeOptions}
        selectedValue={selectedBreadType}
        onSelect={setSelectedBreadType}
        onClose={() => setShowBreadFilter(false)}
      />

      <FilterModal
        visible={showSortOptions}
        title="Sort By"
        options={sortOptions}
        selectedValue={sortBy}
        onSelect={setSortBy}
        onClose={() => setShowSortOptions(false)}
      />
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
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
});
