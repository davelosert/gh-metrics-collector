import { DateRange } from './DateRange';
import { PullRequestCsvRow } from '../output/PullRequestCSV';
import { isBefore, isAfter, isEqual } from 'date-fns';

type CompareFunction = (compareDate: Date) => boolean;

const createRangeFilter = ({ since, until }: DateRange) => {
  const compareFunctions: CompareFunction[] = [];
  
  if(since) {
    compareFunctions.push((compareDate: Date) => {
      return isAfter(compareDate, since) || isEqual(compareDate, since);
    });
  }
  
  if(until) {
    compareFunctions.push((compareDate: Date) => {
      return isBefore(compareDate, until) || isEqual(compareDate, until);
    });
  }
  
  if(!since && !until) {
    // If no filters are defined, we can just allow all
    compareFunctions.push(allowAll);
  }

  return (pullRequest: PullRequestCsvRow): boolean => {
    const datesToCheck = [
      new Date(pullRequest.createdAt),
      new Date(pullRequest.updatedAt)
    ];

    if(pullRequest.closedAt) datesToCheck.push(new Date(pullRequest.closedAt));
    if(pullRequest.mergedAt) datesToCheck.push(new Date(pullRequest.mergedAt));

    return datesToCheck.some(date => compareFunctions.every(check => check(date)));
  };
}

export {
  createRangeFilter
};

function allowAll() {
  return true;
}
