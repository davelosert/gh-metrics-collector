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

const { GITHUB_TOKEN } = process.env;

if(!GITHUB_TOKEN) throw new Error(`You have to specifiy a GitHub Token under GITHUB_TOKEN with access to the organisation that you'd like to collect metrics from.`);

program
  .name('gh-metrics-collector')
  .description('Collects User Activity (Commits, Pull Requests, Acitivies) from GitHub Organisations and Enterprises and puts them into CSVs to create visualizations.')
  .version('1.0.0')
  .requiredOption('-o, --organisation <organisation>', 'The GitHub Organisation to collect metrics from.')
  .option('-g, --github-server <github-server-url>', 'The GitHub Server to use (without protocol). Defaults to github.com', 'github.com')
  .option('-r, --repository <repository>', 'If this options is provided, metrics will only be collected for that single repository. Good for a test run.')
  .option('-s, --since <since-date>', 'Filter collected metrics to those that occured after this date.')
  .option('-u, --until <until-date>', 'Filter collected metrics to those that occured before this date.')
  .option('-t, --tasks [tasks...]', 'The different collection tasks you want to run. Possible tasks are "commits" and "prs". Specify multiple by separating them with a space. Default to all tasks.', ['commits', 'prs'] )
  .option('-c, --concurrency <concurrency>', 'The number of concurrent tasks to schedule. Mainly used to speed up things while not overloading the GitHub API. Defaults to 5.', '5')

  .parse(process.argv);

const rawOptions  = program.opts();
const options = validateOptions(rawOptions);

start(options, GITHUB_TOKEN);

async function start(options: ProgramOptions, githubToken: string) {
    const startTime = process.hrtime();

    const helperDirs = await createHelperDirs();
    const octokit = createOctokit({
      githubToken,
      githubServer: options.githubServer
    });

    const repos: Repository[] = options.repository ? 
      [{ name: options.repository }] 
      : await fetchAllRepositories({ octokit, organisation: options.organisation });

    if(options.tasks.includes('commits')) {
      await startCommitCollection(octokit, helperDirs, githubToken, repos);
    }
    
    if(options.tasks.includes('prs')) {
      await startPrCollection(octokit, helperDirs, repos);
    }
    
    const [ processSeconds ] = process.hrtime(startTime);
    console.log(`Script finished after ${processSeconds} seconds.`);
}

async function startCommitCollection(octokit: Octokit, dirHelper: DirHelper, githubToken: string, repos: Repository[]) {
    const csvFileName = createDateCSVName('commits');
    const csvPath = dirHelper.createTmpFilePath(csvFileName);
    const commitTargetStream = await createCommitCSVStream(csvPath);
    const queue = new PQueue({ concurrency: options.concurrency });

    console.log(`\nSTARTING COMMIT COLLECTION`);
    console.log('------------')
    let overallCommitCount = 0;
    
    const preparedFns = repos.map(repository => {
        return async () => {
          console.log(`Getting commits for ${options.organisation}/${repository.name}.`);
          const { commitsCount } = await collectGitCommits({
            ...options,
            repository,
            githubToken
          }, commitTargetStream);
          
          overallCommitCount += commitsCount;
        };
    });
    queue.addAll(preparedFns);
    
    await queue.onIdle();

    console.log('------------')
    console.log(`COMMIT COLLECTION FINISHED`);
    console.log(`Wrote ${overallCommitCount} commits to ${csvPath}`);
}

async function startPrCollection(octokit: Octokit, dirHelper: DirHelper, repos: Repository[]) {
  const csvFileName = createDateCSVName('pullRequests');
  const csvPath = dirHelper.createTmpFilePath(csvFileName);
  const prTargetStream = await createPullRequestCSVStream(csvPath);
  const queue = new PQueue({ concurrency: options.concurrency });

  console.log(`\nSTARTING PULL-REQUEST COLLECTION`);
  console.log('------------')
  let overallPrCount = 0;
  const preparedFns = repos.map(repository => {
      return async () => {
        console.log(`Getting pull-requests for ${options.organisation}/${repository.name}.`);
        const {pullRequestCount} = await collectPullRequests({
        octokit,
          organisation: options.organisation,
          repository
        }, prTargetStream);
        overallPrCount += pullRequestCount;
      }
  });

  queue.addAll(preparedFns);

  await queue.onIdle();
  console.log('------------')
  console.log(`PULL-REQUEST COLLECTION FINISHED`);
  console.log(`Wrote ${overallPrCount} PRs to ${csvPath}`);
}
