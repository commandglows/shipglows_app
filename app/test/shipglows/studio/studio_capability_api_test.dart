import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

void main() {
  test(
    'accepts only the exact read-only Studio capability projection',
    () async {
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = _JsonAdapter({
          'supported': true,
          'reason': 'trustedFirstPartyBase',
          'contractVersion': 'shipglows.studio.v1',
          'bridgeVersion': 'shipglows.studio.bridge.v1',
          'profileId': 'shipglows.astro.hero.v1',
          'previewOrigin': 'http://127.0.0.1:3003',
          'capabilities': ['inspect'],
          'surfaces': [
            {'id': 'hero.root', 'label': 'Hero', 'sourceConfidence': 'exact'},
          ],
        });
      final capability = await ManagedRunnerApi(
        baseUrl: 'https://runner.example',
        dio: dio,
      ).studioCapability(projectId: 'shipglows_app');

      expect(capability.profileId, 'shipglows.astro.hero.v1');
      expect(capability.previewOrigin.origin, 'http://127.0.0.1:3003');
      expect(capability.surfaces.single.id, 'hero.root');
    },
  );

  test('rejects a client-writable or non-loopback projection', () async {
    final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
      ..httpClientAdapter = _JsonAdapter({
        'supported': true,
        'reason': 'trustedFirstPartyBase',
        'contractVersion': 'shipglows.studio.v1',
        'bridgeVersion': 'shipglows.studio.bridge.v1',
        'profileId': 'shipglows.astro.hero.v1',
        'previewOrigin': 'https://evil.example',
        'capabilities': ['token.set'],
        'surfaces': [
          {'id': 'hero.root', 'label': 'Hero', 'sourceConfidence': 'exact'},
        ],
      });
    final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

    expect(
      () => api.studioCapability(projectId: 'shipglows_app'),
      throwsA(isA<ManagedRunnerException>()),
    );
  });
}

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
