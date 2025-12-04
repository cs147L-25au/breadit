import { router } from 'expo-router';
import { Star, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const breadTypes = ['Sourdough', 'Baguette', 'Focaccia', 'Croissant', 'Ciabatta', 'Rye', 'Brioche', 'Challah'];

export default function AddReviewScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [bakeryName, setBakeryName] = useState('');
  const [breadType, setBreadType] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = () => {
    if (!selectedImage || !bakeryName || !breadType || overallRating === 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    Alert.alert('Success', 'Review posted!');
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={() => setSelectedImage('https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400')}
        style={styles.imageUpload}
      >
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Upload size={48} color="#9ca3af" />
            <Text style={styles.uploadText}>Tap to upload photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Bakery Name</Text>
      <TextInput
        value={bakeryName}
        onChangeText={setBakeryName}
        placeholder="Search for bakery..."
        style={styles.input}
      />

      <Text style={styles.label}>Bread Type</Text>
      <View style={styles.breadTypeContainer}>
        {breadTypes.map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setBreadType(type)}
            style={[
              styles.breadTypeChip,
              breadType === type && styles.breadTypeChipSelected
            ]}
          >
            <Text style={[
              styles.breadTypeText,
              breadType === type && styles.breadTypeTextSelected
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Overall Rating</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(rating => (
          <TouchableOpacity key={rating} onPress={() => setOverallRating(rating)}>
            <Star 
              size={40} 
              fill={rating <= overallRating ? '#f59e0b' : 'transparent'} 
              color="#f59e0b" 
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Review</Text>
      <TextInput
        value={reviewText}
        onChangeText={setReviewText}
        placeholder="Share your thoughts..."
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Post Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  imageUpload: {
    backgroundColor: '#f3f4f6',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    color: '#6b7280',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  breadTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  breadTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  breadTypeChipSelected: {
    backgroundColor: '#d97706',
  },
  breadTypeText: {
    color: '#374151',
  },
  breadTypeTextSelected: {
    color: '#fff',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#d97706',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});