import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Stream from 'stream';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
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

const collectGitCommits = async (options: CollectCommitOptions, targetStream: Stream.Readable) => {
    const repoPath = path.resolve(HELPER_DIRS.gitRepoTarget, options.repository.name);

    try {
      await execAsync(`git clone --filter=blob:none --no-checkout https://${options.githubToken}@${options.githubServer}/${options.organisation}/${options.repository.name}.git ${repoPath}`);
    } catch(err: any) {
      console.error(`Error while checking out repository ${options.repository}: 
      ${err.toString().replace(options.githubToken, '<REDACTED_TOKEN>')}`);
    }

    const commandOptions = [ 'log', '--pretty=format:%H,%aN,%aI,%cN,$cI', ];
    if(options.since) commandOptions.push(`--since='${options.since}'`)
    if(options.until) commandOptions.push(`--until='${options.until}'`)

    const logCmd = spawn('git', commandOptions, { cwd: repoPath });
    logCmd.stdout.on('data', function(data) {
      const commitRows = data.toString().split('\n');
      commitRows.forEach((commitRaw: string) => {
        const [ commitSHA, commitAuthor, commitDate, committerName, committerDate ] = commitRaw.split(',');
        const commit: CommitCsvRow = {
          commitDate: commitDate ?? committerDate,
          commitAuthor: commitAuthor ?? committerName ?? 'Unknown',
          commitSHA,
          repository: options.repository.name,
          organisation: options.organisation
        };
        
        if(!commit.commitDate) {
          console.warn(`Found commit with SHA ${commitSHA} without a date in ${options.organisation}/${options.repository}. Skipping this commit...`);
          return;
        };

        targetStream.push(commit);
      });
    });

    logCmd.stderr.on('data', (data) => {
      console.error(`Error while reading logs for repository ${options.repository}:`, data.toString());
      // todo: Handle Errors gracefully
    });
    
    logCmd.on('exit', () => {
      fs.promises.rm(repoPath, { recursive: true });
    });
}

export {
  collectGitCommits
};

export type {
  CollectCommitOptions
};
