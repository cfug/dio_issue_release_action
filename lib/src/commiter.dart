import 'dart:io';

import 'package:github_action_context/github_action_context.dart';
import 'package:github_action_core/github_action_core.dart';

import 'github.dart';
import 'pkg.dart';

class PkgCommiter {
  final Pkg pkg;

  PkgCommiter(this.pkg);

  late String currentVersionChangeLog;

  ProcessResult exec(String cmd) {
    return Process.runSync(
      'bash',
      ['-c', cmd],
      runInShell: true,
      workingDirectory: pkg.subPath,
    );
  }

  void changeFile() {
    final newVersion = pkg.version;
    // 1. change pubspec.yaml
    final file = File('${pkg.subPath}/pubspec.yaml');
    final lines = file.readAsLinesSync();
    final newLines = <String>[];
    for (final line in lines) {
      if (line.startsWith('version:')) {
        newLines.add('version: $newVersion');
      } else {
        newLines.add(line);
      }
    }
    file.writeAsStringSync(newLines.join('\n'));

    // 2. change CHANGELOG.md
    final changelogFile = File('${pkg.subPath}/CHANGELOG.md');
    final changelogLines = changelogFile.readAsLinesSync();

    final unreleasedTag = '## Unreleased';

    final newChangelogLines = <String>[];
    for (final line in changelogLines) {
      if (line.startsWith(unreleasedTag)) {
        newChangelogLines.add(line);
        newChangelogLines.add('');
        newChangelogLines.add('## $newVersion');
        newChangelogLines.add('');
      } else {
        newChangelogLines.add(line);
      }
    }
    changelogFile.writeAsStringSync(newChangelogLines.join('\n'));

    // 3. Get current version changelog
    final currentVersionTag = '## $newVersion';
    final currentVersionTagIndex = newChangelogLines.indexOf(currentVersionTag);
    final currentVersionLines = <String>[];
    for (var i = currentVersionTagIndex + 2;
        i < newChangelogLines.length;
        i++) {
      final line = newChangelogLines[i];
      if (line.startsWith('## ')) {
        break;
      }
      currentVersionLines.add(line);
    }
    currentVersionChangeLog = currentVersionLines.join('\n').trim();
  }

  final commitUser = 'cfug-dev';
  final commitEmail = '47591151+cfug-dev@users.noreply.github.com';

  String get commitMsg {
    final title = '🔖 ${pkg.name} v${pkg.version}';
    final commentUrl = context.payload['comment']['html_url'];
    final content = 'Triggered by @${context.actor} on $commentUrl';

    return '$title\n$content';
  }

  void setCommiter() {
    final cmd =
        'git config --global user.name "$commitUser" && git config --global user.email "$commitEmail"';

    final result = exec(cmd);
    if (result.exitCode != 0) {
      print(result.stderr);
      setFailed('set git commiter failed');
    }
  }

  void injectGh() {
    final result = exec(
      'echo $githubToken > | gh auth login --with-token --hostname github.com -p https',
    );

    if (result.exitCode != 0) {
      print(result.stderr);
      setFailed('gh login failed');
    }

    final setupResult = exec(
      'gh auth setup-git -h github.com',
    );

    if (setupResult.exitCode != 0) {
      print(setupResult.stderr);
      setFailed('gh setup-git failed');
    }
  }

  Future<void> commit() async {
    setCommiter();
    final cmd = 'git add . && git commit -m "$commitMsg"';
    final result = exec(cmd);
    if (result.exitCode != 0) {
      print(result.stderr);
      setFailed('git commit failed');
    }
  }

  Future<void> push() async {
    injectGh();

    final result = exec('git push origin main');
    if (result.exitCode != 0) {
      print(result.stderr);
      setFailed('git push failed');
    }
  }

  Future<void> release() async {
    final tagName = '${pkg.name}_v${pkg.version}';
    final releaseName = '${pkg.name} ${pkg.version}';

    final body = '''
  ## What's new
  $currentVersionChangeLog
''';

    final result = await releasePkg(
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: tagName,
      name: releaseName,
      body: body,
    );

    if (result.hasErrors) {
      print(result.errors);
      setFailed('create release failed');
    }

    startGroup('Release $releaseName');

    final releaseUrl = result.htmlUrl;
    info('Release url: $releaseUrl');
    info('Release body: $body');

    groupEnd();
  }
}
