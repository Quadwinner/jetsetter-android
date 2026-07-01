import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Show notifications even when the app is in the foreground. On Expo SDK 53+
// (expo-notifications 0.29+) `shouldShowAlert` is deprecated and no longer
// displays a banner on its own — `shouldShowBanner` / `shouldShowList` are
// required. Without them, foreground notifications were delivered silently
// (same class of bug fixed on the web with FCM onMessage).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true, // back-compat for older runtimes
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  async registerForPushNotifications() {
    // Skip push notifications on web - requires vapidPublicKey config
    if (Platform.OS === 'web') return null;

    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.expoPushToken = token.data;
      await AsyncStorage.setItem('expoPushToken', token.data);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#055B75',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async getExpoPushToken() {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    const storedToken = await AsyncStorage.getItem('expoPushToken');
    if (storedToken) {
      this.expoPushToken = storedToken;
      return storedToken;
    }

    return await this.registerForPushNotifications();
  }

  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async scheduleBookingReminder(bookingDate, bookingTitle) {
    const trigger = new Date(bookingDate);
    trigger.setHours(trigger.getHours() - 24);

    if (trigger > new Date()) {
      return await this.scheduleLocalNotification(
        'Booking Reminder',
        `Your ${bookingTitle} is coming up tomorrow!`,
        { type: 'booking_reminder', bookingTitle },
        trigger
      );
    }
    return null;
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  setupNotificationListeners(navigationRef) {
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification response:', data);

      if (navigationRef?.current) {
        if (data.type === 'booking_reminder') {
          navigationRef.current.navigate('MyTrips');
        } else if (data.type === 'booking_confirmation') {
          navigationRef.current.navigate('MyTrips');
        } else if (data.type === 'payment_success') {
          navigationRef.current.navigate('MyTrips');
        }
      }
    });
  }

  async sendBookingConfirmation(bookingType, bookingReference) {
    return await this.scheduleLocalNotification(
      'Booking Confirmed! 🎉',
      `Your ${bookingType} booking (${bookingReference}) has been confirmed.`,
      {
        type: 'booking_confirmation',
        bookingType,
        bookingReference,
      }
    );
  }

  async sendPaymentSuccess(amount, currency = 'USD') {
    return await this.scheduleLocalNotification(
      'Payment Successful ✅',
      `Your payment of ${currency} ${amount} has been processed successfully.`,
      {
        type: 'payment_success',
        amount,
        currency,
      }
    );
  }

  async sendPromotionalNotification(title, body, data = {}) {
    return await this.scheduleLocalNotification(title, body, {
      type: 'promotional',
      ...data,
    });
  }
}

const notificationService = new NotificationService();
export default notificationService;

