import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAFC',
  },

  // Header - Gradient style matching JETSET13
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 52,
    backgroundColor: '#055B75',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#B9D0DC',
  },
  modifyButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },

  // Sort Options - JETSET13 themed
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortButtonActive: {
    backgroundColor: '#055B75',
    borderColor: '#034457',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },

  // Results Count
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '500',
  },
  resultsCountBold: {
    color: '#055B75',
    fontWeight: '700',
    fontSize: 16,
  },

  // Flight List
  scrollView: {
    flex: 1,
  },
  
  // Flight Card - Matching JETSET13 design
  flightCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  
  // Card Top Section
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  airlineLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  airlineLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineInfo: {
    flex: 1,
    marginLeft: 12,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  flightNumber: {
    fontSize: 13,
    color: '#055B75',
    fontWeight: '600',
  },
  
  // Badge
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stopsText: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '600',
  },
  
  // Route Section
  routeSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePoint: {
    flex: 1,
  },
  routePointRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  airportCode: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  
  // Flight Path Visualization
  flightPath: {
    flex: 2,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  pathDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#055B75',
    marginBottom: 6,
  },
  pathLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  pathLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  pathLineTeal: {
    flex: 1,
    height: 2,
    backgroundColor: '#65B3CF',
  },
  planeIcon: {
    marginHorizontal: 6,
  },
  pathStops: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
    marginTop: 4,
  },
  pathNonStop: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 4,
  },

  // Details Row (below route)
  detailsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFBFC',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Stops Details
  stopsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF7ED',
    gap: 4,
  },
  stopsDetails: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },

  // Price Row - matching JETSET13
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceInfo: {},
  priceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#055B75',
    marginBottom: 1,
  },
  perPersonText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: '#055B75',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#055B75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // No Results
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  noResultsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  bottomPadding: {
    height: 30,
  },
});
