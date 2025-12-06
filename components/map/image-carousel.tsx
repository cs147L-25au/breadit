import { Image } from "expo-image";
import { MapPin } from "lucide-react-native";
import { useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";

import { Fonts, Colors } from "../../constants/Styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_IMAGE_WIDTH = SCREEN_WIDTH - 52;

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <MapPin size={48} color={Colors.textLighter} />
        <Text style={styles.placeholderText}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / CAROUSEL_IMAGE_WIDTH
          );
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={styles.image}
            contentFit="cover"
          />
        )}
        keyExtractor={(item, index) => `${item}-${index}`}
      />

      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginTop: -16,
    marginLeft: 12,
    marginRight: 12,
  },
  image: {
    width: CAROUSEL_IMAGE_WIDTH,
    height: 280,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  placeholder: {
    height: 200,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
  },
});
