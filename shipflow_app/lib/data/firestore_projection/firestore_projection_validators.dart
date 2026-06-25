import 'firestore_projection_models.dart';

const int maxIndexRunsPerProject = 20;
const int maxIndexFileBytes = 2 * 1024 * 1024;
const int maxIndexRefreshBytes = 20 * 1024 * 1024;

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
    'privateKey',
    'x-access-token',
  };

  static final RegExp _requestIdPattern = RegExp(
    r'^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$',
  );
  static final RegExp _githubNamePattern = RegExp(r'^[A-Za-z0-9_.-]+$');
  static final RegExp _shaPattern = RegExp(r'^[0-9a-fA-F]{7,64}$');

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
      if (allowedClientFields.isNotEmpty &&
          !allowedClientFields.contains(key)) {
        throw FirestoreProjectionValidationError(
          'Field is not client-writable: $key',
        );
      }
    }
  }

  static void validateProjectRole(ShipFlowProjectRole role) {
    if (role != ShipFlowProjectRole.owner &&
        role != ShipFlowProjectRole.viewer) {
      throw const FirestoreProjectionValidationError(
        'Invalid project role. Allowed values: owner, viewer.',
      );
    }
  }

  static void validateSourceCommit(String sourceCommit) {
    final trimmed = sourceCommit.trim();
    if (trimmed.isEmpty) {
      throw const FirestoreProjectionValidationError(
        'sourceCommit is required for projection records.',
      );
    }
    if (!_shaPattern.hasMatch(trimmed)) {
      throw const FirestoreProjectionValidationError(
        'sourceCommit must be a Git commit SHA-like value.',
      );
    }
  }

  static void validateRequestId(String requestId) {
    if (!_requestIdPattern.hasMatch(requestId.trim())) {
      throw const FirestoreProjectionValidationError(
        'requestId must be 8-128 characters and contain only URL-safe idempotency characters.',
      );
    }
  }

  static void validateGitHubRepository({
    required String owner,
    required String repo,
    required String fullName,
  }) {
    final normalizedOwner = owner.trim();
    final normalizedRepo = repo.trim();
    if (normalizedOwner.isEmpty ||
        normalizedRepo.isEmpty ||
        !_githubNamePattern.hasMatch(normalizedOwner) ||
        !_githubNamePattern.hasMatch(normalizedRepo) ||
        normalizedOwner.startsWith('.') ||
        normalizedRepo.startsWith('.')) {
      throw const FirestoreProjectionValidationError(
        'GitHub owner and repo must be non-empty safe GitHub name segments.',
      );
    }
    if (fullName.trim() != '$normalizedOwner/$normalizedRepo') {
      throw const FirestoreProjectionValidationError(
        'GitHub fullName must match owner/repo and remain data, not a document id.',
      );
    }
  }

  static void validateOneActiveRun({
    required ActiveIndexRunRecord? activeRun,
    required String requestId,
  }) {
    validateRequestId(requestId);
    if (activeRun == null) {
      return;
    }
    final active =
        activeRun.status == IndexRunStatus.queued ||
        activeRun.status == IndexRunStatus.running;
    if (!active) {
      return;
    }
    if (activeRun.requestId == requestId) {
      return;
    }
    throw const FirestoreProjectionValidationError(
      'A different index request is already queued or running for this project.',
    );
  }

  static void validateIndexFileBytes(int bytes) {
    if (bytes < 0 || bytes > maxIndexFileBytes) {
      throw const FirestoreProjectionValidationError(
        'Indexed file exceeds the 2 MB per-file budget.',
      );
    }
  }

  static void validateIndexRefreshBytes(int bytes) {
    if (bytes < 0 || bytes > maxIndexRefreshBytes) {
      throw const FirestoreProjectionValidationError(
        'Index refresh exceeds the 20 MB total refresh budget.',
      );
    }
  }

  static List<IndexRunRecord> retainLatestIndexRuns(List<IndexRunRecord> runs) {
    final sorted = [...runs]
      ..sort((a, b) => b.startedAt.compareTo(a.startedAt));
    return sorted.take(maxIndexRunsPerProject).toList(growable: false);
  }

  static void validateNoSecretLikeFields(Map<String, Object?> payload) {
    void walk(Object? value, String path) {
      if (value is Map) {
        for (final entry in value.entries) {
          final key = entry.key.toString();
          final currentPath = path.isEmpty ? key : '$path.$key';
          _validateSecretLikeKey(currentPath);
          walk(entry.value, currentPath);
        }
        return;
      }
      if (value is Iterable && value is! String) {
        var index = 0;
        for (final item in value) {
          walk(item, '$path[$index]');
          index += 1;
        }
      }
    }

    walk(payload, '');
  }

  static void _validateSecretLikeKey(String key) {
    final lower = key.toLowerCase();
    if (lower.contains('token') ||
        lower.contains('credential') ||
        lower.contains('privatekey') ||
        lower.contains('x-access-token') ||
        lower.contains('clonepath') ||
        lower.contains('clone_url') ||
        lower.contains('cloneurl')) {
      throw FirestoreProjectionValidationError(
        'Secret-like field is forbidden in client-readable payload: $key',
      );
    }
  }
}
