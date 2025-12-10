import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Star, X } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Colors, Fonts } from "../constants/Styles";

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
  google_place_id: string;
}

export default function AddReviewScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [bakeryName, setBakeryName] = useState("");
  const [bakeryAddress, setBakeryAddress] = useState("");
  const [bakeryCoordinates, setBakeryCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
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
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            google_place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }));
        setBakeryResults(formatted);
      } else {
        setBakeryResults([]);
      }
    } catch (error) {
      console.error("Error searching bakeries:", error);
      setBakeryResults([]);
    } finally {
      setSearchingBakeries(false);
    }
  }

  function handleBakerySearchChange(text: string) {
    setBakerySearchQuery(text);

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
    setGooglePlaceId(bakery.google_place_id);
    setShowBakerySearch(false);
    setBakerySearchQuery("");
    setBakeryResults([]);
  }

  function openManualEntryFromSearch() {
    setManualBakeryName(bakerySearchQuery);
    setShowBakerySearch(false);
    setShowManualBakery(true);
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
    setBakeryCoordinates(null);
    setGooglePlaceId(null);
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
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
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
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  }

  async function uploadImage(base64Data: string): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `${user.id}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("bread-images")
      .upload(fileName, bytes, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("bread-images").getPublicUrl(fileName);

    return publicUrl;
  }

  async function handleSubmit() {
    if (!image || !imageBase64) {
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
      const imageUrl = await uploadImage(imageBase64);
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
            google_place_id: googlePlaceId || null,
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

      // Clear form state
      setImage(null);
      setImageBase64(null);
      setBakeryName("");
      setBakeryAddress("");
      setBakeryCoordinates(null);
      setGooglePlaceId(null);
      setBreadType("sourdough");
      setRatingOverall(5);
      setRatingCrust(5);
      setRatingCrumb(5);
      setRatingFlavor(5);
      setReviewText("");

      // Show success message and go back
      Alert.alert("Success!", "Your review has been posted", [
        {
          text: "OK",
          onPress: () => {
            router.back(); // Changed from router.push("/(tabs)")
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
                  onPress={() => {
                    setImage(null);
                    setImageBase64(null);
                  }}
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
                  setGooglePlaceId(null);
                }}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bakerySearchButton}
              onPress={() => setShowBakerySearch(true)}
            >
              <Text style={styles.bakerySearchButtonText}>
                🔍 Search for bakery
              </Text>
            </TouchableOpacity>
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
            placeholderTextColor={Colors.textLight}
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
              <ActivityIndicator color={Colors.surface} />
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
              placeholderTextColor={Colors.textLight}
              value={bakerySearchQuery}
              onChangeText={handleBakerySearchChange}
              autoFocus
            />
          </View>

          {searchingBakeries ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              <FlatList
                data={bakeryResults}
                keyExtractor={(item) => item.google_place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bakeryResultItem}
                    onPress={() => selectBakery(item)}
                  >
                    <Text style={styles.bakeryResultName}>{item.name}</Text>
                    <Text style={styles.bakeryResultAddress}>
                      {item.address}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  bakerySearchQuery.length >= 3 ? (
                    <View style={styles.emptyResultsContainer}>
                      <View style={styles.emptyResults}>
                        <Text style={styles.emptyResultsText}>
                          No bakeries found
                        </Text>
                        <Text style={styles.emptyResultsSubtext}>
                          Can't find your bakery?
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addManuallyButton}
                        onPress={openManualEntryFromSearch}
                      >
                        <Text style={styles.addManuallyButtonText}>
                          ➕ Add "{bakerySearchQuery}" manually
                        </Text>
                      </TouchableOpacity>
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
            </>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowManualBakery(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentTall}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Bakery Manually</Text>
                <TouchableOpacity onPress={() => setShowManualBakery(false)}>
                  <X size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.manualBakeryForm}>
                <Text style={styles.label}>Bakery Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Tartine Bakery"
                  placeholderTextColor={Colors.textLight}
                  value={manualBakeryName}
                  onChangeText={setManualBakeryName}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Address *</Text>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder="e.g., 600 Guerrero St, San Francisco, CA"
                  placeholderTextColor={Colors.textLight}
                  value={manualBakeryAddress}
                  onChangeText={setManualBakeryAddress}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
                <Text style={styles.addressHint}>
                  Please enter full address including street, city, and state
                </Text>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!manualBakeryName.trim() || !manualBakeryAddress.trim()) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={handleManualBakerySubmit}
                  disabled={
                    !manualBakeryName.trim() || !manualBakeryAddress.trim()
                  }
                >
                  <Text style={styles.submitButtonText}>Add Bakery</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: Colors.background,
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    marginBottom: 8,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.surface,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
    textAlign: "right",
    marginTop: 4,
  },
  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  imageButtons: {
    marginTop: 12,
  },
  changePhotoButton: {
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePhotoText: {
    color: Colors.error,
    fontFamily: Fonts.semibold,
  },
  imagePickerContainer: {
    gap: 12,
  },
  imagePickerButton: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  imagePickerText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textLight,
  },
  selectedBakery: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.secondaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  selectedBakeryInfo: {
    flex: 1,
  },
  selectedBakeryName: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  selectedBakeryAddress: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  bakeryButtons: {
    gap: 12,
  },
  bakeryButton: {
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  bakeryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textLight,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.surface,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  ratingSection: {
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    marginBottom: 8,
    color: Colors.text,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  submitButton: {
    margin: 16,
    padding: 18,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 17,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  submittingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submittingText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Fonts.semibold,
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
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
    borderBottomColor: Colors.borderLight,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  modalItemTextSelected: {
    color: Colors.primary,
    fontFamily: Fonts.semibold,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.primary,
  },
  // Search modal styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 60,
  },
  searchTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  searchInputContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  searchLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bakeryResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bakeryResultName: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  bakeryResultAddress: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: 4,
  },
  manualBakeryForm: {
    padding: 16,
  },
  bakerySearchButton: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    borderStyle: "dashed",
  },
  bakerySearchButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textLight,
  },
  emptyResultsContainer: {
    padding: 24,
  },
  emptyResults: {
    alignItems: "center",
    marginBottom: 16,
  },
  emptyResultsText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 4,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  addManuallyButton: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addManuallyButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Fonts.semibold,
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContentTall: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  addressInput: {
    minHeight: 60,
  },
  addressHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
    marginTop: 4,
    fontStyle: "italic",
  },
});
