import 'dart:io';

import 'package:action_dio_release/action_dio_release.dart';
import 'package:github/github.dart';
import 'package:test/test.dart';

void main() {
  test('Test pkgList:', () {
    final pkgList1 = convertPkgList('dio: v1.0.0');

    expect(pkgList1.length, 1);
    expect(pkgList1[0].name, 'dio');
    expect(pkgList1[0].version, '1.0.0');

    final pkgList2 = convertPkgList('dio: v1.0.0\ncookie_manager: v1.0.0');

    expect(pkgList2.length, 2);
    expect(pkgList2[0].name, 'dio');
    expect(pkgList2[0].version, '1.0.0');

    expect(pkgList2[1].name, 'cookie_manager');
    expect(pkgList2[1].version, '1.0.0');

    // test no invalid pkg name
    final pkgList3 = convertPkgList('invalid_pkg: v1.0.0');
    expect(pkgList3.length, 0);

    // test have space in before and after :
    final pkgList4 = convertPkgList('   dio:1.0.0');
    expect(pkgList4.length, 1);
    expect(pkgList4[0].name, 'dio');

    expect(
      convertPkgList('dio: v1.0.0   \ncookie_manager     : v1.0.0').length,
      2,
    );
  });

  group('Test permission:', () {
    github = GitHub(
      auth: Authentication.withToken(Platform.environment['GITHUB_TOKEN']!),
    );
    showGithubLog = true;
    test('admin', () async {
      expect(
        await checkUserWritePermission(
          owner: 'FlutterCandies',
          repo: 'flutter_photo_manager',
          username: 'caijinglong',
        ),
        true,
      );
    });

    test('write', () async {
      expect(
        await checkUserWritePermission(
          owner: 'cfug',
          repo: 'dio',
          username: 'caijinglong',
        ),
        true,
      );
    });
  });

  group('Test update files:', () {
    test('Change changelog', () {
      final src = File('test/files/changelog_src.md').readAsStringSync();
      final dst = File('test/files/changelog_dst.md').readAsStringSync();

      expect(updateChangeLog(src, '5.0.1'), dst);
    });

    test('Get version content', () {
      final dst = File('test/files/changelog_dst.md').readAsStringSync();
      const content = '- Change version';
      expect(getCurrentVersionContent(dst, '5.0.1'), content);
      expect(getCurrentVersionContent(dst, '5.0.0'), 'xxxx');
      expect(getCurrentVersionContent(dst, 'Unreleased'), '*None.*');
    });

    test('Change pubspec.yaml', () {
      final src = File('test/files/src.yml').readAsStringSync();
      final dst = File('test/files/dst.yml').readAsStringSync();

      expect(updatePubspec(src, '5.0.1'), dst);
    });
  });
}
