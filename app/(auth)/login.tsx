import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Colors, Fonts } from "../../constants/Styles";
import { supabase } from "../../lib/supabase";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Animation configuration
const INITIAL_LOGO_SIZE = 160;
const FINAL_LOGO_SIZE = 100;
const TITLE_INITIAL_SIZE = 48;
const TITLE_FINAL_SIZE = 32;

// Calculate offset to center content during intro
// Header area: paddingTop(80) + marginTop(22) + logo + marginBottom(32)
const HEADER_TOP_OFFSET = 80 + 22 + 50; // Approximate center of header area
const CENTER_Y = SCREEN_HEIGHT / 2 - 120; // Center of screen minus half content height
const TRANSLATE_OFFSET = CENTER_Y - HEADER_TOP_OFFSET;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const router = useRouter();

  // Animation shared values
  const translateY = useSharedValue(TRANSLATE_OFFSET);
  const contentOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const logoSize = useSharedValue(INITIAL_LOGO_SIZE);
  const titleSize = useSharedValue(TITLE_INITIAL_SIZE);
  const formOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Fade in centered (0-400ms)
    contentOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });

    // Phase 2: Gentle logo bounce (500-2600ms)
    logoScale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.98, { duration: 350, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 300, easing: Easing.out(Easing.sin) })
        ),
        1,
        false
      )
    );

    // Phase 3: Move to final header position (2700ms+)
    const moveDelay = 2700;

    translateY.value = withDelay(
      moveDelay,
      withTiming(0, {
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    logoSize.value = withDelay(
      moveDelay,
      withTiming(FINAL_LOGO_SIZE, {
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    titleSize.value = withDelay(
      moveDelay,
      withTiming(TITLE_FINAL_SIZE, {
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    // Phase 4: Fade in subtitle and form
    subtitleOpacity.value = withDelay(
      moveDelay + 300,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );

    formOpacity.value = withDelay(
      moveDelay + 400,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Mark intro as complete
    const timeout = setTimeout(() => {
      setIntroComplete(true);
    }, moveDelay + 900);

    return () => clearTimeout(timeout);
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
    } else {
      router.replace("/(tabs)");
    }
  }

  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: logoScale.value },
    ],
    opacity: contentOpacity.value,
  }));

  const logoImageStyle = useAnimatedStyle(() => ({
    width: logoSize.value,
    height: logoSize.value,
  }));

  const titleContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: contentOpacity.value,
  }));

  const titleTextStyle = useAnimatedStyle(() => ({
    fontSize: titleSize.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
          <Animated.Image
            source={require("../../assets/breadit-logo.png")}
            style={[styles.logo, logoImageStyle]}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={titleContainerStyle}>
          <Animated.Text style={[styles.title, titleTextStyle]}>
            Breadit
          </Animated.Text>
        </Animated.View>
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Welcome back, bread-lover
        </Animated.Text>
      </View>

      <Animated.View style={[styles.form, formStyle]}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textLighter}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={introComplete}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textLighter}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={introComplete}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading || !introComplete}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity disabled={!introComplete}>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 22,
    marginBottom: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: FINAL_LOGO_SIZE,
    height: FINAL_LOGO_SIZE,
  },
  title: {
    fontSize: TITLE_FINAL_SIZE,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: 24,
    textAlign: "center",
  },
  form: {
    paddingHorizontal: 32,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 17,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  linkText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.primary,
  },
});
