import { Octokit } from 'octokit';
import * as Stream from 'stream';
import { PullRequestCsvRow } from '../output/PullRequestCSV';
import { Repository } from '../Repository';
import { Logger } from '../TaskLogger';

type CollectPullRequestOptions = {
  logger: Logger;
  organisation: string;
  repository: Repository;
  octokit: Octokit;
  since?: string;
  until?: string;
}

type CollectPullRequestResults = {
  pullRequestCount: number;
  pages: number;
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
  const { octokit, logger } = options;

  let continueFetching = true;
  let nextCursor;
  const pullRequestResultSummary: CollectPullRequestResults = {
    pullRequestCount: 0,
    pages: 0
  };

  try {
    do {
      pullRequestResultSummary.pages++;
      logger.debug(`Fetching page ${pullRequestResultSummary.pages}...`)
      const result: PRQueryResponse = await octokit.graphql(`
        query allPrs($owner: String!, $repo: String!, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            pullRequests(first: 100, after: $cursor, orderBy: { field:CREATED_AT, direction:ASC}) {
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
      
      if(pullRequestResultSummary.pages === 1) {
        logger.debug(`Found a total of ${result.repository.pullRequests.totalCount} pull requests. This will require a total of ${Math.ceil(result.repository.pullRequests.totalCount / 100)} pages to be fetched.`);
      }

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
    logger.debug(`All pages fetched!`)
  } catch (error) {
    logger.error(`Error while fetching pull requests for repository`, error);
    logger.error(`Skipping fetching further pull requests on this repository...`);
  }

  return pullRequestResultSummary;
}

export {
  collectPullRequests
};

export type {
  CollectPullRequestOptions,
  CollectPullRequestResults
};
