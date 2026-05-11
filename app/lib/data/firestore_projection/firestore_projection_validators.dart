import 'firestore_projection_models.dart';

const int maxIndexRunsPerProject = 20;

class FirestoreProjectionValidationError implements Exception {
  const FirestoreProjectionValidationError(this.message);

  final String message;

  @override
  String toString() => 'FirestoreProjectionValidationError($message)';
}

class FirestoreProjectionValidators {
  const FirestoreProjectionValidators._();

  static const Set<String> forbiddenClientFields = <String>{
    'sourceCommit',
    'projectionStatus',
    'githubConnectionStatus',
    'githubInstallations',
    'indexRuns',
    'diagnostics',
    'token',
    'accessToken',
    'installationToken',
    'clonePath',
    'cloneUrl',
    'serviceCredential',
    'serviceAccount',
  };

  static void validateClientWritablePayload(
    Map<String, Object?> payload, {
    Set<String> allowedClientFields = const <String>{},
  }) {
    for (final key in payload.keys) {
      if (forbiddenClientFields.contains(key)) {
        throw FirestoreProjectionValidationError(
          'Client payload contains forbidden field: $key',
        );
      }
      if (allowedClientFields.isNotEmpty && !allowedClientFields.contains(key)) {
        throw FirestoreProjectionValidationError(
          'Field is not client-writable: $key',
        );
      }
    }
  }

  static void validateProjectRole(ShipFlowProjectRole role) {
    if (role != ShipFlowProjectRole.owner && role != ShipFlowProjectRole.viewer) {
      throw const FirestoreProjectionValidationError(
        'Invalid project role. Allowed values: owner, viewer.',
      );
    }
  }

  static void validateSourceCommit(String sourceCommit) {
    if (sourceCommit.trim().isEmpty) {
      throw const FirestoreProjectionValidationError(
        'sourceCommit is required for projection records.',
      );
    }
  }

  static List<IndexRunRecord> retainLatestIndexRuns(
    List<IndexRunRecord> runs,
  ) {
    final sorted = [...runs]
      ..sort((a, b) => b.startedAt.compareTo(a.startedAt));
    return sorted.take(maxIndexRunsPerProject).toList(growable: false);
  }

  static void validateNoSecretLikeFields(Map<String, Object?> payload) {
    for (final key in payload.keys) {
      final lower = key.toLowerCase();
      if (lower.contains('token') ||
          lower.contains('credential') ||
          lower.contains('clonepath') ||
          lower.contains('clone_url') ||
          lower.contains('cloneurl')) {
        throw FirestoreProjectionValidationError(
          'Secret-like field is forbidden in client-readable payload: $key',
        );
      }
    }
  }
}
