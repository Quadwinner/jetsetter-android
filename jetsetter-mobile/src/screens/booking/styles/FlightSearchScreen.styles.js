import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Enhanced Hero Section matching JETSET13
  heroContainer: {
    width: '100%',
    minHeight: 300,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 56, // room for the trip-type pill overlapping the bottom
    backgroundColor: '#FFFFFF',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // Bright overlay instead of dark
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTextContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  heroSuperTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSuperTitleLine: {
    height: 2,
    width: 40,
    backgroundColor: '#055B75',
    marginRight: 12,
  },
  heroSuperTitle: {
    color: '#055B75',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitleDark: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827', // text-gray-900
    textAlign: 'center',
    lineHeight: 48,
  },
  heroTitleHighlight: {
    fontSize: 42,
    fontWeight: '800',
    color: '#055B75', // teal
    textAlign: 'center',
    lineHeight: 48,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4B5563', // text-gray-600
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '500',
  },

  // Trip Type Selector
  tripTypeContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: -28, // overlap the bottom of the hero
    marginBottom: 20,
    zIndex: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // bg-gray-100
  },
  activeTab: {
    backgroundColor: '#055B75',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563', // text-gray-600
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Main Search Form Card
  searchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 5,
  },

  // Form Groups
  formGroup: {
    marginBottom: 16,
    zIndex: 1,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563', // text-gray-600
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  iconRight: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937', // text-gray-800
  },
  placeholderText: {
    color: '#9CA3AF',
  },

  // Suggestions - inline, renders below the input without overlapping
  suggestions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionCity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionCode: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Search Button
  searchButton: {
    backgroundColor: '#055B75', // hover #044A5F
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Special Fares Row
  specialFaresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  specialFaresLabel: {
    color: '#055B75',
    fontWeight: '600',
    fontSize: 14,
  },
  faresTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fareTag: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#055B75',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fareTagActive: {
    backgroundColor: '#055B75',
  },
  fareTagText: {
    fontSize: 13,
    color: '#055B75',
    fontWeight: '500',
  },
  fareTagTextActive: {
    color: '#FFFFFF',
  },

  // Generic Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionBadge: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  sectionBadgeText: {
    color: '#055B75',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 24,
  },

  // Features Grid (Why Book With Us)
  featuresGrid: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
