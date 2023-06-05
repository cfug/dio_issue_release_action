import 'dart:io';

import 'package:github_action_core/github_action_core.dart';

String execCmdSync(
  String cmd, {
  String? workingPath,
}) {
  workingPath ??= Directory.current.path;
  final result = Process.runSync(
    'bash',
    ['-c', cmd],
    runInShell: true,
    workingDirectory: workingPath,
  );
  return result.stdout.toString();
}

ProcessResult execCmdResultSync(
  String cmd, {
  String? workingPath,
}) {
  workingPath ??= Directory.current.path;
  info('Run $cmd in $workingPath');
  return Process.runSync(
    'bash',
    ['-c', cmd],
    runInShell: true,
    workingDirectory: workingPath,
  );
}
