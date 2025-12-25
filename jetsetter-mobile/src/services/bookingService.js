import flightService from './flightService';
import hotelService from './hotelService';
import cruiseService from './cruiseService';
import packageService from './packageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BookingService {
  /**
   * Modify a booking (works for all booking types)
   * @param {string} bookingId - Booking ID or reference
   * @param {string} bookingType - Type: 'flight', 'hotel', 'cruise', 'package'
   * @param {Object} modifications - Modifications to apply
   * @returns {Promise<Object>} Modification result
   */
  async modifyBooking(bookingId, bookingType, modifications) {
    try {
      let result;
      
      switch (bookingType) {
        case 'flight':
          result = await flightService.modifyBooking(bookingId, modifications);
          break;
        case 'hotel':
          result = await hotelService.modifyBooking(bookingId, modifications);
          break;
        case 'cruise':
          result = await cruiseService.modifyBooking(bookingId, modifications);
          break;
        case 'package':
          result = await packageService.modifyBooking(bookingId, modifications);
          break;
        default:
          return {
            success: false,
            error: 'Invalid booking type',
          };
      }

      if (result.success) {
        await this.updateLocalBooking(bookingId, bookingType, result.booking || modifications);
      }

      return result;
    } catch (error) {
      console.error('Modify booking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to modify booking',
      };
    }
  }

  /**
   * Cancel a booking (works for all booking types)
   * @param {string} bookingId - Booking ID or reference
   * @param {string} bookingType - Type: 'flight', 'hotel', 'cruise', 'package'
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelBooking(bookingId, bookingType, reason = 'Customer request') {
    try {
      let result;
      
      switch (bookingType) {
        case 'flight':
          result = await flightService.cancelBooking(bookingId, reason);
          break;
        case 'hotel':
          result = await hotelService.cancelBooking(bookingId, reason);
          break;
        case 'cruise':
          result = await cruiseService.cancelBooking(bookingId, reason);
          break;
        case 'package':
          result = await packageService.cancelBooking(bookingId, reason);
          break;
        default:
          return {
            success: false,
            error: 'Invalid booking type',
          };
      }

      if (result.success) {
        await this.updateLocalBookingStatus(bookingId, bookingType, 'CANCELLED');
      }

      return result;
    } catch (error) {
      console.error('Cancel booking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel booking',
      };
    }
  }

  /**
   * Get all bookings from local storage
   * @returns {Promise<Array>} Array of all bookings
   */
  async getAllBookings() {
    try {
      const allBookings = [];

      // Get all keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const bookingKeys = keys.filter(key => 
        key.startsWith('booking_') || 
        key === 'completedFlightBooking' ||
        key === 'completedHotelBooking' ||
        key === 'completedBooking' ||
        key === 'completedPackageBooking'
      );

      // Load all bookings
      for (const key of bookingKeys) {
        try {
          const bookingData = await AsyncStorage.getItem(key);
          if (bookingData) {
            const booking = JSON.parse(bookingData);
            
            // Handle single booking objects
            if (booking.type || booking.orderId || booking.bookingReference) {
              allBookings.push({
                ...booking,
                storageKey: key,
                bookingDate: booking.orderCreatedAt || booking.bookingDate || new Date().toISOString(),
              });
            }
            // Handle arrays of bookings
            else if (Array.isArray(booking)) {
              booking.forEach(b => {
                allBookings.push({
                  ...b,
                  storageKey: key,
                  bookingDate: b.orderCreatedAt || b.bookingDate || new Date().toISOString(),
                });
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing booking from ${key}:`, error);
        }
      }

      return allBookings.sort((a, b) => {
        const dateA = new Date(a.bookingDate || 0);
        const dateB = new Date(b.bookingDate || 0);
        return dateB - dateA; // Most recent first
      });
    } catch (error) {
      console.error('Error loading all bookings:', error);
      return [];
    }
  }

  /**
   * Save a booking to local storage
   * @param {Object} booking - Booking object
   * @param {string} bookingType - Type: 'flight', 'hotel', 'cruise', 'package'
   */
  async saveBooking(booking, bookingType) {
    try {
      const bookingId = booking.orderId || booking.bookingReference || booking.bookingId || `BOOKING-${Date.now()}`;
      const storageKey = `booking_${bookingType}_${bookingId}`;
      
      const bookingToSave = {
        ...booking,
        type: bookingType,
        bookingId,
        bookingDate: booking.orderCreatedAt || booking.bookingDate || new Date().toISOString(),
        status: booking.status || 'CONFIRMED',
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(bookingToSave));
      console.log(`✅ Booking saved: ${storageKey}`);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  }

  /**
   * Update local booking
   * @param {string} bookingId - Booking ID
   * @param {string} bookingType - Booking type
   * @param {Object} updates - Updates to apply
   */
  async updateLocalBooking(bookingId, bookingType, updates) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookingKey = keys.find(key => 
        key.includes(bookingId) || 
        key === `booking_${bookingType}_${bookingId}` ||
        (bookingType === 'flight' && key === 'completedFlightBooking') ||
        (bookingType === 'hotel' && key === 'completedHotelBooking') ||
        (bookingType === 'cruise' && key === 'completedBooking') ||
        (bookingType === 'package' && key === 'completedPackageBooking')
      );

      if (bookingKey) {
        const existing = await AsyncStorage.getItem(bookingKey);
        if (existing) {
          const booking = JSON.parse(existing);
          const updated = { ...booking, ...updates, updatedAt: new Date().toISOString() };
          await AsyncStorage.setItem(bookingKey, JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Error updating local booking:', error);
    }
  }

  /**
   * Update booking status in local storage
   * @param {string} bookingId - Booking ID
   * @param {string} bookingType - Booking type
   * @param {string} status - New status
   */
  async updateLocalBookingStatus(bookingId, bookingType, status) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookingKey = keys.find(key => 
        key.includes(bookingId) || 
        key === `booking_${bookingType}_${bookingId}` ||
        (bookingType === 'flight' && key === 'completedFlightBooking') ||
        (bookingType === 'hotel' && key === 'completedHotelBooking') ||
        (bookingType === 'cruise' && key === 'completedBooking') ||
        (bookingType === 'package' && key === 'completedPackageBooking')
      );

      if (bookingKey) {
        const existing = await AsyncStorage.getItem(bookingKey);
        if (existing) {
          const booking = JSON.parse(existing);
          booking.status = status;
          booking.cancelledAt = status === 'CANCELLED' ? new Date().toISOString() : booking.cancelledAt;
          await AsyncStorage.setItem(bookingKey, JSON.stringify(booking));
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  }

  /**
   * Delete a booking from local storage
   * @param {string} bookingId - Booking ID
   * @param {string} bookingType - Booking type
   */
  async deleteLocalBooking(bookingId, bookingType) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookingKey = keys.find(key => 
        key.includes(bookingId) || 
        key === `booking_${bookingType}_${bookingId}`
      );

      if (bookingKey) {
        await AsyncStorage.removeItem(bookingKey);
        console.log(`✅ Booking deleted: ${bookingKey}`);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  }
}

export default new BookingService();













