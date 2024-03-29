import 'dart:io';

import 'package:github_action_context/github_action_context.dart';
import 'package:github_action_core/github_action_core.dart';

import 'exec.dart';
import 'files.dart';
import 'github.dart';
import 'pkg.dart';

class PkgCommiter {
  final Pkg pkg;

  PkgCommiter(this.pkg);

  late String currentVersionChangeLog;

  void changeFile() {
    final newVersion = pkg.version;
    // 1. change pubspec.yaml
    final file = File('${pkg.subPath}/pubspec.yaml');
    final newContent = updatePubspec(
      file.readAsStringSync(),
      newVersion,
    );
    file.writeAsStringSync(newContent);

    // 2. change CHANGELOG.md
    final changelogFile = File('${pkg.subPath}/CHANGELOG.md');
    final newChangeLog = updateChangeLog(
      changelogFile.readAsStringSync(),
      newVersion,
    );
    changelogFile.writeAsStringSync(newChangeLog);

    // 3. Get current version changelog
    currentVersionChangeLog = getCurrentVersionContent(
      newChangeLog,
      newVersion,
    );

    if (currentVersionChangeLog.toLowerCase() ==
        noneChangeLogText.toLowerCase()) {
      error(
        'No changelog for version $newVersion, current changelog is $currentVersionChangeLog',
      );
      setFailed('No changelog for version $newVersion');
    }

    if (currentVersionChangeLog.trim().isEmpty) {
      error(
        'No changelog for version $newVersion, current changelog is empty',
      );
      setFailed('No changelog for version $newVersion');
    }
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

    final result = execCmdResultSync(cmd);
    if (result.exitCode != 0) {
      error(result.stderr);
      setFailed('set git commiter failed');
    }
  }

  void injectGh() {
    final result = execCmdResultSync(
      'echo $githubToken | gh auth login --with-token --hostname github.com -p https',
    );

    if (result.exitCode != 0) {
      error(result.stderr);
      setFailed('gh login failed');
    }

    final setupResult = execCmdResultSync(
      'gh auth setup-git -h github.com',
    );

    if (setupResult.exitCode != 0) {
      error(setupResult.stderr);
      setFailed('gh setup-git failed');
    }
  }

  void commit() {
    setCommiter();
    final cmd = 'git add . && git commit -m "$commitMsg"';
    final result = execCmdResultSync(cmd);
    if (result.exitCode != 0) {
      error(result.stderr);
      setFailed('git commit failed');
    }
  }

  void push() {
    injectGh();

    var res = execCmdResultSync('git pull');
    if (res.exitCode != 0) {
      error(res.stderr);
      setFailed('git pull failed');
    }
    
    final result = execCmdResultSync('git push origin main');
    if (result.exitCode != 0) {
      error(result.stderr);
      setFailed('git push failed');
    }
  }

  Future<void> release() async {
    final tagName = '${pkg.name}_v${pkg.version}';
    final releaseName = '${pkg.name} ${pkg.version}';

    // 1. Query release name exists in github
    final haveRelease = await releaseExists(
      owner: context.repo.owner,
      repo: context.repo.repo,
      releaseName: releaseName,
    );

    if (haveRelease) {
      info('Release $releaseName exists, skip release.');
      return;
    }

    // 2. Create github release

    final body = '''
  ## What's new
  $currentVersionChangeLog
''';

    final result = await createRelease(
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: tagName,
      name: releaseName,
      body: body,
    );

    if (result.hasErrors) {
      error(result.errors);
      setFailed('create release failed');
    }

    startGroup('Release $releaseName');

    final releaseUrl = result.htmlUrl;
    info('Release url: $releaseUrl');
    info('Release body: $body');

    groupEnd();
  }
}
