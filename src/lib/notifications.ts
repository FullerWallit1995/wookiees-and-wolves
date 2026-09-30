import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log(
      'Push notifications require a physical device.'
    );
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      'default',
      {
        name: 'Default',
        importance:
          Notifications.AndroidImportance.DEFAULT,
      }
    );
  }

  const existingPermissions =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingPermissions.status;

  if (finalStatus !== 'granted') {
    const requestedPermissions =
      await Notifications.requestPermissionsAsync();

    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log(
      'Could not find the Expo project ID.'
    );
    return null;
  }

  const token =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  return token.data;
}

async function savePushToken(
  userId: string,
  token: string
) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'expo_push_token',
      }
    );

  return error;
}

export async function enablePredictorNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      reason: 'not_signed_in',
    };
  }

  const token = await registerForPushNotifications();

  if (!token) {
    return {
      success: false,
      reason: 'permission_denied',
    };
  }

  const tokenError = await savePushToken(
    user.id,
    token
  );

  if (tokenError) {
    console.log(
      'Could not save push token:',
      tokenError
    );

    return {
      success: false,
      reason: 'save_failed',
    };
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        predictor_reminders: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.log(
      'Could not enable Predictor reminders:',
      error
    );

    return {
      success: false,
      reason: 'preference_failed',
    };
  }

  return {
    success: true,
    token,
  };
}

export async function disablePredictorNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      reason: 'not_signed_in',
    };
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        predictor_reminders: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.log(
      'Could not disable Predictor reminders:',
      error
    );

    return {
      success: false,
      reason: 'save_failed',
    };
  }

  return {
    success: true,
  };
}

export async function enableNewEpisodeNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      reason: 'not_signed_in',
    };
  }

  const token = await registerForPushNotifications();

  if (!token) {
    return {
      success: false,
      reason: 'permission_denied',
    };
  }

  const tokenError = await savePushToken(
    user.id,
    token
  );

  if (tokenError) {
    console.log(
      'Could not save push token:',
      tokenError
    );

    return {
      success: false,
      reason: 'save_failed',
    };
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        new_episodes: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.log(
      'Could not enable new episode notifications:',
      error
    );

    return {
      success: false,
      reason: 'preference_failed',
    };
  }

  return {
    success: true,
    token,
  };
}

export async function disableNewEpisodeNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      reason: 'not_signed_in',
    };
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        new_episodes: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.log(
      'Could not disable new episode notifications:',
      error
    );

    return {
      success: false,
      reason: 'save_failed',
    };
  }

  return {
    success: true,
  };
}