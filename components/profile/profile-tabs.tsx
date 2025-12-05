import { Bookmark, Star } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TabType = 'reviews' | 'saved';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
        onPress={() => onTabChange('reviews')}
      >
        <Star size={18} color={activeTab === 'reviews' ? '#d97706' : '#6b7280'} />
        <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
          My Reviews
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
        onPress={() => onTabChange('saved')}
      >
        <Bookmark size={18} color={activeTab === 'saved' ? '#d97706' : '#6b7280'} />
        <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
          Saved Places
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  activeTab: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#d97706',
  },
});

