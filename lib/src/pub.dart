import 'dart:io';

import 'package:github_action_core/github_action_core.dart';

import 'exec.dart';
import 'pkg.dart';

void writePubTokenToFile(String token) {
  final home = Platform.environment['HOME'];

  final file = File('$home/.config/dart/pub-credentials.json');

  if (!file.existsSync()) {
    file.createSync(recursive: true);
  }

  file.writeAsStringSync(token);
}

Future<void> publishPkg(
  Pkg pkg, {
  bool dryRun = false,
}) async {
  final path = pkg.subPath;

  final isFlutterPackage = pkg.isFlutterPackage;

  final bin = isFlutterPackage ? 'flutter' : 'dart';

  final dryRunFlag = dryRun ? '--dry-run' : '--force';
  final cmd = '$bin pub publish $dryRunFlag';

  final result = execCmdResultSync(cmd, workingPath: path);

  if (result.exitCode != 0) {
    error(result.stderr.toString());
    final failMsg = dryRun
        ? 'Dry run publish ${pkg.name} ${pkg.version} failed.'
        : 'Publish ${pkg.name} ${pkg.version} failed.';
    setFailed(failMsg);
  }

  info(result.stdout.toString());

  if (dryRun) {
    info('Dry run publish ${pkg.name} ${pkg.version} success.');
    return;
  }

  info('Publish ${pkg.name} ${pkg.version} success.');
}
