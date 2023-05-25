import 'dart:io';

String execCmdSync(String cmd) {
  final result = Process.runSync(
    'bash',
    ['-c', cmd],
    runInShell: true,
  );
  return result.stdout.toString();
}

ProcessResult execCmdResultSync(String cmd) {
  return Process.runSync(
    'bash',
    ['-c', cmd],
    runInShell: true,
  );
}
