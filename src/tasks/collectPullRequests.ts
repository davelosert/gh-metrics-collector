import { Octokit } from 'octokit';
import * as Stream from 'stream';
import { PullRequestCsvRow } from '../output/PullRequestCSV';
import { Repository } from '../Repository';

type CollectPullRequestOptions = {
  organisation: string;
  repository: Repository;
  octokit: Octokit;
  since?: string;
  until?: string;
  
}

type CollectPullRequestResults = {
  pullRequestCount: number;
}

type PRData = {
  createdAt: string;
  updatedAt: string;
  closedAt: string;
  mergedAt: string;
  state: string;
}

type PageInfo = {
  hasNextPage: boolean,
  endCursor: string,
}

type PRQueryResponse = {
  repository: {
    pullRequests: {
      totalCount: number;
      nodes: PRData[];
      pageInfo: PageInfo;
    }
  }
}

const collectPullRequests = async (options: CollectPullRequestOptions, targetStream: Stream.Readable): Promise<CollectPullRequestResults> => {

  const { octokit } = options;
  let continueFetching = true;
  let nextCursor;
  const pullRequestResultSummary: CollectPullRequestResults = {
    pullRequestCount: 0
  };

  do {
    const result: PRQueryResponse = await octokit.graphql(`
      query allPrs($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 5, after: $cursor, orderBy: { field:CREATED_AT, direction:ASC}) {
            totalCount
            nodes {
              createdAt
              updatedAt
              closedAt
              mergedAt
            }
            pageInfo {
              hasNextPage,
              startCursor,
              endCursor
            }
          }
        }
      }
    `, {
      owner: options.organisation,
      repo: options.repository.name,
      cursor: nextCursor
    });
    continueFetching = result.repository.pullRequests.pageInfo.hasNextPage;
    nextCursor = result.repository.pullRequests.pageInfo.endCursor;

    // console.log(`[${options.organisation}/${options.repository.name}] Fetched ${result.repository.pullRequests.nodes.length} PRs. Fetching next page: ${continueFetching}`);

    // Todo: Filter out PRs not matchin dates of the since and until periods
    result.repository.pullRequests.nodes.forEach((result) => {
      const csvRow: PullRequestCsvRow = {
        ...result,
        organisation: options.organisation,
        repository: options.repository.name,
      }
      targetStream.push(csvRow);
      pullRequestResultSummary.pullRequestCount++;
    });
  } while(continueFetching);

  return pullRequestResultSummary;
}

export {
  collectPullRequests
};

export type {
  CollectPullRequestOptions,
  CollectPullRequestResults
};
