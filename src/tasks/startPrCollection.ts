import { Octokit } from 'octokit';
import PQueue from 'p-queue';
import { DirHelper, createDateCSVName } from '../helperDirs';
import { CollectionStateHandler } from './CollectionStateHandler';
import { ProgramOptions } from '../options';
import { createPullRequestCSVStream } from '../output/PullRequestCSV';
import { createTaskLogger } from '../TaskLogger';
import { collectPullRequests } from './collectPullRequests';

type StartPRCollectionArgs = {
  octokit: Octokit;
  stateHandler: CollectionStateHandler;
  options: ProgramOptions;
  csvPath: string;
};

async function startPrCollection({ octokit, stateHandler, options, csvPath }: StartPRCollectionArgs) {
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

export {
  startPrCollection
};
