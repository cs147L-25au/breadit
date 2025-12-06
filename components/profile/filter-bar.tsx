import { ChevronDown } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Fonts, Colors } from "../../constants/Styles";

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
        <ChevronDown size={16} color={Colors.text} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.filterButton} onPress={onSortPress}>
        <Text style={styles.filterButtonText}>{sortLabel}</Text>
        <ChevronDown size={16} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
});
