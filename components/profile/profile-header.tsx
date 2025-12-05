import { Image, StyleSheet, Text, View } from 'react-native';
import { UserProfile } from './types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  reviewCount: number;
  avgRating: string;
  uniqueBakeries: number;
  savedCount: number;
}

export function ProfileHeader({
  profile,
  reviewCount,
  avgRating,
  uniqueBakeries,
  savedCount,
}: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150?img=5' }} 
          style={styles.avatar} 
        />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {profile?.full_name || profile?.username || 'Bread Lover'}
          </Text>
          <Text style={styles.bio}>@{profile?.username || 'anonymous'}</Text>
        </View>
      </View>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{reviewCount}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgRating}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{uniqueBakeries}</Text>
          <Text style={styles.statLabel}>Bakeries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fed7aa',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.3,
  },
  bio: {
    color: '#9ca3af',
    marginTop: 2,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});

