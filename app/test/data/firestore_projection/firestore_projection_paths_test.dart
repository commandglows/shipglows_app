import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/firestore_projection/firestore_projection_paths.dart';

void main() {
  group('FirestoreProjectionPaths', () {
    test('builds user and project paths with opaque projectId', () {
      const projectId = 'proj_8f3c9a';
      expect(FirestoreProjectionPaths.user('u1'), 'users/u1');
      expect(
        FirestoreProjectionPaths.userProjectRef('u1', projectId),
        'users/u1/projectRefs/proj_8f3c9a',
      );
      expect(
        FirestoreProjectionPaths.project(projectId),
        'projects/proj_8f3c9a',
      );
      expect(
        FirestoreProjectionPaths.projectMember(projectId, 'u1'),
        'projects/proj_8f3c9a/members/u1',
      );
    });

    test('does not use owner/repo as document id', () {
      const opaqueProjectId = 'proj_a1b2c3';
      final path = FirestoreProjectionPaths.project(opaqueProjectId);
      expect(path.contains('octocat/hello-world'), isFalse);
      expect(path, 'projects/proj_a1b2c3');
    });
  });
}
