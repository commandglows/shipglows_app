const bool supportsLocalFileSystem = false;

class File {
  File(this.path);

  final String path;

  bool existsSync() => false;
  String resolveSymbolicLinksSync() => path;
  File get absolute => this;
}

class Directory {
  Directory(this.path);

  final String path;

  Directory get absolute => this;
}

class FileSystemException implements Exception {
  const FileSystemException([this.message = '']);

  final String message;
}
