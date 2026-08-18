import 'package:firebase_auth/firebase_auth.dart';

Future<void> signInWithGooglePopup(FirebaseAuth auth) async {
  final provider = GoogleAuthProvider()
    ..setCustomParameters(const {'prompt': 'select_account'});
  await auth.signInWithPopup(provider);
}

bool get googlePopupSignInSupported => true;
