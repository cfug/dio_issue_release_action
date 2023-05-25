String updateChangeLog(String changelog, String newVersion) {
  var changelogLines = changelog.split('\n');

  final unreleasedTag = '## Unreleased';
  final noneText = '*None.*';

  final newChangelogLines = <String>[];
  for (final line in changelogLines) {
    if (line.startsWith(unreleasedTag)) {
      newChangelogLines.add(line);
      newChangelogLines.add('');
      newChangelogLines.add(noneText);
      newChangelogLines.add('');
      newChangelogLines.add('## $newVersion');
    } else {
      newChangelogLines.add(line);
    }
  }

  return newChangelogLines.join('\n');
}

String getCurrentVersionContent(String changelog, String newVersion) {
  final newChangelogLines = changelog.split('\n');
  final currentVersionTag = '## $newVersion';
  final currentVersionTagIndex = newChangelogLines.indexOf(currentVersionTag);
  final currentVersionLines = <String>[];
  for (var i = currentVersionTagIndex + 2; i < newChangelogLines.length; i++) {
    final line = newChangelogLines[i];
    if (line.startsWith('## ')) {
      break;
    }
    currentVersionLines.add(line);
  }
  return currentVersionLines.join('\n').trim();
}

String updatePubspec(String yamlFileContent, String newVersion) {
  final lines = yamlFileContent.split('\n');
  final newLines = <String>[];
  for (final line in lines) {
    if (line.startsWith('version:')) {
      newLines.add('version: $newVersion');
    } else {
      newLines.add(line);
    }
  }
  return newLines.join('\n');
}
