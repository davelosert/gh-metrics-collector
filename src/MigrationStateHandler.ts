import { Tasks } from './options';
import { RepositoryIdentifier } from './Repository';

interface MigrationStateHandler {
  addRepositories: (repoIds: RepositoryIdentifier[]) => void;
  reportTaskStart: (task: Tasks, outputCSV: string) => void;
  reportRepoStart: (task: Tasks, repoId: RepositoryIdentifier) => void;
  reportRepoDone: (task: Tasks, repoId: RepositoryIdentifier, itemNumber: number) => void;
  reportTaskDone: (task: Tasks) => void;
  reportScriptDone: () => void;
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

type MigrationState = {
  scriptStartTime: ProcessHrTimeOutput;
  taskStates: Partial<TasksStates>;
  repoStates: RepoStates; 
  overallRepoCount: number;
}

const initialState = (repoStates: RepoStates): MigrationState => ({
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

const createMigrationStateHandler = (): MigrationStateHandler => {
  let currentState: MigrationState = initialState({});

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
      console.log(`Execution metrics-collection for ${repoIds.length} repositories.`);
    },
    reportTaskStart: (task: Tasks, outputCSV: string) => {
      currentState.taskStates[task] = initialTaskState(outputCSV);
      console.log(`\nSTARTING COLLECTION FOR ${task.toUpperCase()}`);
      console.log('------------')
    },
    reportRepoStart(task, repoId) {
      console.log(`[${repoId.organisation}/${repoId.name}] Starting collection of ${getItemNameByTask(task)}!`);
    },
    reportRepoDone: (task: Tasks, repoId: RepositoryIdentifier, itemCount: number) => {
      const repoKey = createKeyFromRepoId(repoId);
      const repoState = currentState.repoStates[repoKey];
      const taskState = currentState.taskStates[task]!;
      repoState.tasksDone[task] = true;
      taskState.itemCount += itemCount;
      taskState.repoCount++; 

      const [ elapsedSeconds ] = process.hrtime(taskState.taskStartTime);
      console.debug(`[${repoId.organisation}/${repoId.name}] finished!`);
      console.log(`[Intermediate Status] Collected ${taskState.itemCount} ${getItemNameByTask(task)} from ${taskState.repoCount} / ${currentState.overallRepoCount} Repositories. Elapsed time: ${elapsedSeconds} seconds.`);
    },
    reportTaskDone: (task: Tasks) => {
      const taskState = currentState.taskStates[task]!;
      const [ elapsedSeconds ] = process.hrtime(taskState.taskStartTime);

      console.log('------------')
      console.log(`COLLECTION FINISHED FOR ${task.toUpperCase()}.`);
      console.log(`\n\n[Final Status] Collected ${taskState.itemCount} ${getItemNameByTask(task)} from ${taskState.repoCount} / ${currentState.overallRepoCount} Repositories and wrote them to ${taskState.outputCSVPath}. Elapsed time: ${elapsedSeconds} seconds.`);
    },
    reportScriptDone: () => {
      const [ elapsedSeconds ] = process.hrtime(currentState.scriptStartTime);
      console.log(`\nScript finished in ${elapsedSeconds} seconds.`);
    }
  }
};

export {
  createMigrationStateHandler
};

export type {
  MigrationStateHandler
};