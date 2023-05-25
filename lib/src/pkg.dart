import 'dart:io';
import 'package:yaml/yaml.dart' as yaml;

import 'package:github_action_core/github_action_core.dart';

enum PkgInfo {
  dio('dio', 'dio'),
  cookieManager('cookie_manager', 'plugins/cookie_manager'),
  http2Adapter('http2_adapter', 'plugins/http2_adapter'),
  nativeDioAdapter('native_dio_adapter', 'plugins/native_dio_adapter'),
  ;

  final String name;
  final String subPath;

  const PkgInfo(this.name, this.subPath);

  static PkgInfo fromName(String name) {
    return values.firstWhere(
      (element) => element.name == name,
      orElse: () => throw ArgumentError.value(
        name,
        'name',
        'The name is invalid, The name must be one of ${values.map((e) => e.name).join(', ')}',
      ),
    );
  }
}

class Pkg {
  final PkgInfo info;
  final String _version;

  Pkg(this.info, String version) : _version = version;

  String get name => info.name;
  String get subPath => info.subPath;
  String get version {
    if (_version.startsWith('v')) {
      return _version.substring(1);
    }
    return _version;
  }

  factory Pkg.fromText(String text) {
    final parts = text.trim().split(':');
    if (parts.length != 2) {
      throw ArgumentError.value(text, 'text', 'Invalid format.');
    }
    final name = parts[0].trim();
    final version = parts[1].trim();

    if (name.trim().isEmpty) {
      throw ArgumentError.value(text, 'text', 'The name is empty.');
    }

    if (version.trim().isEmpty) {
      throw ArgumentError.value(text, 'text', 'The version is empty.');
    }

    // Version is a x.y.z or vx.y.z
    final versionRegex = RegExp(r'^v?\d+\.\d+\.\d+$');
    if (!versionRegex.hasMatch(version)) {
      throw ArgumentError.value(text, 'text', 'The version is invalid.');
    }

    final pkgInfo = PkgInfo.fromName(name);

    return Pkg(pkgInfo, version);
  }

  bool get isFlutterPackage {
    final pubspecFile = File('$subPath/pubspec.yaml');
    final pubspec = pubspecFile.readAsStringSync();
    final doc = yaml.loadYaml(pubspec) as yaml.YamlMap;
    final env = doc['environment'] as yaml.YamlMap;
    return env.containsKey('flutter');
  }
}

List<Pkg> convertPkgList(String body) {
  final pkgs = <Pkg>[];
  for (final line in body.split('\n')) {
    try {
      final pkg = Pkg.fromText(line);
      pkgs.add(pkg);
    } catch (e) {
      warning('The line "$line" is converted pkg failed.');
    }
  }

  return pkgs;
}
