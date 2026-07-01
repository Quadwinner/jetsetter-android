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

const onboardingSlides = [
  {
    id: 1,
    title: 'Welcome to Jetsetters',
    description: 'Your gateway to luxury travel experiences. Book flights, hotels, cruises, and vacation packages all in one place.',
    icon: 'airplane',
    color: '#0890BC',
    showLogo: true,
  },
  {
    id: 2,
    title: 'Book Flights Easily',
    description: 'Search and compare flights from 500+ airlines worldwide. Get the best prices with our smart price comparison.',
    icon: 'airplane-outline',
    color: '#3B82F6',
  },
  {
    id: 3,
    title: 'Find Perfect Hotels',
    description: 'Discover 2M+ properties from budget to luxury. Read verified reviews and get the best rates guaranteed.',
    icon: 'bed-outline',
    color: '#8B5CF6',
  },
  {
    id: 4,
    title: 'Luxury Cruises',
    description: 'Explore premium cruise experiences with major cruise lines. Customize your perfect cruise vacation.',
    icon: 'boat-outline',
    color: '#EC4899',
  },
  {
    id: 5,
    title: 'Vacation Packages',
    description: 'All-inclusive packages tailored to your preferences. Save time and money with bundled deals.',
    icon: 'gift-outline',
    color: '#F59E0B',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
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
              colors={[slide.color, `${slide.color}80`]}
              style={styles.gradient}
            >
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <View style={styles.content}>
                {slide.showLogo ? (
                  <Image
                    source={require('../../assets/jetset.jpeg')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.iconContainer, { backgroundColor: `${slide.color}20` }]}>
                    <Ionicons name={slide.icon} size={80} color={slide.color} />
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
                        { backgroundColor: index === currentSlide ? slide.color : '#FFFFFF40' },
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: slide.color }]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>
                    {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    backgroundColor: '#FFFFFF',
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
  logo: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
  },
  dotActive: {
    width: 24,
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
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;


