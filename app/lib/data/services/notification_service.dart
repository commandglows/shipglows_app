/// Push notification service — ready to wire with Firebase Cloud Messaging.
///
/// Setup steps to enable:
/// 1. Add firebase_core and firebase_messaging to pubspec.yaml
/// 2. Run `flutterfire configure` to generate firebase_options.dart
/// 3. Add google-services.json (Android) / GoogleService-Info.plist (iOS)
/// 4. Uncomment the Firebase imports and method bodies below
/// 5. Call NotificationService.instance.initialize() in main.dart
///
/// The FastAPI backend should call FCM HTTP API to send notifications when
/// new content is ready for review (in scheduler_service.py after content
/// generation completes).
library;

// Uncomment when Firebase is configured:
// import 'package:firebase_core/firebase_core.dart';
// import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();

  // Uncomment when Firebase is configured:
  // late final FirebaseMessaging _messaging;
  String? _fcmToken;

  String? get fcmToken => _fcmToken;

  /// Initialize Firebase Messaging and request permissions.
  Future<void> initialize() async {
    // Uncomment when Firebase is configured:
    //
    // _messaging = FirebaseMessaging.instance;
    //
    // // Request permissions (iOS/web)
    // final settings = await _messaging.requestPermission(
    //   alert: true,
    //   badge: true,
    //   sound: true,
    // );
    //
    // if (settings.authorizationStatus == AuthorizationStatus.authorized ||
    //     settings.authorizationStatus == AuthorizationStatus.provisional) {
    //   _fcmToken = await _messaging.getToken();
    //   print('FCM Token: $_fcmToken');
    //
    //   // Listen for token refresh
    //   _messaging.onTokenRefresh.listen((token) {
    //     _fcmToken = token;
    //     // TODO: Send new token to backend
    //   });
    //
    //   // Handle foreground messages
    //   FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    //
    //   // Handle background/terminated messages
    //   FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);
    //
    //   // Check if app was opened from a notification
    //   final initialMessage = await _messaging.getInitialMessage();
    //   if (initialMessage != null) {
    //     _handleMessageTap(initialMessage);
    //   }
    // }
  }

  /// Send FCM token to backend so it can push notifications.
  Future<void> registerTokenWithBackend(String apiBaseUrl, String authToken) async {
    if (_fcmToken == null) return;
    // TODO: POST /api/notifications/register-device
    // body: { "fcm_token": _fcmToken, "platform": "android|ios|web" }
  }

  // Uncomment when Firebase is configured:
  //
  // void _handleForegroundMessage(RemoteMessage message) {
  //   final title = message.notification?.title ?? 'New content ready';
  //   final body = message.notification?.body ?? 'Swipe to review';
  //   // Show local notification or in-app banner
  //   print('Foreground notification: $title — $body');
  // }
  //
  // void _handleMessageTap(RemoteMessage message) {
  //   final route = message.data['route'] as String?;
  //   if (route != null) {
  //     // Navigate to the specified route (e.g., '/feed')
  //     // This needs GoRouter access — wire through a callback or global key
  //   }
  // }
}

/// Backend notification payload format:
///
/// ```json
/// {
///   "notification": {
///     "title": "3 new articles ready",
///     "body": "Swipe right to publish"
///   },
///   "data": {
///     "route": "/feed",
///     "content_count": "3"
///   },
///   "token": "<fcm_token>"
/// }
/// ```
///
/// Send via: POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send
