# CONTRIBUTING

## 配置项目

```sh
gh repo clone cfug/dio_issue_release_action
cd dio_issue_release_action
dart pub get
```

> 所有代码均在 main 分支上进行开发。

## 添加新的包

在 [lib/src/pkg.dart](lib/src/pkg.dart) 文件中添加新的包。

## 发布说明

### 发布新版本

1. 修改 `CHANGELOG.md` 文件，添加新版本的内容
2. 修改 `pubspec.yaml` 文件，修改版本号
3. 使用 `gh release create vx.y.z` 创建新的 release，版本号需要包含 v

> action 会根据 tag 的版本号来将 main 分支的代码合并到对应的 version 分支
> 例：`v2.3.4` 的 tag 会将 main 的代码分别合并到 v2 v2.3 分支上
> 如果没有对应的分支，action 会自动创建

## Configuring the project

```sh
gh repo clone cfug/dio_issue_release_action
cd dio_issue_release_action
dart pub get
```

> All code is developed on the main branch.

## Add a new package

Add a new package in the [lib/src/pkg.dart](lib/src/pkg.dart) file.

## Release notes

### Release a new version

1. Modify the `CHANGELOG.md` file to add the content of the new version
2. Modify the `pubspec.yaml` file to change the version number
3. Use `gh release create vx.y.z` to create a new release, the version number needs to include v

> The action will merge the code from the main branch to the corresponding version branch based on the version number of the tag
> Example: The tag `v2.3.4` will merge the code from main to the v2 and v2.3 branches respectively
> If there is no corresponding branch, the action will create it automatically
