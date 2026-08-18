import 'package:firebase_auth/firebase_auth.dart';

Future<void> signInWithGooglePopup(FirebaseAuth auth) =>
    throw UnsupportedError('Google popup sign-in is Web-only.');

bool get googlePopupSignInSupported => false;
