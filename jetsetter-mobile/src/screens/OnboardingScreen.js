import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Jetsetters brand teal — one cohesive family across all slides
const BRAND = {
  gradient: ['#034457', '#055B75', '#0890BC'],
  primary: '#055B75',
  accent: '#0890BC',
};

const onboardingSlides = [
  {
    id: 1,
    title: 'Welcome to Jetsetters',
    description: 'Your gateway to luxury travel experiences. Book flights, hotels, cruises, and vacation packages all in one place.',
    icon: 'airplane',
    showLogo: true,
  },
  {
    id: 2,
    title: 'Book Flights Easily',
    description: 'Search and compare flights from 500+ airlines worldwide. Get the best prices with our smart price comparison.',
    icon: 'airplane-outline',
  },
  {
    id: 3,
    title: 'Find Perfect Hotels',
    description: 'Discover 2M+ properties from budget to luxury. Read verified reviews and get the best rates guaranteed.',
    icon: 'bed-outline',
  },
  {
    id: 4,
    title: 'Luxury Cruises',
    description: 'Explore premium cruise experiences with major cruise lines. Customize your perfect cruise vacation.',
    icon: 'boat-outline',
  },
  {
    id: 5,
    title: 'Vacation Packages',
    description: 'All-inclusive packages tailored to your preferences. Save time and money with bundled deals.',
    icon: 'gift-outline',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('Login');
    }
  };

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingSlides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <LinearGradient
              colors={BRAND.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <View style={styles.content}>
                {slide.showLogo ? (
                  <View style={styles.logoBadge}>
                    <Image
                      source={require('../../assets/jetset.jpeg')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.iconContainer}>
                    <Ionicons name={slide.icon} size={72} color="#FFFFFF" />
                  </View>
                )}

                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>

              <View style={styles.footer}>
                <View style={styles.dots}>
                  {onboardingSlides.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentSlide && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>
                    {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={BRAND.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.primary,
  },
  slide: {
    width,
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoBadge: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 44,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  iconContainer: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    gap: 8,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: BRAND.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default OnboardingScreen;
