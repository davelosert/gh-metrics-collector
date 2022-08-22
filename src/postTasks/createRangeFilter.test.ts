import { describe, it, expect } from 'vitest';
import { createTestMockPullRequestCSVRow } from '../test/MockPullRequestCSVRow';
import { createRangeFilter } from './createRangeFilter';

describe('createRangeFiler', () => {
  it('always returns true if no date range is given.', async (): Promise<void> => {
    const noDateFilter = createRangeFilter({ since: undefined, until: undefined });
    const result = noDateFilter(createTestMockPullRequestCSVRow());
    
    expect(result).toBe(true);
  });
  
  it('returns true if createdAt is after the "since" value.', async (): Promise<void> => {
    const timeRange = { since: new Date('2022-01-01T00:00:00Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-06-01T00:00:00.000Z',
      updatedAt: '2022-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });

  it('returns true if createdAt is after "since" in the given timezone.', () => {
    const timeRange = { 
      since: new Date('2022-01-01T12:00:00.000Z'), until: undefined
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-01-01T14:01:00.000+02:00',
      updatedAt: '2022-01-01T14:01:00.000+02:00',
      closedAt: undefined,
      mergedAt: undefined,
    });

    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });
  
  it('returns false if createdAt is before "since", but only in another timzone.', () => {
    const timeRange = { 
      since: new Date('2022-01-01T12:00:00.000Z'), until: undefined
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-01-01T14:01:00.000+03:00',
      updatedAt: '2022-01-01T14:01:00.000+03:00',
      closedAt: undefined,
      mergedAt: undefined,
    });

    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(false);

  });
  
  it('returns true if createdAt is equal to "since" value.', async (): Promise<void> => {
    const timeRange = { since: new Date('2022-01-01T00:00:00.000Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-01-01T00:00:00.000Z',
      updatedAt: '2022-01-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);

  })

  it('returns true if updatedAt is after the "since" value.', async (): Promise<void> => {
    const timeRange = { since: new Date('2022-01-01T00:00:00Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2022-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });
  
  it('returns false if createdAt is before the "since" value.', async (): Promise<void> => {
    const timeRange = { since: new Date('2022-01-01T00:00:00Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2021-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(false);
  });
  
  it('returns true if createdAt is before, but closedAt is after "since" value.', async (): Promise<void> =>{
    const timeRange = { since: new Date('2022-01-01T00:00:00Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2021-06-01T00:00:00.000Z',
      closedAt: '2022-06-01T00:00:00.000Z',
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });
  
  it('returns true if mergedAt is after "since" value.', async (): Promise<void> => {
    const timeRange = { since: new Date('2022-01-01T00:00:00Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2022-06-01T00:00:00.000Z',
      closedAt: '2021-06-01T00:00:00.000Z',
      mergedAt: '2022-06-01T00:00:00.000Z',
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });
  
  it('returns false if no date is after the "since" value.', async (): Promise<void> => {
    const timeRange = { since: new Date('2022-01-01T00:00:00Z'), until: undefined };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2021-06-01T00:00:00.000Z',
      closedAt: '2021-06-01T00:00:00.000Z',
      mergedAt: '2021-06-01T00:00:00.000Z',
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(false);
  });
  
  it('returns true if createdAt is before "until" value.', () => {
    const timeRange = { since: undefined, until: new Date('2023-01-01T00:00:00.000Z') };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-06-01T00:00:00.000Z',
      updatedAt: '2022-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });
  
  it('returns true if createdAt is equal to "until" value.', () => {
    const timeRange = { since: undefined, until: new Date('2022-06-01T00:00:00.000Z') };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-06-01T00:00:00.000Z',
      updatedAt: '2022-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });

  it('returns true if createdAt is in between "since" and "until".', () => {
    const timeRange = { 
      since: new Date('2022-01-01T00:00:00.000Z'), until: new Date('2022-12-31T23:59:59.999Z') 
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2022-06-01T00:00:00.000Z',
      updatedAt: '2023-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });

  it('returns false if neither createdAt nor updatedAt is in between "since" and "until".', () => {
    const timeRange = { 
      since: new Date('2022-01-01T00:00:00.000Z'), until: new Date('2022-12-31T23:59:59.999Z') 
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2023-06-01T00:00:00.000Z',
      updatedAt: '2023-06-01T00:00:00.000Z',
      closedAt: undefined,
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(false);
  });
  
  
  it('returns true if closedAt is in between "since" and "until".', () => {
    const timeRange = { 
      since: new Date('2022-01-01T00:00:00.000Z'), until: new Date('2022-12-31T23:59:59.999Z') 
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2021-06-01T00:00:00.000Z',
      closedAt: '2022-06-01T00:00:00.000Z',
      mergedAt: undefined,
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });

  it('returns true if mergedAt is in between "since" and "until".', () => {
    const timeRange = { 
      since: new Date('2022-01-01T00:00:00.000Z'), until: new Date('2022-12-31T23:59:59.999Z') 
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2021-06-01T00:00:00.000Z',
      closedAt: '2021-06-01T00:00:00.000Z',
      mergedAt: '2022-06-01T00:00:00.000Z',
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(true);
  });

  it('returns false if no date is in between "since" and "until".', () => {
    const timeRange = { 
      since: new Date('2022-01-01T00:00:00.000Z'), until: new Date('2022-12-31T23:59:59.999Z')
    };
    const csvRow = createTestMockPullRequestCSVRow({
      createdAt: '2021-06-01T00:00:00.000Z',
      updatedAt: '2021-06-01T00:00:00.000Z',
      closedAt: '2023-06-01T00:00:00.000Z',
      mergedAt: '2023-06-01T00:00:00.000Z',
    });
    const rangeFilter = createRangeFilter(timeRange);
    
    expect(rangeFilter(csvRow)).toBe(false);
  });
});
