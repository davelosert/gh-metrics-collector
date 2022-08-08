import * as fs from 'fs';
import * as path from 'path';
import * as Stream from 'stream';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { HELPER_DIRS } from '../helperDirs';
import { CommitCsvRow } from '../output/CommitCSV';
import { Repository } from '../Repository';

const execAsync = promisify(exec);

type CollectCommitOptions = {
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
    const repoPath = path.resolve(HELPER_DIRS.gitRepoTarget, options.repository.name);

    try {
      await execAsync(`git clone --filter=blob:none --no-checkout https://${options.githubToken}@${options.githubServer}/${options.organisation}/${options.repository.name}.git ${repoPath}`);
    } catch(err: any) {
      console.error(`Error while checking out repository ${options.repository.name}: 
      ${err.toString().replace(options.githubToken, '<REDACTED_TOKEN>')}`);
    }

    const commandOptions = [ 'log', '--pretty=format:%H,%aN,%aI,%cN,$cI', '--all'];
    if(options.since) commandOptions.push(`--since='${options.since}'`)
    if(options.until) commandOptions.push(`--until='${options.until}'`)

    return new Promise<CollectCommitResults>((resolve, reject) => {
      const collectCommitResult = {
        commitsCount: 0
      };
      
      const logCmd = spawn('git', commandOptions, { cwd: repoPath });
      
      logCmd.stdout.on('data', function(data) {
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
            console.warn(`
              Found commit with SHA ${commitSHA} without a date in ${options.organisation}/${options.repository.name}. ${JSON.stringify(commitRaw, null, 2)}` );
            return;
          };

          collectCommitResult.commitsCount += 1;
          targetStream.push(commit);
        });
      });

      logCmd.stderr.on('data', (data) => {
        console.error(`Error while reading logs for repository ${options.repository.name}:`, data.toString());
        console.error(`Skipping reading furhter logs on this repository...`);
        // todo: Handle Errors gracefully
        resolve(collectCommitResult);
      });
      
      logCmd.on('close', async () => {
        console.log(`Added ${collectCommitResult.commitsCount} commits from ${options.organisation}/${options.repository.name}.`);
        await fs.promises.rm(repoPath, { recursive: true });
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
