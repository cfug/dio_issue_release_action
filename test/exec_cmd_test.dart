import 'package:action_dio_release/action_dio_release.dart';
import 'package:test/test.dart';

void main() {
  group('Test exec in shell:', () {
    test('Test execCmdSync', () {
      final result = execCmdSync('echo "hello world"');
      expect(result, 'hello world\n');
    });
  });
}
