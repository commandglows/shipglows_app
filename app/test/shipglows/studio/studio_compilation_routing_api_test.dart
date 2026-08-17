import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/studio/studio_compilation_routing.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

const _revision = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const _repositoryDigest =
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

void main() {
  test(
    'strictly parses the canonical cross-language routing fixture',
    () async {
      final fixture = await _freshFixture();
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = _JsonAdapter(fixture);
      final projection =
          await ManagedRunnerApi(
            baseUrl: 'https://runner.example',
            dio: dio,
          ).studioCompilationRouting(
            projectId: 'shipglows_app',
            sourceRevision: _revision,
            repositoryDigest: _repositoryDigest,
          );

      expect(projection.contractVersion, 'shipglows.compilation-routing.v1');
      expect(projection.projectKind, StudioProjectKind.flutter);
      expect(
        projection.artifactDigests.map((artifact) => artifact.path),
        const [
          'app/android/settings.gradle',
          'app/ios/Runner.xcodeproj/project.pbxproj',
          'app/pubspec.lock',
          'app/pubspec.yaml',
          'app/web/index.html',
          'app/windows/CMakeLists.txt',
        ],
      );
      expect(
        projection.routes.map((route) => route.target),
        StudioArtifactTarget.values,
      );
      expect(projection.implicitTarget, isNull);
      expect(
        projection.routeFor(StudioArtifactTarget.windows).environment,
        StudioExecutionEnvironment.windows,
      );
      expect(
        projection.routes.every((route) => !route.compilerAvailable),
        isTrue,
      );
    },
  );

  test(
    'rejects identity drift, privileged additions, and target matrix drift',
    () async {
      Future<void> rejects(Map<String, Object?> body) async {
        final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
          ..httpClientAdapter = _JsonAdapter(body);
        final api = ManagedRunnerApi(
          baseUrl: 'https://runner.example',
          dio: dio,
        );
        await expectLater(
          api.studioCompilationRouting(
            projectId: 'shipglows_app',
            sourceRevision: _revision,
            repositoryDigest: _repositoryDigest,
          ),
          throwsA(isA<ManagedRunnerException>()),
        );
      }

      final extra = await _freshFixture()
        ..['provider'] = 'vercel';
      await rejects(extra);
      final staleRevision = await _freshFixture()
        ..['sourceRevision'] = 'cccccccccccccccccccccccccccccccccccccccc';
      await rejects(staleRevision);
      final override = await _freshFixture();
      (override['routes'] as List).first = {
        ...(override['routes'] as List).first as Map<String, dynamic>,
        'executionClass': 'windowsVm',
      };
      await rejects(override);
      final selected = await _freshFixture()
        ..['selectedTarget'] = 'flutterWindows';
      await rejects(selected);
    },
  );

  test(
    'rejects excessive, extra, missing, double Android, and route-incoherent artifacts',
    () async {
      Future<void> rejects(Map<String, Object?> body) async {
        final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
          ..httpClientAdapter = _JsonAdapter(body);
        await expectLater(
          ManagedRunnerApi(
            baseUrl: 'https://runner.example',
            dio: dio,
          ).studioCompilationRouting(
            projectId: 'shipglows_app',
            sourceRevision: _revision,
            repositoryDigest: _repositoryDigest,
          ),
          throwsA(isA<ManagedRunnerException>()),
        );
      }

      final excessive = await _freshFixture();
      final excessiveArtifacts = excessive['artifactDigests'] as List;
      for (var index = 0; index < 11; index += 1) {
        excessiveArtifacts.add({
          'path': 'app/z-extra-${index.toString().padLeft(2, '0')}',
          'digest': _digest('${index % 10}'),
        });
      }
      await rejects(excessive);

      final extraMarker = await _freshFixture();
      (extraMarker['artifactDigests'] as List).add({
        'path': 'app/z-extra-marker',
        'digest': _digest('7'),
      });
      await rejects(extraMarker);

      final missingMarker = await _freshFixture();
      (missingMarker['artifactDigests'] as List).removeWhere(
        (artifact) =>
            (artifact as Map<String, dynamic>)['path'] ==
            'app/windows/CMakeLists.txt',
      );
      await rejects(missingMarker);

      final doubleAndroid = await _freshFixture();
      (doubleAndroid['artifactDigests'] as List).insert(1, {
        'path': 'app/android/settings.gradle.kts',
        'digest': _digest('8'),
      });
      await rejects(doubleAndroid);

      final noAndroid = await _freshFixture();
      (noAndroid['artifactDigests'] as List).removeWhere(
        (artifact) =>
            (artifact as Map<String, dynamic>)['path'] ==
            'app/android/settings.gradle',
      );
      await rejects(noAndroid);

      final incoherentRoute = await _freshFixture();
      final iosRoute = (incoherentRoute['routes'] as List)
          .cast<Map<String, dynamic>>()
          .singleWhere((route) => route['target'] == 'flutterIos');
      iosRoute['projectSupported'] = false;
      iosRoute['compilerAvailability'] = 'unavailable';
      iosRoute['reason'] = 'targetNotDeclared';
      await rejects(incoherentRoute);
    },
  );
}

Future<Map<String, Object?>> _freshFixture() async {
  final raw = await File(
    '../test/fixtures/studio/compilation-routing-v1.json',
  ).readAsString();
  final value = Map<String, Object?>.from(jsonDecode(raw) as Map);
  final now = DateTime.now().toUtc();
  value['observedAt'] = now
      .subtract(const Duration(seconds: 1))
      .toIso8601String();
  value['expiresAt'] = now.add(const Duration(minutes: 14)).toIso8601String();
  return value;
}

String _digest(String character) => List.filled(64, character).join();

class _JsonAdapter implements HttpClientAdapter {
  _JsonAdapter(this.body);
  final Map<String, Object?> body;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => ResponseBody.fromString(
    jsonEncode(body),
    200,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );

  @override
  void close({bool force = false}) {}
}
