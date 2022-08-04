# gh-metrics-collector

> **Warning**
> This project is still a work in progress and is not production ready yet!

Collect Github Committer- and Pull-Requests Metrics for entire GitHub Organisations and put them into a CSV.
The metrics can then be put into PowerBI or Excel to produce some visualization to show the GitHub Activity of an enterprise or organisation.

## Usage

Download the [binary from the assets of the latest release](https://github.com/davelosert/gh-metrics-collector/releases) that matches your target OS and then executei it like:

```shell
GITHUB_TOKEN=$GITHUB_TOKEN gh-metrics-collector --organisation=<organisation> 
```

You have to provide a `$GITHUB_TOKEN` that has access to the target organisation. For more details, see [Required Permissions of Token](#required-permissions-of-token) below.

This will write some csv-files (see [Produced Data](#produced-data)) to the `tmp` directory relative to where you executed the binary.

### Options

The following options can be specified:

```shell
  -V, --version                            output the version number
  -o, --organisation <organisation>        The GitHub Organisation to collect metrics from.
  -g, --github-server <github-server-url>  The GitHub Server to use (without protocol). Defaults to github.com (default:
                                           "github.com")
  -r, --repository <repository>            If this options is provided, metrics will only be collected for that single
                                           repository. Good for a test run.
  -s, --since                              Filter collected metrics to those that occured after this date.
  -u, --until                              Filter collected metrics to those that occured before this date.
  -h, --help                               display help for command
```

#### Example

To get all metrics of the year 2021 for the `my-test-organisation` of your GitHub Server instance `github.myenterprise.com` into the directory:

```shell
GITHUB_TOKEN=$GITHUB_TOKEN gh-metrics-collector \
  --organisation my-test-organisation \
  --github-server 'github.myenterprise.com'
  --since '2021-01-01' \
  --until '2021-12-12'
```

### Required Permissions of Token

To use this tool, you need to create a GitHub PAT with the following permissions:

- `repo` - to clone repositories to get all commits and read pull requests and issue comments
- `read:org` - to get all organisations and all repositories accross organisations
- `read:user` - to check and respect API Rate Limits for the given token

Use `read -s` on Linux to safely get the Token into an ENV Variable:

```shell
read -s GITHUB_TOKEN
## Pase the token and hit <enter>
```

### Rate Limits and timings

As the data to receive via API Calls can become quite large, the tool will respect the GitHub API Rate Limits for [Cloud](https://docs.github.com/en/developers/apps/building-github-apps/rate-limits-for-github-apps) and [Server](https://docs.github.com/en/enterprise-server@3.5/developers/apps/building-github-apps/rate-limits-for-github-apps) and pause execution if they are exceeded until they reset (usually after 1 hour).

> **Note**:
> Both, the high amount of data as well as rate limiting can make this script take a while to run - up to hours.

## Produced Data

Running this script will produce 3 files and contents:

### commits.csv

Contains all git logs of all Repositories (or the one specified with `--repository`) of the given Organisation with the following fields:

- Author date as `commitDate` (fallback to committer date if not available)
- The Commit SHA
- Author name as `commitAuthor` (fallback to committer name if not available)
- Source Organisation
- Source Repository

Example:

```csv
commitDate,commitSHA,commitAuthor,repository,organisation
2022-08-03T09:36:35+02:00,972004f210294b7e6d7d506a6ecb28686e6d2608,davelosert,Test-Repo-1,davelosert-org
2022-08-03T09:36:23+02:00,deb792f76bfd0cacae6016ba84daae19e9806ab2,davelosert,Test-Repo-1,davelosert-org
2022-07-26T11:25:24+02:00,f233688ad9dbbd14454f8781ea46aa91fd4088el,davelosert,mytestrepository,davelosert-org
```

The logs are taken by cloning every repository without its contents (`git clone --filter=blob:none --no-checkout`) and then using `git log --all` to collect all logs-data.

### pull-request.csv

> **Warning**
> This feature is not implemented yet

List of all relevant pull-request-dates and the state:

- created at
- closed at
- merged at
- state (open, closed, merged)

### activity.csv

> **Warning**
> This feature is not implemented yet

tbd.

### Todos

- [ ] Implement collecting Pull Requsts
- [ ] Implement collecting Acitivies
- [ ] Implement State Updates and better logging
- [ ] Provide input Data through JSON (Server baseUrl, output path)
- [ ] Save Pagination (and other?) state to pick up the migration later `--continue <stateFile>`
- [ ] Have `--dry-run` - only count the organizations and commit objects (if possible)
- [ ] Calculate the remaning time (use the response times to create an average and multply with pages remaning)
- [ ] Allow controlling the concurrency as well as throughput with two variables:
  - [ ] concurrency: How many repositories to query in parallel
  - [ ] throughput: Maximum amount of time to query the API in one second
