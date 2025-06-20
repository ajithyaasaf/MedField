import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationManager {
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
  permission: NotificationPermission;
}

export const usePushNotifications = (): PushNotificationManager => {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied'
  );

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Notifications Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications.',
        });
        return true;
      } else {
        toast({
          title: 'Notifications Denied',
          description: 'Push notifications have been disabled.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      // Fallback to toast notification
      toast({
        title,
        description: options?.body || '',
      });
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click events
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback to toast
      toast({
        title,
        description: options?.body || '',
      });
    }
  };

  return {
    requestPermission,
    sendNotification,
    isSupported,
    permission,
  };
};

// Hook for geo-fence notifications
export const useGeoFenceNotifications = () => {
  const { sendNotification } = usePushNotifications();

  const notifyEnterZone = (hospitalName: string) => {
    sendNotification('Entered Hospital Zone', {
      body: `You have entered the geo-fence for ${hospitalName}. You can now clock in.`,
      tag: 'geo-fence-enter',
    });
  };

  const notifyExitZone = (hospitalName: string) => {
    sendNotification('Exited Hospital Zone', {
      body: `You have left the geo-fence for ${hospitalName}. Don't forget to clock out.`,
      tag: 'geo-fence-exit',
    });
  };

  const notifyOutsideZone = (hospitalName: string) => {
    sendNotification('Outside Designated Area', {
      body: `You are outside the geo-fence for ${hospitalName}. Move closer to clock in.`,
      tag: 'geo-fence-outside',
    });
  };

  return {
    notifyEnterZone,
    notifyExitZone,
    notifyOutsideZone,
  };
};

// Hook for attendance reminders
export const useAttendanceNotifications = () => {
  const { sendNotification } = usePushNotifications();

  const notifyClockInReminder = () => {
    sendNotification('Clock In Reminder', {
      body: 'Good morning! Don\'t forget to clock in when you arrive at your first hospital.',
      tag: 'clock-in-reminder',
    });
  };

  const notifyClockOutReminder = () => {
    sendNotification('Clock Out Reminder', {
      body: 'End of day approaching. Remember to clock out before leaving.',
      tag: 'clock-out-reminder',
    });
  };

  const notifyMissedClockIn = (hospitalName: string) => {
    sendNotification('Missed Clock In', {
      body: `You may have forgotten to clock in at ${hospitalName}. Please check your attendance.`,
      tag: 'missed-clock-in',
    });
  };

  return {
    notifyClockInReminder,
    notifyClockOutReminder,
    notifyMissedClockIn,
  };
};

// Hook for quotation notifications
export const useQuotationNotifications = () => {
  const { sendNotification } = usePushNotifications();

  const notifyQuotationApproved = (quotationNumber: string) => {
    sendNotification('Quotation Approved', {
      body: `Great news! Quotation ${quotationNumber} has been approved.`,
      tag: 'quotation-approved',
    });
  };

  const notifyQuotationRejected = (quotationNumber: string) => {
    sendNotification('Quotation Rejected', {
      body: `Quotation ${quotationNumber} was rejected. Please review and follow up.`,
      tag: 'quotation-rejected',
    });
  };

  const notifyFollowUpRequired = (quotationNumber: string, days: number) => {
    sendNotification('Follow-up Required', {
      body: `Quotation ${quotationNumber} has been pending for ${days} days. Consider following up.`,
      tag: 'follow-up-required',
    });
  };

  return {
    notifyQuotationApproved,
    notifyQuotationRejected,
    notifyFollowUpRequired,
  };
};

// Component for managing notification preferences
export const NotificationPermissionManager: React.FC = () => {
  const { requestPermission, isSupported, permission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-800">Enable Notifications</h3>
          <p className="text-sm text-blue-600">
            Get instant alerts for attendance reminders, geo-fence updates, and quotation status changes.
          </p>
        </div>
        <button
          onClick={requestPermission}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Enable
        </button>
      </div>
    </div>
  );
};