import { Octokit } from 'octokit';
import { Repository } from '../Repository';

type GetAllRepositoriesOptions = {
  octokit: Octokit;
  organisation: string;
}

const fetchAllRepositories = async ({ octokit, organisation}: GetAllRepositoriesOptions) => {
  const repoIterator = octokit.paginate.iterator(octokit.rest.repos.listForOrg, {
    org: organisation,
    per_page: 100,
  });
  
  const repositories: Repository[] = [];
  console.log(`Fetching repositories for organisation ${organisation} with pagination...`);
  let page = 0;

  for await (const currentPageResponse of repoIterator) {
    page++;
    console.log(`Read page ${page} with ${currentPageResponse.data.length} repositories.`);

    currentPageResponse.data.map(repo => {
      repositories.push({
        name: repo.name
      });
    });
  }

  console.log(`All Repositories for organisation ${organisation} fetched!`);

  return repositories;
}


export {
  fetchAllRepositories
};

export type {
  Repository
};
