import { cleanupTmpDir, createDateCSVName, createHelperDirs } from './DirHelper';
import { program } from 'commander';
import { ProgramOptions, validateOptions } from './options';
import { fetchAllRepositories } from './api/fetchAllRepositories';
import { createOctokit } from './api/Octokit';
import { addTokenToMask, logger, setVerboseLogging } from './TaskLogger';
import { createCollectionStateHandler, CollectionStateHandler } from './tasks/CollectionStateHandler';
import { RepositoryIdentifier } from './Repository';
import { startCommitCollection } from './tasks/startCommitCollection';
import { startPrCollection } from './tasks/startPrCollection';
import { postProcessPullRequests } from './postTasks/postProcessPullRequests';

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

    const stateHandler = createCollectionStateHandler();

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
      await startCommitCollection({ octokit, dirHelper: helperDirs, githubToken, stateHandler, options });
    }

    if(options.tasks.includes('prs')) {
      const csvPath = helperDirs.createOutputFilePath(createDateCSVName('pullRequests_all'));
      await startPrCollection({ octokit, csvPath, stateHandler, options });

      const processedCsvPath = helperDirs.createOutputFilePath(createDateCSVName('pullRequests_processed'));
      const dateRange = { 
        since: options.since ? new Date(options.since) : undefined,
        until: options.until ? new Date(options.until) : undefined
      };
      await postProcessPullRequests({ inputCsvPath: csvPath, outputCsvPath: processedCsvPath, dateRange })
    }

    stateHandler.reportScriptDone();
    await cleanupTmpDir();
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});
