import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { Star, X, Plus } from "lucide-react-native";

const BREAD_TYPES = [
  "sourdough",
  "baguette",
  "focaccia",
  "croissant",
  "ciabatta",
  "rye",
  "whole_wheat",
  "brioche",
  "challah",
  "bagel",
  "other",
];

const GOOGLE_PLACES_API_KEY = "AIzaSyBWbqfhJwGvV-jGVbAeb3gPLBSh8HK2OUY";

interface BakeryResult {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function AddReviewScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [bakeryName, setBakeryName] = useState("");
  const [bakeryAddress, setBakeryAddress] = useState("");
  const [bakeryCoordinates, setBakeryCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [breadType, setBreadType] = useState("sourdough");
  const [showBreadTypes, setShowBreadTypes] = useState(false);
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingCrust, setRatingCrust] = useState(5);
  const [ratingCrumb, setRatingCrumb] = useState(5);
  const [ratingFlavor, setRatingFlavor] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bakery search state
  const [showBakerySearch, setShowBakerySearch] = useState(false);
  const [bakerySearchQuery, setBakerySearchQuery] = useState("");
  const [bakeryResults, setBakeryResults] = useState<BakeryResult[]>([]);
  const [searchingBakeries, setSearchingBakeries] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Manual bakery entry
  const [showManualBakery, setShowManualBakery] = useState(false);
  const [manualBakeryName, setManualBakeryName] = useState("");
  const [manualBakeryAddress, setManualBakeryAddress] = useState("");

