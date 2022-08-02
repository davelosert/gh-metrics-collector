import { createHelperDirs } from './helperDirs';
import { program } from 'commander';
import { createCSVStreamTo } from './output/CommitCSV';
import { collectGitCommits } from './tasks/collectCommits';
import { ProgramOptions, validateOptions } from './options';

const { GITHUB_TOKEN } = process.env;

if(!GITHUB_TOKEN) throw new Error(`You have to specifiy a GitHub Token under GITHUB_TOKEN with access to the organisation that you'd like to collect metrics from.`);

program
  .name('gh-metrics-collector')
  .description('Collects User Activity (Commits, Pull Requests, Acitivies) from GitHub Organisations and Enterprises and puts them into CSVs to create visualizations.')
  .version('1.0.0')
  .requiredOption('-o, --organisation <organisation>', 'The GitHub Organisation to collect metrics from.')
  .option('-g, --github-server <github-server-url>', 'The GitHub Server to use (without protocol). Defaults to github.com', 'github.com')
  .option('-r, --repository <repository>', 'If this options is provided, metrics will only be collected for that single repository. Good for a test run.')
  .option('-s, --since', 'Filter collected metrics to those that occured after this date.')
  .option('-u, --until', 'Filter collected metrics to those that occured before this date.')
  .parse(process.argv);

const rawOptions  = program.opts();
const options = validateOptions(rawOptions);

start(options, GITHUB_TOKEN);

async function start(options: ProgramOptions, githubToken: string) {
    const helperDirs = await createHelperDirs();
    const commitTargetStream = await createCSVStreamTo(helperDirs.createTmpFilePath('commit.csv'));

    await collectGitCommits({
      ...options,
      // Todo: Fetch repositories from Organization if not provided
      repository: options.repository!,
      githubToken
    }, commitTargetStream);
}
