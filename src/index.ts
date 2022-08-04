import { createCommitCSVFileName, createHelperDirs } from './helperDirs';
import { program } from 'commander';
import { createCSVStreamTo } from './output/CommitCSV';
import { collectGitCommits } from './tasks/collectCommits';
import { ProgramOptions, validateOptions } from './options';
import { fetchAllRepositories, Repository } from './api/fetchAllRepositories';
import { createOctokit } from './api/Octokit';

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

    const csvFileName = createCommitCSVFileName();
    const csvPath = helperDirs.createTmpFilePath(csvFileName);
    const commitTargetStream = await createCSVStreamTo(csvPath);
    
    const repos: Repository[] = options.repository ? 
      [{ name: options.repository }] 
      : await fetchAllRepositories({ octokit, organisation: options.organisation });
    
    console.log(`\nSTARTING COMMIT COLLECTION`);
    console.log('------------')
    let overallCommitCount = 0;
    for await (const repository of repos) {
      console.log(`Getting commits for ${options.organisation}/${repository.name}`);
      const { commitsCount } = await collectGitCommits({
        ...options,
        repository,
        githubToken
      }, commitTargetStream);
      
      overallCommitCount += commitsCount;
    }
    console.log('------------')
    console.log(`COMMIT COLLECTION FINISHED`);
    console.log(`Wrote ${overallCommitCount} commits to ${csvPath}`);
    
    const [ processSeconds ] = process.hrtime(startTime);
    console.log(`Script finished after ${processSeconds} seconds.`);
}
