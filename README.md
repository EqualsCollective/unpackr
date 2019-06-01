# Unpackr

A solution for statically unpacking repository code into a project.
Ideal for boilerplate code and components that are inhibited by package systems.

Unpackr is developed by **Equals Labs** at [**Equals Collective**](https://equalscollective.com/).



## Getting started
#### System requirements
Requires Git 1.8.3 (for tag cloning)

#### For command line usage:
`$ npm i -g unpackr`
Refer to CLI usage

#### For use as a module:
`$ npm i unpackr`
Refer to module usage



---




## CLI usage

Install package globally: `$ npm i -g unpackr`

```
unpackr <repository> <destination> [options]

Options:
  -b, --branch  Optional repository branch name [string]
  -n            Optional repository tag name    [string]
  --version     Show version number             [boolean]
  -h, --help    Show help                       [boolean]

Examples:
  unpackr repo.git dest -b master  Unpacks a repository to pathname

Prompts for package dependency installation where applicable
```



#### Options

| Option           | Description                                      | Value  |
| ---------------- | ------------------------------------------------ | ------ |
| `-b`, `--branch` | Repository branch name (defaults to main branch) | string |
| `-t`, `--tag`    | Repository tag name (cannot be used with branch) | string |



#### Dependency installation

If an unpacked repository contains a `package.json` and a local `package.json` is also found, you will be prompted to select repository dependencies to your local project.

Existing dependencies are overwritten with the specified version and will be highlighted upon installation prompt.



---



## Module usage

Install package locally: `$ npm i unpackr`

```javascript
const unpackr = require('unpackr');

const repository = `git@example.com/test.git`;
const destination = `target_directory`;

unpackr(repository, destination, {
	branch: `branch-name`,
	installDependencies: `yarn`,
});
```



#### Options

| Option                | Description                                                  | Value                  | Default |
| --------------------- | ------------------------------------------------------------ | ---------------------- | ------- |
| `branch`              | Repository branch name (defaults to main branch)             | string                 | `null`  |
| `tag`                 | Repository tag name (cannot be used with branch)             | string                 | `null`  |
| `installDependencies` | Auto-install all dependencies to parent package.json. Set `false` to prevent installation. **This will overwrite existing versions of the same package.** | `npm`, `yarn`, `false` | `false` |



---



## Repository configuration

By default, a repository is cloned, the contents unpacked to a destination, and dependencies are installed where applicable.

However, an `unpackr.config.json` configuration file can be added to a repository root to manage which files are unpacked and where.



#### `files` (array)

`files` is an array of unpack instructions.

```json
{
  "files": [
    "unpack/directory/as_is",
    "nested/directory/unpacked_file.js",
    ["file/to/rename.js", "file/is/renamed.js"],
    ["unpack_to_root", ""]
  ]
}
```

By default, matching path strings are unpacked retaining their relative path, contents and file/directory name:

* `"unpack/directory/as_is"` will unpack the entire matching directory and contents to the destination.
* `"nested/directory/unpacked_file.js"` will unpack the matching file to the destination, creating any missing directories.

Arrays will unpack and remap the first path to the second:

* `["file/to/rename.js", "file/is/renamed.js"]` will take the matching file and unpack with a new path and filename. This syntax also applies to directories.
* `["unpack_to_root", ""]` unpacks the contents of `unpack_to_root` to the root of the destination.

**Note:** All paths are relative to the repository and destination root. For security, any breakout selectors (i.e `../`, `/`, `~/`) will be removed.

