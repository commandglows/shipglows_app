import 'package:flutter/foundation.dart';

const String productEntitlementProductId = 'shipglowz_app';

enum ProductEntitlementStatus {
  active,
  trialing,
  pendingReview,
  inactive,
  revoked,
  refunded,
  expired,
  unavailable,
  malformed,
  missing,
  unknown,
}

enum ProductEntitlementSnapshotOrigin { direct, list, unavailable, malformed }

@immutable
class ProductEntitlementSnapshot {
  const ProductEntitlementSnapshot({
    required this.productId,
    required this.status,
    required this.grantsAccess,
    required this.origin,
    this.planId,
    this.environment,
    this.expiresAt,
    this.reason,
  });

  final String productId;
  final ProductEntitlementStatus status;
  final bool grantsAccess;
  final ProductEntitlementSnapshotOrigin origin;
  final String? planId;
  final String? environment;
  final DateTime? expiresAt;
  final String? reason;

  bool get isActive {
    return status == ProductEntitlementStatus.active;
  }

  bool get isTrialing {
    return status == ProductEntitlementStatus.trialing;
  }

  bool get isPendingReview {
    return status == ProductEntitlementStatus.pendingReview;
  }

  bool get hasExpired {
    final parsedExpiresAt = expiresAt;
    if (parsedExpiresAt == null) {
      return false;
    }
    return !parsedExpiresAt.isAfter(DateTime.now());
  }

  bool get grantsActiveEntitlement {
    return status == ProductEntitlementStatus.active ||
        (status == ProductEntitlementStatus.trialing && !hasExpired);
  }

  String? get expiresAtIso {
    return expiresAt?.toIso8601String();
  }

  factory ProductEntitlementSnapshot.missing(String productId) {
    return ProductEntitlementSnapshot(
      productId: productId,
      status: ProductEntitlementStatus.missing,
      grantsAccess: false,
      origin: ProductEntitlementSnapshotOrigin.unavailable,
      reason: 'No snapshot found for product.',
    );
  }

  factory ProductEntitlementSnapshot.unavailable(
    String productId,
    String reason,
  ) {
    return ProductEntitlementSnapshot(
      productId: productId,
      status: ProductEntitlementStatus.unavailable,
      grantsAccess: false,
      origin: ProductEntitlementSnapshotOrigin.unavailable,
      reason: reason,
    );
  }

  factory ProductEntitlementSnapshot.malformed({
    required String productId,
    required String reason,
  }) {
    return ProductEntitlementSnapshot(
      productId: productId,
      status: ProductEntitlementStatus.malformed,
      grantsAccess: false,
      origin: ProductEntitlementSnapshotOrigin.malformed,
      reason: reason,
    );
  }

  factory ProductEntitlementSnapshot.fromJson(Map<String, dynamic> json) {
    final rawProductId =
        _asString(json['product_id']) ?? _asString(json['productId']);
    final productId = rawProductId ?? productEntitlementProductId;
    final rawStatus = _asString(json['status'])?.toLowerCase().trim();
    if (rawProductId == null) {
      return ProductEntitlementSnapshot.missing(productEntitlementProductId);
    }
    if (productId != productEntitlementProductId) {
      return ProductEntitlementSnapshot.missing(productEntitlementProductId);
    }
    final status = _parseStatus(rawStatus);
    if (status == ProductEntitlementStatus.malformed) {
      return ProductEntitlementSnapshot.malformed(
        productId: productId,
        reason: 'Unsupported entitlement status.',
      );
    }
    if (status == ProductEntitlementStatus.missing) {
      return ProductEntitlementSnapshot.missing(productId);
    }

    final planId = _asString(json['plan_id']) ?? _asString(json['planId']);
    final environment = _asString(json['environment'])?.trim().toLowerCase();
    if (environment == null || environment.isEmpty) {
      return ProductEntitlementSnapshot.malformed(
        productId: productId,
        reason: 'Entitlement snapshot is missing environment.',
      );
    }

    final serverGrantsAccess =
        _asBool(json['grants_access']) ?? _asBool(json['grantsAccess']);
    if (serverGrantsAccess == null) {
      return ProductEntitlementSnapshot.malformed(
        productId: productId,
        reason: 'Entitlement snapshot is missing grants_access.',
      );
    }

    final expiresAt = _asDate(json['expires_at']) ?? _asDate(json['expiresAt']);
    final now = DateTime.now();
    final isExpired = expiresAt != null && !expiresAt.isAfter(now);

    if (status == ProductEntitlementStatus.trialing && isExpired) {
      return ProductEntitlementSnapshot(
        productId: productId,
        status: ProductEntitlementStatus.expired,
        grantsAccess: false,
        origin: ProductEntitlementSnapshotOrigin.direct,
        planId: planId,
        environment: environment,
        expiresAt: expiresAt,
        reason: 'Trial entitlement is expired.',
      );
    }

    return ProductEntitlementSnapshot(
      productId: productId,
      status: status,
      grantsAccess:
          serverGrantsAccess &&
          (status == ProductEntitlementStatus.active ||
              status == ProductEntitlementStatus.trialing),
      origin: ProductEntitlementSnapshotOrigin.direct,
      planId: planId,
      environment: environment,
      expiresAt: expiresAt,
      reason: _asString(json['reason']),
    );
  }

