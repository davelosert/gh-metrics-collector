import { Octokit } from 'octokit';
import PQueue from 'p-queue';
import { createDateCSVName, DirHelper } from '../helperDirs';
import { CollectionStateHandler } from './CollectionStateHandler';
import { ProgramOptions } from '../options';
import { createCommitCSVStream } from '../output/CommitCSV';
import { createTaskLogger } from '../TaskLogger';
import { collectGitCommits } from './collectCommits';

type CommitCollectionArgs = {
  octokit: Octokit;
  dirHelper: DirHelper;
  githubToken: string;
  stateHandler: CollectionStateHandler;
  options: ProgramOptions;
};

async function startCommitCollection({ octokit, dirHelper, githubToken, stateHandler, options }: CommitCollectionArgs) {
    const csvFileName = createDateCSVName('commits');
    const csvPath = dirHelper.createOutputFilePath(csvFileName);
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

export {
  startCommitCollection
};
