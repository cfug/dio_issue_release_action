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

  final commentUser = context.payload['comment']['user']['login'];
  if (commentUser == null || commentUser is! String) {
    info('The comment user is null, skip.');
    return;
  }

  await injectInput();

  final owner = context.repo.owner;
  final repo = context.repo.repo;

  if (!await checkUserPermission(
    owner: owner,
    repo: repo,
    username: commentUser,
  )) {
    info('The comment user $commentUser has no write permission, skip.');
    return;
  }

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
}

Future<void> injectInput() async {
  // check input
  final githubTokenInput = Platform.environment['PERSON_TOKEN'];

  if (githubTokenInput == null) {
    warning('The input GITHUB_TOKEN is null, skip.');
    throw Exception('The input GITHUB_TOKEN is null.');
  }

  githubToken = githubTokenInput.trim();
  github = GitHub(auth: Authentication.withToken(githubTokenInput));

  final pubToken = Platform.environment['PUB_CREDENTIALS_JSON'];
  if (pubToken == null || pubToken.isEmpty) {
    warning('The input pub-credentials-json is empty, skip.');
    throw Exception('The input pub-credentials-json is empty.');
  }

  // write pub token to file
  writePubTokenToFile(pubToken);

  doPublish = Platform.environment['DO_PUBLISH']?.toLowerCase() == 'true';
  doRelease = Platform.environment['DO_RELEASE']?.toLowerCase() == 'true';
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

bool doPublish = true;
bool doRelease = true;

FutureOr<void> handlePackage(Pkg pkg) async {
  final PkgCommiter pkgCommiter = PkgCommiter(pkg);

  pkgCommiter.changeFile();
  pkgCommiter.commit();

  await publishPkg(pkg, dryRun: true);

  if (doRelease) {
    pkgCommiter.push();
    await pkgCommiter.release();
  } else {
    info('Because the input DO_RELEASE is false, skip release.');
  }

  if (doPublish) {
    await publishPkg(pkg, dryRun: false);
  } else {
    info('Because the input DO_PUBLISH is false, skip publish.');
  }
}
