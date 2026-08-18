import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_provider.dart';

final shipGlowsAuthProvider = Provider<ShipGlowsAuthProvider>(
  (ref) => DisabledShipGlowsAuthProvider(),
);

final shipGlowsSessionProvider = StreamProvider<ShipGlowsSession?>((
  ref,
) async* {
  final auth = ref.watch(shipGlowsAuthProvider);
  yield await auth.currentSession();
  yield* auth.authStateChanges.map((state) => state.session);
});
