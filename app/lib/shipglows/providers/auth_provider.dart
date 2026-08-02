import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_provider.dart';

final shipGlowsAuthProvider = Provider<ShipGlowsAuthProvider>(
  (ref) => DisabledShipGlowsAuthProvider(),
);