  static ProductEntitlementSnapshot extractFromBootstrapPayload(
    Map<String, dynamic> payload,
  ) {
    return _findEntitlementMapInPayload(payload) ??
        ProductEntitlementSnapshot.missing(productEntitlementProductId);
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'status': _statusToWire(status),
      'plan_id': planId,
      'grants_access': grantsAccess,
      'environment': environment,
      'expires_at': expiresAtIso,
      'reason': reason,
    };
  }

  static ProductEntitlementSnapshot? _findEntitlementMapInPayload(
    Map<String, dynamic> payload,
  ) {
    final candidates = [
      payload['entitlement'],
      payload['product_entitlement'],
      payload['productEntitlement'],
      payload['entitlement_snapshot'],
      payload['entitlementSnapshot'],
      payload['product_entitlement_snapshot'],
      payload['productEntitlementSnapshot'],
    ];
    for (final candidate in candidates) {
      final map = _asMap(candidate);
      if (map != null) {
        final snapshot = ProductEntitlementSnapshot._fromCandidateMap(map);
        if (snapshot.productId == productEntitlementProductId) {
          return snapshot;
        }
      }
    }

    final list =
        _asList(payload['product_entitlements']) ??
        _asList(payload['entitlements']);
    if (list != null) {
      for (final item in list) {
        final map = _asMap(item);
        if (map == null) {
          continue;
        }
        final snapshot = ProductEntitlementSnapshot._fromCandidateMap(map);
        if (snapshot.productId == productEntitlementProductId &&
            snapshot.status != ProductEntitlementStatus.missing) {
          return snapshot;
        }
      }
    }

    return null;
  }

  static ProductEntitlementSnapshot _fromCandidateMap(
    Map<String, dynamic> map,
  ) {
    final status = _parseStatus(_asString(map['status'])?.toLowerCase().trim());
    if (status == ProductEntitlementStatus.missing) {
      return ProductEntitlementSnapshot.missing(productEntitlementProductId);
    }
    if (status == ProductEntitlementStatus.malformed) {
      return ProductEntitlementSnapshot.malformed(
        productId:
            _asString(map['product_id']) ??
            _asString(map['productId']) ??
            productEntitlementProductId,
        reason: 'Unsupported entitlement status.',
      );
    }
    return ProductEntitlementSnapshot.fromJson(map);
  }
}

ProductEntitlementStatus _parseStatus(String? input) {
  switch (input?.toLowerCase().trim()) {
    case 'active':
      return ProductEntitlementStatus.active;
    case 'trialing':
      return ProductEntitlementStatus.trialing;
    case 'pending_review':
    case 'pendingreview':
    case 'pending':
      return ProductEntitlementStatus.pendingReview;
    case 'inactive':
      return ProductEntitlementStatus.inactive;
    case 'revoked':
      return ProductEntitlementStatus.revoked;
    case 'refunded':
      return ProductEntitlementStatus.refunded;
    case 'expired':
      return ProductEntitlementStatus.expired;
    case null:
    case '':
      return ProductEntitlementStatus.missing;
    default:
      return ProductEntitlementStatus.malformed;
  }
}

String _statusToWire(ProductEntitlementStatus status) {
  return switch (status) {
    ProductEntitlementStatus.active => 'active',
    ProductEntitlementStatus.trialing => 'trialing',
    ProductEntitlementStatus.pendingReview => 'pending_review',
    ProductEntitlementStatus.inactive => 'inactive',
    ProductEntitlementStatus.revoked => 'revoked',
    ProductEntitlementStatus.refunded => 'refunded',
    ProductEntitlementStatus.expired => 'expired',
    ProductEntitlementStatus.unavailable => 'unavailable',
    ProductEntitlementStatus.malformed => 'malformed',
    ProductEntitlementStatus.missing => 'missing',
    ProductEntitlementStatus.unknown => 'unknown',
  };
}

String? _asString(Object? value) {
  return value?.toString();
}

bool? _asBool(Object? value) {
  if (value is bool) {
    return value;
  }
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1' || normalized == 'yes') {
      return true;
    }
    if (normalized == 'false' || normalized == '0' || normalized == 'no') {
      return false;
    }
  }
  if (value is num) {
    if (value == 1) {
      return true;
    }
    if (value == 0) {
      return false;
    }
  }
  return null;
}

DateTime? _asDate(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is DateTime) {
    return value;
  }
  if (value is int) {
    try {
      return DateTime.fromMillisecondsSinceEpoch(value);
    } catch (_) {
      return null;
    }
  }
  if (value is String) {
    return DateTime.tryParse(value);
  }
  return null;
}

Map<String, dynamic>? _asMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, inner) => MapEntry(key.toString(), inner));
  }
  return null;
}

List<dynamic>? _asList(Object? value) {
  return value is List ? value : null;
}
