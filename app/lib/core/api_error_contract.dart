enum ApiErrorType { unauthorized, offline, server, invalidResponse, unknown }

class ApiException implements Exception {
  const ApiException(
    this.type,
    this.message, {
    this.statusCode,
    this.responseBody,
    this.responseHeaders = const <String, String>{},
    this.method,
    this.path,
  });

  final ApiErrorType type;
  final String message;
  final int? statusCode;
  final String? responseBody;
  final Map<String, String> responseHeaders;
  final String? method;
  final String? path;

  bool get isUnauthorized => type == ApiErrorType.unauthorized;
  bool get isOffline => type == ApiErrorType.offline;

  @override
  String toString() => message;
}
