import { Octokit } from 'octokit';
import { Repository, RepositoryIdentifier } from '../Repository';
import { logger } from '../TaskLogger';

type GetAllRepositoriesOptions = {
  octokit: Octokit;
  organisation: string;
}

const fetchAllRepositories = async ({ octokit, organisation}: GetAllRepositoriesOptions): Promise<RepositoryIdentifier[]> => {
  const repoIterator = octokit.paginate.iterator(octokit.rest.repos.listForOrg, {
    org: organisation,
    per_page: 100,
  });
  
  const startTime = process.hrtime();
  
  const repositories: RepositoryIdentifier[] = [];
  logger.log(`Fetching repositories for organisation ${organisation} with pagination...`);
  let page = 0;

  for await (const currentPageResponse of repoIterator) {
    page++;
    const [ elapsedSeconds ] = process.hrtime(startTime);
    logger.log(`Read page ${page} with ${currentPageResponse.data.length} repositories. Elapsed time: ${elapsedSeconds} seconds.`);

    currentPageResponse.data.map(repo => {
      repositories.push({
        name: repo.name,
        organisation
      });
    });
  }

  const [ elapsedSeconds ] = process.hrtime(startTime);
  console.log(`All Repositories for organisation ${organisation} fetched in ${elapsedSeconds} seconds.!`);

  return repositories;
}


export {
  fetchAllRepositories
};

export type {
  Repository
};
