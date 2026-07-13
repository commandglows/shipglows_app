import 'package:flutter_test/flutter_test.dart';

import 'package:shipglowz_app/data/models/app_bootstrap.dart';
import 'package:shipglowz_app/data/models/app_entitlement.dart';

void main() {
  group('ProductEntitlementSnapshot', () {
    test('parses active product entitlement and grants access', () {
      const payload = {
        'product_entitlements': [
          {
            'product_id': 'shipglowz_app',
            'status': 'active',
            'plan_id': 'pro',
            'environment': 'local',
            'grants_access': true,
          },
        ],
      };

      final bootstrap = AppBootstrap.fromJson(payload);
      final entitlement = bootstrap.entitlement;

      expect(entitlement?.productId, 'shipglowz_app');
      expect(entitlement?.status, ProductEntitlementStatus.active);
      expect(entitlement?.grantsAccess, isTrue);
      expect(entitlement?.planId, 'pro');
      expect(entitlement?.isActive, isTrue);
    });

    test('parses active trialing entitlement until expiry', () {
      final payload = {
        'entitlement': {
          'product_id': 'shipglowz_app',
          'status': 'trialing',
          'environment': 'local',
          'grants_access': true,
          'expires_at': DateTime.now()
              .add(const Duration(days: 1))
              .toIso8601String(),
        },
      };

      final bootstrap = AppBootstrap.fromJson(payload);
      final entitlement = bootstrap.entitlement;

      expect(entitlement?.status, ProductEntitlementStatus.trialing);
      expect(entitlement?.grantsAccess, isTrue);
      expect(entitlement?.isTrialing, isTrue);
      expect(entitlement?.isPendingReview, isFalse);
      expect(entitlement?.hasExpired, isFalse);
    });

    test('marks expired trialing entitlement inactive', () {
      final payload = {
        'entitlement_snapshot': {
          'product_id': 'shipglowz_app',
          'status': 'trialing',
          'environment': 'local',
          'grants_access': true,
          'expires_at': DateTime.now()
              .subtract(const Duration(days: 1))
              .toIso8601String(),
        },
      };

      final bootstrap = AppBootstrap.fromJson(payload);
      final entitlement = bootstrap.entitlement;

      expect(entitlement?.status, ProductEntitlementStatus.expired);
      expect(entitlement?.grantsAccess, isFalse);
    });

    test('keeps top-level bootstrap fields from granting access', () {
      final payload = {
        'product_id': 'shipglowz_app',
        'status': 'active',
        'plan_id': 'pro',
        'global_user_id': 'evil_user',
      };

      final bootstrap = AppBootstrap.fromJson(payload);
      final entitlement = bootstrap.entitlement;

      expect(entitlement?.status, ProductEntitlementStatus.missing);
      expect(entitlement?.grantsAccess, isFalse);
    });

    test('returns malformed for unsupported entitlement status', () {
      final payload = {
        'product_entitlement': {
          'product_id': 'shipglowz_app',
          'status': 'unexpected_status',
          'environment': 'local',
          'grants_access': true,
        },
      };

      final bootstrap = AppBootstrap.fromJson(payload);

      expect(bootstrap.entitlement?.status, ProductEntitlementStatus.malformed);
    });

    test('fails closed when active snapshot omits environment', () {
      final bootstrap = AppBootstrap.fromJson(const {
        'entitlement': {
          'product_id': 'shipglowz_app',
          'status': 'active',
          'grants_access': true,
        },
      });

      expect(bootstrap.entitlement?.status, ProductEntitlementStatus.malformed);
      expect(bootstrap.entitlement?.grantsAccess, isFalse);
    });

    test('fails closed when active snapshot omits grants_access', () {
      final bootstrap = AppBootstrap.fromJson(const {
        'entitlement': {
          'product_id': 'shipglowz_app',
          'status': 'active',
          'environment': 'local',
        },
      });

      expect(bootstrap.entitlement?.status, ProductEntitlementStatus.malformed);
      expect(bootstrap.entitlement?.grantsAccess, isFalse);
    });

    test('respects server-owned grants_access false for active status', () {
      final bootstrap = AppBootstrap.fromJson(const {
        'entitlement': {
          'product_id': 'shipglowz_app',
          'status': 'active',
          'environment': 'local',
          'grants_access': false,
        },
      });

      expect(bootstrap.entitlement?.status, ProductEntitlementStatus.active);
      expect(bootstrap.entitlement?.grantsAccess, isFalse);
    });
  });
}
