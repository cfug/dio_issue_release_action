import 'package:github/github.dart';
import 'package:github_action_core/github_action_core.dart';

late GitHub github;
late String githubToken;
bool showGithubLog = false;

Future<bool> checkUserWritePermission({
  required String owner,
  required String repo,
  required String username,
}) async {
  final response = await github.getJSON<Map, Map>(
      '/repos/$owner/$repo/collaborators/$username/permission');

  if (showGithubLog) {
    debug('checkUserWritePermission response: $response');
  }

  final permission = response['permission'];
  return permission == 'admin' || permission == 'write';
}

Future<Release> releasePkg({
  required String owner,
  required String repo,
  required String tag,
  required String name,
  required String body,
}) {
  final createRelease = CreateRelease.from(
    tagName: tag,
    name: name,
    targetCommitish: 'main',
    isDraft: false,
    isPrerelease: false,
    body: body,
  );

  return github.repositories.createRelease(
    RepositorySlug(owner, repo),
    createRelease,
  );
}
