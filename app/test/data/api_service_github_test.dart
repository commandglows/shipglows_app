import 'package:shipflow_app/data/services/api_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ApiService GitHub repositories', () {
    test('fetchAllGithubRepos paginates until the last partial page', () async {
      final api = _PagedGithubApiService({
        1: List.generate(
          2,
          (index) => {'full_name': 'owner/repo-$index'},
        ),
        2: [
          {'full_name': 'owner/repo-2'},
        ],
      });

      final repos = await api.fetchAllGithubRepos(perPage: 2);

      expect(
        repos.map((repo) => repo['full_name']).toList(),
        ['owner/repo-0', 'owner/repo-1', 'owner/repo-2'],
      );
      expect(api.pagesRequested, [1, 2]);
    });

    test('fetchAllGithubRepos deduplicates repositories by full_name', () async {
      final api = _PagedGithubApiService({
        1: [
          {'full_name': 'owner/repo'},
          {'full_name': 'owner/repo'},
        ],
        2: <Map<String, dynamic>>[],
      });

      final repos = await api.fetchAllGithubRepos(perPage: 2);

      expect(repos, hasLength(1));
      expect(repos.single['full_name'], 'owner/repo');
    });
  });
}

class _PagedGithubApiService extends ApiService {
  _PagedGithubApiService(this.pages) : super(baseUrl: 'https://api.test');

  final Map<int, List<Map<String, dynamic>>> pages;
  final pagesRequested = <int>[];

  @override
  Future<List<Map<String, dynamic>>> fetchGithubRepos({
    String? query,
    int perPage = 100,
    int page = 1,
  }) async {
    pagesRequested.add(page);
    return pages[page] ?? const <Map<String, dynamic>>[];
  }
}
