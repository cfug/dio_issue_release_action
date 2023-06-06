import 'package:pub_semver/pub_semver.dart';
import 'package:test/expect.dart';
import 'package:test/scaffolding.dart';

void main() {
  const versionList = <String>[
    '1.0.0',
    '2.0.0',
    '0.0.1-build',
    '0.0.2+1',
    '0.0.2-build.1',
    '0.0.2-dev.2',
    '0.0.2-nullsafety',
  ];

  const unvalidVersionList = <String>[
    '1.0',
    '3',
    '1.0.3.0',
    'v3.0.0',
  ];

  group('Test support versions', () {
    for (final version in versionList) {
      test('Test version $version', () {
        final v = Version.parse(version);
        print(v);
      });
    }
  });

  group('Test unvalid versions', () {
    for (final version in unvalidVersionList) {
      test('Test version $version', () {
        expect(() => Version.parse(version), throwsA(isA<FormatException>()));
      });
    }
  });
}
