import { Star } from 'lucide-react-native';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const mockUserReviews = [
  {
    id: '3',
    bakeryName: 'Acme Bread Company',
    breadType: 'Focaccia',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1601482441062-b9f13131f33a?w=400',
  },
  {
    id: '4',
    bakeryName: 'Neighbor Bakehouse',
    breadType: 'Croissant',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
  },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=5' }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Alex Johnson</Text>
            <Text style={styles.bio}>Bread enthusiast 🥖</Text>
          </View>
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>27</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.6</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>15</Text>
            <Text style={styles.statLabel}>Bakeries</Text>
          </View>
        </View>
      </View>

      <View style={styles.reviewsSection}>
        <Text style={styles.sectionTitle}>My Reviews</Text>
        
        <FlatList
          data={mockUserReviews}
          numColumns={2}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.reviewImage} />
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewBakery} numberOfLines={1}>
                  {item.bakeryName}
                </Text>
                <Text style={styles.reviewBreadType}>{item.breadType}</Text>
                <View style={styles.reviewRating}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <Text style={styles.reviewRatingText}>{item.rating}</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={item => item.id}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bio: {
    color: '#6b7280',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  reviewsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewImage: {
    width: '100%',
    height: 150,
  },
  reviewInfo: {
    padding: 12,
  },
  reviewBakery: {
    fontWeight: '600',
    fontSize: 14,
  },
  reviewBreadType: {
    color: '#d97706',
    fontSize: 12,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewRatingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
});