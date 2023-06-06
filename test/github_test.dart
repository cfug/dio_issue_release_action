import 'dart:io';

import 'package:action_dio_release/action_dio_release.dart';
import 'package:github/github.dart';
import 'package:test/test.dart';

void main() {
  github = GitHub(
    auth: Authentication.withToken(Platform.environment['GITHUB_TOKEN']!),
  );

  test('releaseExists', () async {
    const owner = 'fluttercandies';
    const repo = 'flutter_photo_manager';
    expect(
      await releaseExists(owner: owner, repo: repo, releaseName: '2.6.0'),
      isTrue,
    );

    expect(
      await releaseExists(owner: owner, repo: repo, releaseName: '0.1.1'),
      isTrue,
    );

    expect(
      await releaseExists(owner: owner, repo: repo, releaseName: '0.0.0'),
      isFalse,
    );
  });
}
