# gh-metrics-collector

Collect Github Committer- and Pull-Requests Metrics for entire GitHub Organisations and put them into a CSV.

The metrics can then be put into PowerBI or Excel to produce some visualization to show the GitHub Activity or an enterprise or organisation.

## Usage

### Use Binary

Download one of the provided binaries that matches your os from the releases and then executei it like:

```shell
GITHUB_TOKEN=$GITHUB_TOKEN gh-metrics-collector \
  --organisation=<organisation> \
  --output-dir=<output-folder-path> \
  --before=<date> \
  --after=<date>
```

Let's say you want all metrics of the year 2021 for the `my-test-organisation` into the `./tmp` directory, you would execute:

```shell
GITHUB_TOKEN=$GITHUB_TOKEN gh-metrics-collector \
  --organisation=my-test-organisation \
  --output-dir=tmp \
  --since='2021-01-01' \
  --until='2021-12-12'
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

## Produced Data

Running this script will produce 3 files and contents:

### `commits.csv`

Git Logs with the following fields:

- Author date (fallback to committer date if not available)
- Author name (fallback to committer name if not available)
- Commit SHA
- Source Organisation
- Source Repository

### `pull-request.csv`

List of all relevant pull-request-dates and the state:

- created at
- closed at
- merged at
- state (open, closed, merged)

### `activity.csv`

tbd.

## ProductMetrics

- Pull Request Activity (Opened, Merged, Closed, Inactive) per Month
- Time to Merge Pull Request
- Absolute Number of Commits per Day
- Absolute Number of Contributions (Commits, Comments, PRs) per Hour

## Required Output Data

- All **Commits** accross all **organizations**  accross all **repositories** with the fields:
  - Created-at Date
  - (optional) Commit-SHA to deduplicatge?
  - (optional) Commit-Author to filter automation accounts?

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
  - [ ] trhoughput: Maximum amount of time to query the API in one second
