import { router } from 'expo-router';
import { Heart, MessageCircle, Plus, Star } from 'lucide-react-native';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const mockReviews = [
  {
    id: '1',
    userName: 'Sarah Chen',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    bakeryName: 'Tartine Bakery',
    breadType: 'Sourdough',
    rating: 4.8,
    crustRating: 5,
    crumbRating: 4.5,
    flavorRating: 5,
    reviewText: 'Absolutely phenomenal sourdough! The crust has that perfect crackling sound.',
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
    likes: 24,
    comments: 5,
    distance: '0.3 miles away'
  },
];

export default function FeedScreen() {
  const renderReviewCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.bakeryName}>{item.bakeryName}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Star size={16} fill="#f59e0b" color="#f59e0b" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      
      <Image source={{ uri: item.imageUrl }} style={styles.breadImage} />
      
      <View style={styles.cardContent}>
        <View style={styles.breadTypeRow}>
          <Text style={styles.breadType}>{item.breadType}</Text>
          <Text style={styles.distance}>{item.distance}</Text>
        </View>
        
        <View style={styles.ratingsRow}>
          <View>
            <Text style={styles.ratingLabel}>Crust</Text>
            <Text style={styles.ratingValue}>{item.crustRating}</Text>
          </View>
          <View>
            <Text style={styles.ratingLabel}>Crumb</Text>
            <Text style={styles.ratingValue}>{item.crumbRating}</Text>
          </View>
          <View>
            <Text style={styles.ratingLabel}>Flavor</Text>
            <Text style={styles.ratingValue}>{item.flavorRating}</Text>
          </View>
        </View>
        
        <Text style={styles.reviewText}>{item.reviewText}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={20} color="#6b7280" />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={20} color="#6b7280" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockReviews}
        renderItem={renderReviewCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-review')}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
  },
  bakeryName: {
    color: '#6b7280',
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 16,
  },
  breadImage: {
    width: '100%',
    height: 300,
  },
  cardContent: {
    padding: 16,
  },
  breadTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breadType: {
    fontWeight: '600',
    fontSize: 16,
    color: '#d97706',
  },
  distance: {
    color: '#6b7280',
    fontSize: 14,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingValue: {
    fontWeight: '600',
  },
  reviewText: {
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});