import { Octokit } from 'octokit';
import { throttling } from '@octokit/plugin-throttling';
import { retry } from '@octokit/plugin-retry';

type OctokitOptions = {
  githubToken: string;
  githubServer: string;
};

const CustomOctokit = Octokit
  .plugin(throttling)
  .plugin(retry)

const RETRY_LIMIT = 3;
const createOctokit = ({ githubToken, githubServer }: OctokitOptions) => {

  // only set the baseUrl if we are not hitting github.com
  let baseUrl = undefined;
  if(githubServer !== 'github.com') {
    baseUrl = `https://${githubServer}/api/v3`;
  }

  return new CustomOctokit({
    auth: githubToken,
    baseUrl,
    throttle: {
      onRateLimit: (retryAfter: number, options: any, octokit: Octokit) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (options.request.retryCount < RETRY_LIMIT) {
          // only retries once
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }

        // todo: Implement proper error handling here.
        console.error('Aborting!.');
      },
      onSecondaryRateLimit: (retryAfter: number, options: any, octokit: Octokit) => {
        // does not retry, only logs a warning
        octokit.log.warn(
          `SecondaryRateLimit detected for request ${options.method} ${options.url}`
        );

        if (options.request.retryCount < RETRY_LIMIT) {
          // only retries once
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
    },
    request: {
      retries: RETRY_LIMIT,
    }
});

}

export {
  createOctokit
};

export type {
  OctokitOptions
};
