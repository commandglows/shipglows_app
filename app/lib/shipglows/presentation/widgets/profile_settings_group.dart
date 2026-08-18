import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/auth_provider.dart';
import '../../providers/auth_provider.dart';
import 'settings_primitives.dart';

class ShipGlowsProfileSettingsGroup extends ConsumerWidget {
  const ShipGlowsProfileSettingsGroup({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(shipGlowsAuthProvider);
    if (!auth.requiresAuthentication) return const SizedBox.shrink();

    final session = ref.watch(shipGlowsSessionProvider);
    return ShipGlowsSettingsGroup(
      title: 'Profil',
      children: [
        session.when(
          data: (value) => value == null
              ? const ShipGlowsSettingsRow(
                  title: 'Aucun compte connecté',
                  subtitle: 'Reconnectez-vous pour accéder à votre espace.',
                  icon: Icons.person_off_outlined,
                )
              : _AuthenticatedProfile(session: value),
          loading: () => const ShipGlowsSettingsRow(
            title: 'Vérification du compte',
            subtitle: 'Chargement de votre identité…',
            icon: Icons.person_search_outlined,
          ),
          error: (_, _) => ShipGlowsSettingsRow(
            title: 'Identité indisponible',
            subtitle: 'Réessayez ou reconnectez votre compte.',
            icon: Icons.error_outline_rounded,
            onTap: () => ref.invalidate(shipGlowsSessionProvider),
          ),
        ),
        ShipGlowsSettingsRow(
          title: 'Se déconnecter',
          subtitle: 'Fermer cette session Google sur cet appareil.',
          icon: Icons.logout_rounded,
          onTap: auth.signOut,
        ),
      ],
    );
  }
}

class _AuthenticatedProfile extends StatelessWidget {
  const _AuthenticatedProfile({required this.session});

  final ShipGlowsSession session;

  @override
  Widget build(BuildContext context) {
    final name =
        _nonEmpty(session.displayName) ??
        _nonEmpty(session.email) ??
        'Compte Google';
    final email = _nonEmpty(session.email);
    final provider = session.providerId == 'google.com' ? 'Google' : 'Compte';
    final subtitle = [
      if (email != null && email != name) email,
      'Connecté avec $provider',
    ].join(' · ');
    final profileImage = _profileImage(session.photoUrl);

    return Semantics(
      label: 'Compte connecté : $name',
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: profileImage,
          child: profileImage == null ? Text(_initials(name)) : null,
        ),
        title: Text(name),
        subtitle: Text(subtitle),
      ),
    );
  }

  ImageProvider<Object>? _profileImage(String? value) {
    final url = _nonEmpty(value);
    if (url == null) return null;
    final uri = Uri.tryParse(url);
    return uri != null && uri.scheme == 'https' ? NetworkImage(url) : null;
  }

  String _initials(String value) {
    final words = value.trim().split(RegExp(r'\s+'));
    return words.take(2).map((word) => word[0].toUpperCase()).join();
  }

  String? _nonEmpty(String? value) {
    final normalized = value?.trim();
    return normalized == null || normalized.isEmpty ? null : normalized;
  }
}