  async function searchBakeries(query: string) {
    if (!query.trim() || query.length < 3) {
      setBakeryResults([]);
      return;
    }

    setSearchingBakeries(true);
    try {
      // Using Google Places API Text Search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query + " bakery"
        )}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.results) {
        const formatted: BakeryResult[] = data.results
          .slice(0, 10)
          .map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }));
        setBakeryResults(formatted);
      }
    } catch (error) {
      console.error("Error searching bakeries:", error);
    } finally {
      setSearchingBakeries(false);
    }
  }

  function handleBakerySearchChange(text: string) {
    setBakerySearchQuery(text);

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchBakeries(text);
    }, 500);
  }

  function selectBakery(bakery: BakeryResult) {
    setBakeryName(bakery.name);
    setBakeryAddress(bakery.address);
    setBakeryCoordinates({ lat: bakery.latitude, lng: bakery.longitude });
    setShowBakerySearch(false);
    setBakerySearchQuery("");
    setBakeryResults([]);
  }

  function handleManualBakerySubmit() {
    if (!manualBakeryName.trim()) {
      Alert.alert("Error", "Please enter a bakery name");
      return;
    }
    if (!manualBakeryAddress.trim()) {
      Alert.alert("Error", "Please enter a bakery address");
      return;
    }

    setBakeryName(manualBakeryName);
    setBakeryAddress(manualBakeryAddress);
    setBakeryCoordinates(null); // Will use default coordinates
    setShowManualBakery(false);
    setManualBakeryName("");
    setManualBakeryAddress("");
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera roll permissions to upload photos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera permissions to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const response = await fetch(uri);
    const blob = await response.blob();

    const fileExt = uri.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("bread-images")
      .upload(filePath, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("bread-images").getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit() {
    if (!image) {
      Alert.alert("Missing photo", "Please add a photo of the bread");
      return;
    }
    if (!bakeryName.trim()) {
      Alert.alert("Missing bakery", "Please select or add a bakery");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("Uploading image...");
      const imageUrl = await uploadImage(image);
      console.log("Image uploaded:", imageUrl);

      const { data: existingBakery } = await supabase
        .from("bakeries")
        .select("id")
        .eq("name", bakeryName)
        .single();

      let bakeryId: string;

      if (existingBakery) {
        bakeryId = existingBakery.id;
        console.log("Using existing bakery:", bakeryId);
      } else {
        console.log("Creating new bakery...");
        const { data: newBakery, error: bakeryError } = await supabase
          .from("bakeries")
          .insert({
            name: bakeryName,
            address: bakeryAddress || "Unknown",
            latitude: bakeryCoordinates?.lat || 37.7749,
            longitude: bakeryCoordinates?.lng || -122.4194,
          })
          .select()
          .single();

        if (bakeryError) throw bakeryError;
        bakeryId = newBakery.id;
        console.log("Bakery created:", bakeryId);
      }

      console.log("Creating review...");
      const { error: reviewError } = await supabase.from("reviews").insert({
        user_id: user.id,
        bakery_id: bakeryId,
        bread_type: breadType,
        image_url: imageUrl,
        rating_overall: ratingOverall,
        rating_crust: ratingCrust,
        rating_crumb: ratingCrumb,
        rating_flavor: ratingFlavor,
        review_text: reviewText.trim() || null,
      });

      if (reviewError) throw reviewError;

      console.log("Review created successfully!");

      Alert.alert("Success!", "Your review has been posted", [
        {
          text: "OK",
          onPress: () => {
            setImage(null);
            setBakeryName("");
            setBakeryAddress("");
            setBakeryCoordinates(null);
            setBreadType("sourdough");
            setRatingOverall(5);
            setRatingCrust(5);
            setRatingCrumb(5);
            setRatingFlavor(5);
            setReviewText("");

            router.push("/(tabs)");
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const renderStarRating = (
    rating: number,
    setRating: (val: number) => void,
    label: string
  ) => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Star
              size={32}
              fill={star <= rating ? "#f59e0b" : "transparent"}
              color={star <= rating ? "#f59e0b" : "#d1d5db"}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Image Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo *</Text>
          {image ? (
            <View>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={() => setImage(null)}
                >
                  <Text style={styles.changePhotoText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={takePhoto}
              >
                <Text style={styles.imagePickerText}>📸 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Text style={styles.imagePickerText}>
                  🖼️ Choose from Library
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bakery Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Bakery *</Text>
          {bakeryName ? (
            <View style={styles.selectedBakery}>
              <View style={styles.selectedBakeryInfo}>
                <Text style={styles.selectedBakeryName}>{bakeryName}</Text>
                {bakeryAddress && (
                  <Text style={styles.selectedBakeryAddress}>
                    {bakeryAddress}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setBakeryName("");
                  setBakeryAddress("");
                  setBakeryCoordinates(null);
                }}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bakeryButtons}>
              <TouchableOpacity
                style={styles.bakeryButton}
                onPress={() => setShowBakerySearch(true)}
              >
                <Text style={styles.bakeryButtonText}>🔍 Search Bakery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bakeryButton}
                onPress={() => setShowManualBakery(true)}
              >
                <Text style={styles.bakeryButtonText}>
                  ➕ Add Bakery Manually
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bread Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Bread Type *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowBreadTypes(true)}
          >
            <Text style={styles.dropdownText}>
              {breadType.charAt(0).toUpperCase() +
                breadType.slice(1).replace("_", " ")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ratings */}
        <View style={styles.section}>
          {renderStarRating(
            ratingOverall,
            setRatingOverall,
            "Overall Rating *"
          )}
        </View>

        <View style={styles.section}>
          {renderStarRating(ratingCrust, setRatingCrust, "Crust")}
        </View>

        <View style={styles.section}>
          {renderStarRating(ratingCrumb, setRatingCrumb, "Crumb")}
        </View>

        <View style={styles.section}>
          {renderStarRating(ratingFlavor, setRatingFlavor, "Flavor")}
        </View>

        {/* Review Text */}
        <View style={styles.section}>
          <Text style={styles.label}>Review (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your thoughts about this bread..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{reviewText.length}/500</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.submittingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submittingText}>Posting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Post Review</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bread Type Modal */}
      <Modal
        visible={showBreadTypes}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBreadTypes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bread Type</Text>
              <TouchableOpacity onPress={() => setShowBreadTypes(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {BREAD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modalItem}
                  onPress={() => {
                    setBreadType(type);
                    setShowBreadTypes(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      type === breadType && styles.modalItemTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() +
                      type.slice(1).replace("_", " ")}
                  </Text>
                  {type === breadType && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bakery Search Modal */}
      <Modal
        visible={showBakerySearch}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBakerySearch(false)}
      >
        <View style={styles.searchModalContainer}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>Search Bakery</Text>
            <TouchableOpacity onPress={() => setShowBakerySearch(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type bakery name..."
              value={bakerySearchQuery}
              onChangeText={handleBakerySearchChange}
              autoFocus
            />
          </View>

          {searchingBakeries ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="large" color="#d97706" />
            </View>
          ) : (
            <FlatList
              data={bakeryResults}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bakeryResultItem}
                  onPress={() => selectBakery(item)}
                >
                  <Text style={styles.bakeryResultName}>{item.name}</Text>
                  <Text style={styles.bakeryResultAddress}>{item.address}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                bakerySearchQuery.length >= 3 ? (
                  <View style={styles.emptyResults}>
                    <Text style={styles.emptyResultsText}>
                      No bakeries found
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyResults}>
                    <Text style={styles.emptyResultsText}>
                      Type at least 3 characters to search
                    </Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </Modal>

      {/* Manual Bakery Entry Modal */}
      <Modal
        visible={showManualBakery}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualBakery(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bakery</Text>
              <TouchableOpacity onPress={() => setShowManualBakery(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.manualBakeryForm}>
              <Text style={styles.label}>Bakery Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Tartine Bakery"
                value={manualBakeryName}
                onChangeText={setManualBakeryName}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 600 Guerrero St, San Francisco"
                value={manualBakeryAddress}
                onChangeText={setManualBakeryAddress}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleManualBakerySubmit}
              >
                <Text style={styles.submitButtonText}>Add Bakery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 4,
  },
  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  imageButtons: {
    marginTop: 12,
  },
  changePhotoButton: {
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
  },
  changePhotoText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  imagePickerContainer: {
    gap: 12,
  },
  imagePickerButton: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    alignItems: "center",
  },
  imagePickerText: {
    fontSize: 16,
    color: "#6b7280",
  },
  selectedBakery: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  selectedBakeryInfo: {
    flex: 1,
  },
  selectedBakeryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  selectedBakeryAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  bakeryButtons: {
    gap: 12,
  },
  bakeryButton: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    alignItems: "center",
  },
  bakeryButtonText: {
    fontSize: 16,
    color: "#6b7280",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
  },
  ratingSection: {
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  submitButton: {
    margin: 16,
    padding: 16,
    backgroundColor: "#d97706",
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submittingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submittingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 32,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalItemText: {
    fontSize: 16,
    color: "#374151",
  },
  modalItemTextSelected: {
    color: "#d97706",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 20,
    color: "#d97706",
  },
  // Search modal styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingTop: 60,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchInputContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bakeryResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  bakeryResultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  bakeryResultAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  emptyResults: {
    padding: 32,
    alignItems: "center",
  },
  emptyResultsText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  manualBakeryForm: {
    padding: 16,
  },
});
