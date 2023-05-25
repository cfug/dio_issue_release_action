import 'dart:io';

import 'package:github_action_core/github_action_core.dart';

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

  final dryRunFlag = dryRun ? '--dry-run' : '';
  final cmd = '$bin pub publish --force -C $path $dryRunFlag';

  final result = await Process.run(
    'bash',
    ['-c', cmd],
    runInShell: true,
  );

  if (result.exitCode != 0) {
    error(result.stderr.toString());
    setFailed('publish failed');
  }

  info(result.stdout.toString());
  info('Publish ${pkg.name} ${pkg.version} success.');
}
