import 'dart:async';
import 'dart:io';

import 'package:action_dio_release/action_dio_release.dart';
import 'package:github/github.dart';
import 'package:github_action_context/github_action_context.dart';
import 'package:github_action_core/github_action_core.dart';

Future<void> main(List<String> arguments) async {
  if (context.eventName != 'issue_comment') {
    info('The event is not issue_comment, skip.');
    return;
  }

  await checkInput();

  final body = context.payload['comment']['body'];

  if (body is! String) {
    info('The comment body is not string, skip.');
    return;
  }

  final commentHtmlUrl = context.payload['comment']['html_url'];
  info('The action is triggered by issue_comment event in $commentHtmlUrl');

  if (body.trim().isEmpty) {
    info('The comment body is empty, skip.');
    return;
  }

  final String commentBody = body;

  await handleIssueComment(commentBody);

  // startGroup('context.fields');

  // info('context.eventName: ${context.eventName}');
  // info('context.sha: ${context.sha}');
  // info('context.ref: ${context.ref}');
  // info('context.workflow: ${context.workflow}');
  // info('context.action: ${context.action}');
  // info('context.actor: ${context.actor}');
  // info('context.job: ${context.job}');
  // info('context.runNumber: ${context.runNumber}');
  // info('context.runId: ${context.runId}');
  // info('context.apiUrl: ${context.apiUrl}');
  // info('context.serverUrl: ${context.serverUrl}');
  // info('context.graphqlUrl: ${context.graphqlUrl}');
  // groupEnd();

  // startGroup('env');
  // print('Current working directory: ${Directory.current.absolute.path}');
  // groupEnd();

  // startGroup('context.payload');
  // info(context.payload.toString());
  // groupEnd();
}

Future<void> checkInput() async {
  // check input
  final githubTokenInput = getInput('github-token');
  if (githubTokenInput == null || githubTokenInput.isEmpty) {
    info('The input github-token is empty, skip.');
    return;
  }

  githubToken = githubTokenInput.trim();
  github = GitHub(auth: Authentication.withToken(githubTokenInput));

  final pubToken = getInput('pub-credentials-json');
  if (pubToken == null || pubToken.isEmpty) {
    info('The input pub-credentials-json is empty, skip.');
    return;
  }

  // write pub token to file
  writePubTokenToFile(pubToken);
}

FutureOr<void> handleIssueComment(String body) async {
  final pkgList = convertPkgList(body);
  if (pkgList.isEmpty) {
    setFailed('No valid package found in the comment body.');
    exit(1);
  }

  for (final pkg in pkgList) {
    await handlePackage(pkg);
  }
}

FutureOr<void> handlePackage(Pkg pkg) async {
  final PkgCommiter pkgCommiter = PkgCommiter(pkg);

  pkgCommiter.changeFile();
  pkgCommiter.commit();

  await publishPkg(pkg, dryRun: true);
  await publishPkg(pkg, dryRun: false);

  pkgCommiter.push();
  await pkgCommiter.release();
}
