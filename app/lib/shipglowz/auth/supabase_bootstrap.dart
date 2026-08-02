import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_provider.dart';

/// Public, compile-time configuration for the optional Supabase adapter.
///
/// A publishable key may be distributed to a Flutter client. Service-role and
/// other privileged keys must never be placed in a `--dart-define` value.
class SupabaseBootstrapConfiguration {
  const SupabaseBootstrapConfiguration({
    required this.url,
    required this.publishableKey,
  });

  const SupabaseBootstrapConfiguration.fromEnvironment()
      : url = const String.fromEnvironment('SUPABASE_URL'),
        publishableKey = const String.fromEnvironment(
          'SUPABASE_PUBLISHABLE_KEY',
        );

  final String url;
  final String publishableKey;

  bool get isConfigured => url.trim().isNotEmpty && publishableKey.trim().isNotEmpty;

  Uri? get validUrl {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return null;
    if (uri.scheme != 'https' && uri.scheme != 'http') return null;
    return uri;
  }
}

/// Starts the first authentication adapter without making Supabase a UI-wide
/// dependency. In an unconfigured build, the local dashboard stays available.
Future<ShipGlowzAuthProvider> bootstrapShipGlowzAuth(
  SupabaseBootstrapConfiguration configuration,
) async {
  if (!configuration.isConfigured || configuration.validUrl == null) {
    return const DisabledShipGlowzAuthProvider();
  }

  final client = await Supabase.initialize(
    url: configuration.validUrl.toString(),
    publishableKey: configuration.publishableKey.trim(),
  );
  return SupabaseShipGlowzAuthProvider(
    SupabaseFlutterSessionSource(client.client.auth),
  );
}
