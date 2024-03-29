import 'package:github/github.dart';
import 'package:github_action_core/github_action_core.dart';

late GitHub github;
late String githubToken;
bool showGithubLog = false;

Future<bool> checkUserPermission({
  required String owner,
  required String repo,
  required String username,
}) async {
  try {
    final response = await github.getJSON<Map, Map>(
        '/repos/$owner/$repo/collaborators/$username/permission');

    if (showGithubLog) {
      debug('checkUserWritePermission response: $response');
    }

    final permissionMap = response['user']['permissions'];

    if (showGithubLog) {
      debug('checkUserWritePermission permissionMap: $permissionMap');
    }

    return permissionMap['admin'] == true || permissionMap['maintain'] == true;
  } catch (e) {
    warning('checkUserWritePermission error: $e');
    return false;
  }
}

Future<Release> createRelease({
  required String owner,
  required String repo,
  required String tag,
  required String name,
  required String body,
}) {
  final createRelease = CreateRelease.from(
    name: name,
    tagName: tag,
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

Future<bool> releaseExists({
  required String owner,
  required String repo,
  required String releaseName,
}) {
  return github.repositories
      .listReleases(RepositorySlug(owner, repo))
      .toList()
      .then((releases) {
    return releases.any((release) => release.name == releaseName);
  });
}
