import { Tasks } from '../options';
import { logger } from '../TaskLogger';
import { RepositoryIdentifier } from '../Repository';

interface CollectionStateHandler {
  addRepositories: (repoIds: RepositoryIdentifier[]) => void;
  getAllTargetRepos: () => RepositoryIdentifier[];
  reportTaskStart: (task: Tasks, outputCSV: string) => void;
  reportRepoStart: (task: Tasks, repoId: RepositoryIdentifier) => void;
  reportRepoDone: (task: Tasks, repoId: RepositoryIdentifier, itemNumber: number) => void;
  reportTaskDone: (task: Tasks) => void;
  reportScriptDone: () => void;
}

type CollectionState = {
  scriptStartTime: ProcessHrTimeOutput;
  taskStates: Partial<TasksStates>;
  repoStates: RepoStates; 
  overallRepoCount: number;
}

type ProcessHrTimeOutput = [number, number];

type RepoState = {
  repoId: RepositoryIdentifier;
  tasksDone: Record<Tasks, boolean>;
}
type RepoStates = {[repoId: string]: RepoState};

type TaskState = {
  taskStartTime: ProcessHrTimeOutput;
  outputCSVPath: string;
  repoCount: number;
  itemCount: number;
};
type TasksStates = Partial<Record<Tasks, TaskState>>;


const initialState = (repoStates: RepoStates): CollectionState => ({
  scriptStartTime: process.hrtime(),
  taskStates: {},
  repoStates,
  overallRepoCount: 0
});

const initialTaskState = (outputCSVPath: string): TaskState => ({
  taskStartTime: process.hrtime(),
  outputCSVPath,
  repoCount: 0,
  itemCount: 0
});

const createKeyFromRepoId = (repoId: RepositoryIdentifier): string => {
  return `${repoId.organisation}/${repoId.name}`;
};

const getItemNameByTask = (task: Tasks): string => {
  if(task === 'commits') {
    return 'Commits'
  }
  return 'Pull Requests'
}

const createCollectionStateHandler = (): CollectionStateHandler => {
  let currentState: CollectionState = initialState({});

  return {
    addRepositories: (repoIds: RepositoryIdentifier[]) => {
      currentState.overallRepoCount = repoIds.length;
      currentState.repoStates = repoIds.reduce((repoStates, repoId) => {
        const repoKey = createKeyFromRepoId(repoId);
        return {
          ...repoStates,
          [repoKey]: {
            repoId,
            tasksDone: {
              commitCollection: false,
              prCollection: false
            }
          }
        }
      }, {});
      logger.log(`Execution metrics-collection for ${repoIds.length} repositories.`);
    },
    getAllTargetRepos: (): RepositoryIdentifier[] => {
      return Object.values(currentState.repoStates).map(repoState => repoState.repoId);
    },
    reportTaskStart: (task: Tasks, outputCSV: string) => {
      currentState.taskStates[task] = initialTaskState(outputCSV);
      logger.log(`\nSTARTING COLLECTION FOR ${task.toUpperCase()}`);
      logger.log('------------')
    },
    reportRepoStart(task, repoId) {
      logger.debug(`[${repoId.organisation}/${repoId.name}] Starting collection of ${getItemNameByTask(task)}!`);
    },
    reportRepoDone: (task: Tasks, repoId: RepositoryIdentifier, itemCount: number) => {
      const repoKey = createKeyFromRepoId(repoId);
      const repoState = currentState.repoStates[repoKey];
      const taskState = currentState.taskStates[task]!;
      repoState.tasksDone[task] = true;
      taskState.itemCount += itemCount;
      taskState.repoCount++; 

      const [ elapsedSeconds ] = process.hrtime(taskState.taskStartTime);
      logger.debug(`[${repoId.organisation}/${repoId.name}] finished!`);
      logger.log(`[Intermediate Status] Collected ${taskState.itemCount} ${getItemNameByTask(task)} from ${taskState.repoCount} / ${currentState.overallRepoCount} Repositories. Elapsed time: ${elapsedSeconds} seconds.`);
    },
    reportTaskDone: (task: Tasks) => {
      const taskState = currentState.taskStates[task]!;
      const [ elapsedSeconds ] = process.hrtime(taskState.taskStartTime);
      logger.log(`\n[Final Status] Collected ${taskState.itemCount} ${getItemNameByTask(task)} from ${taskState.repoCount} / ${currentState.overallRepoCount} Repositories and wrote them to ${taskState.outputCSVPath}. Elapsed time: ${elapsedSeconds} seconds.`);
      logger.log('------------')
      logger.log(`COLLECTION FINISHED FOR ${task.toUpperCase()}.`);
    },
    reportScriptDone: () => {
      const [ elapsedSeconds ] = process.hrtime(currentState.scriptStartTime);
      logger.log(`\nScript finished in ${elapsedSeconds} seconds.`);
    }
  }
};

export {
  createCollectionStateHandler
};

export type {
  CollectionStateHandler
};
