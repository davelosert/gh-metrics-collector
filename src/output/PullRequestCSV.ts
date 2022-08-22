import { createCSVStreamTo } from './CSVOutputStream';

type PullRequestCsvRow = {
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  repository: string;
  organisation: string
};

const pullRequestConfig: Record<keyof PullRequestCsvRow, string> = {
  closedAt: 'closedAt',
  createdAt: 'createdAt',
  mergedAt: 'mergedAt',
  updatedAt: 'updatedAt',
  repository: 'repository',
  organisation: 'organisation'
}

async function createPullRequestCSVStream(targetPath: string) {
  return createCSVStreamTo(targetPath, pullRequestConfig);
}

export {
  createPullRequestCSVStream
};

export type {
  PullRequestCsvRow
};
