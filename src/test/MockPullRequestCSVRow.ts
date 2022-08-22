import { PullRequestCsvRow } from '../output/PullRequestCSV';

const defaultMockPullRequestCSVRow: PullRequestCsvRow = {
  createdAt: '2022-03-28T08:12:00.000Z',
  closedAt: '2022-03-31T18:00:00.000Z',
  mergedAt: '2022-03-31T18:00:00.000Z',
  updatedAt: '2022-03-31T18:00:00.000Z',
  organisation: 'testorganization',
  repository: 'testrepository'
};

const createTestMockPullRequestCSVRow = (overwrites: Partial<PullRequestCsvRow> = {}): PullRequestCsvRow => ({
  ...defaultMockPullRequestCSVRow,
  ...overwrites
});

export {
  createTestMockPullRequestCSVRow
};
