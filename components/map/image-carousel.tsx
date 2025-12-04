import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_IMAGE_WIDTH = SCREEN_WIDTH - 64;

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (images.length === 0) return;

    let newIndex = currentIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }

    setCurrentIndex(newIndex);
    carouselRef.current?.scrollToIndex({ index: newIndex, animated: true });
  };

  if (images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <MapPin size={48} color="#9CA3AF" />
        <Text style={styles.placeholderText}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={carouselRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_IMAGE_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} contentFit="cover" />
        )}
        keyExtractor={(item, index) => `${item}-${index}`}
      />

      {images.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.nav, styles.navLeft]}
            onPress={() => navigateCarousel('prev')}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nav, styles.navRight]}
            onPress={() => navigateCarousel('next')}
          >
            <ChevronRight size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.dots}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === currentIndex && styles.activeDot]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: CAROUSEL_IMAGE_WIDTH,
    height: 280,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  nav: {
    position: 'absolute',
    top: '50%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  navLeft: {
    left: 24,
  },
  navRight: {
    right: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6D3D1',
  },
  activeDot: {
    backgroundColor: '#D97706',
    width: 24,
  },
  placeholder: {
    height: 200,
    backgroundColor: '#F5F5F4',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});

