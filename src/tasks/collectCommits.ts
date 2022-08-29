import { CommitCsvRow } from '../output/CommitCSV';
import { exec, spawn } from 'child_process';
import { HELPER_DIRS } from '../DirHelper';
import { promisify } from 'util';
import { Repository } from '../Repository';
import { Logger } from '../TaskLogger';
import * as fs from 'fs';
import * as path from 'path';
import * as Stream from 'stream';

const execAsync = promisify(exec);

type CollectCommitOptions = {
  logger: Logger;
  organisation: string;
  repository: Repository;
  githubToken: string;
  githubServer: string;
  since?: string;
  until?: string;
}

type CollectCommitResults = {
  commitsCount: number;
};

const collectGitCommits = async (options: CollectCommitOptions, targetStream: Stream.Readable): Promise<CollectCommitResults> => {
    const {githubServer,githubToken,logger,organisation,repository,since,until} = options;
    const repoPath = path.resolve(HELPER_DIRS.gitRepoTarget, options.repository.name);

    try {
      logger.debug(`Cloning repo to ${repoPath}...`);
      await execAsync(`git clone --filter=blob:none --no-checkout https://${githubToken}@${githubServer}/${organisation}/${repository.name}.git ${repoPath}`);
    } catch(err: any) {
      logger.error(`Error while checking out repository ${options.repository.name}: 
      ${err.toString().replace(options.githubToken, '<REDACTED_TOKEN>')}`);
    }

    const commandOptions = [ 'log', '--pretty=format:%H,%aN,%aI,%cN,$cI', '--all'];
    if(since) commandOptions.push(`--since='${since}'`)
    if(until) commandOptions.push(`--until='${until}'`)

    return new Promise<CollectCommitResults>((resolve, reject) => {
      const collectCommitResult = {
        commitsCount: 0
      };
      
      logger.debug('Collecting Logs and streaming them to CSV...');
      const gitLogCmd = spawn('git', commandOptions, { cwd: repoPath });
      
      gitLogCmd.stdout.on('data', function(data) {
        const commitRows = data.toString().split('\n');
        commitRows.forEach((commitRaw: string) => {
          
          // Sometimes, empty lines sneak in
          if(commitRaw === '') return;

          const [ commitSHA, commitAuthor, commitDate, committerName, committerDate ] = commitRaw.split(',');
          const commit: CommitCsvRow = {
            commitDate: commitDate ?? committerDate,
            commitAuthor: commitAuthor ?? committerName ?? 'Unknown',
            commitSHA,
            repository: options.repository.name,
            organisation: options.organisation
          };
          
          if(!commit.commitDate) {
            logger.warn(`
              Found commit with SHA ${commitSHA} without a date: ${JSON.stringify(commitRaw, null, 2)}` );
            return;
          };

          collectCommitResult.commitsCount += 1;
          targetStream.push(commit);
        });
      });

      gitLogCmd.stderr.on('data', (data) => {
        logger.error(`Error while reading logs for repository ${options.repository.name}:`, data.toString());
        logger.error(`Skipping reading furhter logs on this repository...`);
        // todo: Handle Errors gracefully
        resolve(collectCommitResult);
      });
      
      gitLogCmd.on('close', async () => {
        try {
          await fs.promises.rm(repoPath, { recursive: true, force: true });
        } catch (err: any) {
          logger.warn(`Error while removing repository at path ${repoPath}: ${err.message}.\nYou might have to remove this manually.`); 
        }
        resolve(collectCommitResult);
      });
    });
}

export {
  collectGitCommits
};

export type {
  CollectCommitOptions
};
