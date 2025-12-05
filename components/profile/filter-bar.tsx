import { ChevronDown } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterBarProps {
  breadTypeLabel: string;
  sortLabel: string;
  onBreadTypePress: () => void;
  onSortPress: () => void;
}

export function FilterBar({
  breadTypeLabel,
  sortLabel,
  onBreadTypePress,
  onSortPress,
}: FilterBarProps) {
  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity style={styles.filterButton} onPress={onBreadTypePress}>
        <Text style={styles.filterButtonText}>{breadTypeLabel}</Text>
        <ChevronDown size={16} color="#374151" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton} onPress={onSortPress}>
        <Text style={styles.filterButtonText}>{sortLabel}</Text>
        <ChevronDown size={16} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});

