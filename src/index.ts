import { createDateCSVName, createHelperDirs, DirHelper } from './helperDirs';
import { program } from 'commander';
import { createCommitCSVStream } from './output/CommitCSV';
import { collectGitCommits } from './tasks/collectCommits';
import { ProgramOptions, validateOptions } from './options';
import { fetchAllRepositories, Repository } from './api/fetchAllRepositories';
import { createOctokit } from './api/Octokit';
import { Octokit } from 'octokit';
import { collectPullRequests } from './tasks/collectPullRequests';
import { createPullRequestCSVStream } from './output/PullRequestCSV';
import PQueue from 'p-queue';
import { addTokenToMask, createTaskLogger, logger, setVerboseLogging } from './TaskLogger';
import { createMigrationStateHandler, MigrationStateHandler } from './MigrationStateHandler';
import { RepositoryIdentifier } from './Repository';

const { GITHUB_TOKEN } = process.env;

if(!GITHUB_TOKEN) throw new Error(`You have to specifiy a GitHub Token under GITHUB_TOKEN with access to the organisation that you'd like to collect metrics from.`);

program
  .name('gh-metrics-collector')
  .description('Collects User Activity (Commits, Pull Requests, Acitivies) from GitHub Organisations and Enterprises and puts them into CSVs to create visualizations.')
  .version('0.0.3')
  .requiredOption('-o, --organisation <organisation>', 'The GitHub Organisation to collect metrics from.')
  .option('-g, --github-server <github-server-url>', 'The GitHub Server to use (without protocol). Defaults to github.com', 'github.com')
  .option('-r, --repository <repository>', 'If this options is provided, metrics will only be collected for that single repository. Good for a test run.')
  .option('-s, --since <since-date>', 'Filter collected metrics to those that occured after this date.')
  .option('-u, --until <until-date>', 'Filter collected metrics to those that occured before this date.')
  .option('-t, --tasks [tasks...]', 'The different collection tasks you want to run. Possible tasks are "commits" and "prs". Specify multiple by separating them with a space. Default to all tasks.', ['commits', 'prs'] )
  .option('-c, --concurrency <concurrency>', 'The number of concurrent tasks to schedule. Mainly used to speed up things while not overloading the GitHub API.', '5')
  .option('-v, --verbose', 'Enable debug logging output.', false)

  .parse(process.argv);

const rawOptions  = program.opts();
const options = validateOptions(rawOptions);

start(options, GITHUB_TOKEN);

async function start(options: ProgramOptions, githubToken: string) {
    setVerboseLogging(options.verbose);
    addTokenToMask(githubToken);

    const stateHandler = createMigrationStateHandler();

    const helperDirs = await createHelperDirs();
    const octokit = createOctokit({
      githubToken,
      githubServer: options.githubServer
    });

    const repos: RepositoryIdentifier[] = options.repository ? 
      [{ name: options.repository, organisation: options.organisation }] 
      : await fetchAllRepositories({ octokit, organisation: options.organisation });
      
    stateHandler.addRepositories(repos);
      
    if(options.tasks.includes('commits')) {
      await startCommitCollection({ octokit, dirHelper: helperDirs, githubToken, stateHandler });
    }

    if(options.tasks.includes('prs')) {
      await startPrCollection({ octokit, dirHelper: helperDirs, stateHandler });
    }

    stateHandler.reportScriptDone();
}

async function startCommitCollection(
  { octokit, dirHelper, githubToken, stateHandler }: 
  { octokit: Octokit; dirHelper: DirHelper; githubToken: string; stateHandler: MigrationStateHandler }) {
    const csvFileName = createDateCSVName('commits');
    const csvPath = dirHelper.createTmpFilePath(csvFileName);
    const commitTargetStream = await createCommitCSVStream(csvPath);
    const queue = new PQueue({ concurrency: options.concurrency });

    stateHandler.reportTaskStart('commits', csvPath);
    const preparedFns = stateHandler.getAllTargetRepos().map(repository => {
        const logger = createTaskLogger(repository);
        return async () => {
          stateHandler.reportRepoStart('commits', repository);
          const { commitsCount } = await collectGitCommits({
            ...options,
            repository,
            githubToken,
            logger
          }, commitTargetStream);
          stateHandler.reportRepoDone('commits', repository, commitsCount);
        };
    });
    queue.addAll(preparedFns);

    await queue.onIdle();
    stateHandler.reportTaskDone('commits');
}

async function startPrCollection(
  { octokit, dirHelper, stateHandler }: 
  { octokit: Octokit; dirHelper: DirHelper; stateHandler: MigrationStateHandler }) {
  const csvFileName = createDateCSVName('pullRequests');
  const csvPath = dirHelper.createTmpFilePath(csvFileName);
  const prTargetStream = await createPullRequestCSVStream(csvPath);
  const queue = new PQueue({ concurrency: options.concurrency });
  
  stateHandler.reportTaskStart('prs', csvPath)

  const preparedFns = stateHandler.getAllTargetRepos().map(repository => {
      return async () => {
        const logger = createTaskLogger(repository);
        stateHandler.reportRepoStart('prs', repository);
        const { pullRequestCount } = await collectPullRequests({
        octokit,
          organisation: options.organisation,
          repository,
          logger
        }, prTargetStream);
        stateHandler.reportRepoDone('prs', repository, pullRequestCount);
      }
  });

  queue.addAll(preparedFns);

  await queue.onIdle();
  stateHandler.reportTaskDone('prs');
}
