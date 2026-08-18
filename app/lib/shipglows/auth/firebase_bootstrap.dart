import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

import 'auth_provider.dart';
import 'google_popup_sign_in.dart';

/// Public Firebase client configuration supplied at compile time.
///
/// These values identify the client application; privileged service-account
/// credentials must never be embedded in a Flutter build.
class FirebaseBootstrapConfiguration {
  const FirebaseBootstrapConfiguration({
    required this.apiKey,
    required this.appId,
    required this.messagingSenderId,
    required this.projectId,
    this.authDomain,
  });

  const FirebaseBootstrapConfiguration.fromEnvironment()
    : apiKey = const String.fromEnvironment('FIREBASE_API_KEY'),
      appId = const String.fromEnvironment('FIREBASE_APP_ID'),
      messagingSenderId = const String.fromEnvironment(
        'FIREBASE_MESSAGING_SENDER_ID',
      ),
      projectId = const String.fromEnvironment('FIREBASE_PROJECT_ID'),
      authDomain = const String.fromEnvironment('FIREBASE_AUTH_DOMAIN');

  final String apiKey;
  final String appId;
  final String messagingSenderId;
  final String projectId;
  final String? authDomain;

  bool get isConfigured =>
      apiKey.trim().isNotEmpty &&
      appId.trim().isNotEmpty &&
      messagingSenderId.trim().isNotEmpty &&
      projectId.trim().isNotEmpty;

  FirebaseOptions get options => FirebaseOptions(
    apiKey: apiKey.trim(),
    appId: appId.trim(),
    messagingSenderId: messagingSenderId.trim(),
    projectId: projectId.trim(),
    authDomain: authDomain?.trim().isEmpty ?? true ? null : authDomain!.trim(),
  );
}

Future<ShipGlowsAuthProvider> bootstrapShipGlowsAuth(
  FirebaseBootstrapConfiguration configuration,
) async {
  if (!configuration.isConfigured) return const DisabledShipGlowsAuthProvider();

  final app = Firebase.apps.isEmpty
      ? await Firebase.initializeApp(options: configuration.options)
      : Firebase.app();
  final auth = FirebaseAuth.instanceFor(app: app);
  return FirebaseShipGlowsAuthProvider(
    FirebaseFlutterSessionSource(auth),
    googleSignIn: googlePopupSignInSupported
        ? () => signInWithGooglePopup(auth)
        : null,
    signOut: auth.signOut,
  );
}
