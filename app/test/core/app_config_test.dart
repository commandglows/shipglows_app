import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/core/app_config.dart';

void main() {
  test('local Studio auth accepts only the exact loopback runner', () {
    expect(AppConfig.isLocalStudioRunner('http://127.0.0.1:3210'), isTrue);
    expect(AppConfig.isLocalStudioRunner('http://127.0.0.1:3210/'), isTrue);
    expect(AppConfig.isLocalStudioRunner('http://localhost:3210'), isFalse);
    expect(AppConfig.isLocalStudioRunner('https://127.0.0.1:3210'), isFalse);
    expect(AppConfig.isLocalStudioRunner('http://127.0.0.1:9999'), isFalse);
    expect(
      AppConfig.isLocalStudioRunner('https://runner.shipglows.com'),
      isFalse,
    );
  });
}
