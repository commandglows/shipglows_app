class FirestoreProjectionPaths {
  const FirestoreProjectionPaths._();

  static String user(String uid) => 'users/$uid';

  static String userProjectRef(String uid, String projectId) =>
      '${user(uid)}/projectRefs/$projectId';

  static String userFeedItem(String uid, String itemId) =>
      '${user(uid)}/feedItems/$itemId';

  static String project(String projectId) => 'projects/$projectId';

  static String projectMember(String projectId, String uid) =>
      '${project(projectId)}/members/$uid';

  static String indexedFile(String projectId, String fileId) =>
      '${project(projectId)}/indexedFiles/$fileId';

  static String indexRun(String projectId, String runId) =>
      '${project(projectId)}/indexRuns/$runId';

  static String diagnostic(String projectId, String diagnosticId) =>
      '${project(projectId)}/diagnostics/$diagnosticId';
}
