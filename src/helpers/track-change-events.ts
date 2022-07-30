import { debounce, uniq } from 'lodash';
import DevProcess from './dev-process';
import md5Hash from './md5-hash';

type ChangeEventParams = {
  restartRequired?: boolean;
};

export default function trackChangeEvents(
  devProcess: InstanceType<typeof DevProcess>,
) {
  let restartQueued = false;
  let changeEvents = [] as string[];

  const changeEventsDoneDebounced = debounce(
    async (events: string[]) => {
      if (events.length === 0) {
        if (restartQueued) {
          restartQueued = false;
          devProcess.restart();
        } else {
          devProcess.resume();
        }
      }
    },
    500,
    {
      trailing: true,
      leading: false,
    },
  );

  return ({ restartRequired }: ChangeEventParams) => {
    if (restartRequired) {
      restartQueued = true;
    }

    const hash = md5Hash(new Date().toISOString());
    changeEvents = uniq([...changeEvents, hash]);

    if (restartRequired) {
      devProcess.terminate();
    } else {
      devProcess.pause();
    }

    return () => {
      changeEvents = changeEvents.filter(event => event !== hash);
      changeEventsDoneDebounced(changeEvents);
    };
  };
}

export type NewChangeEvent = ReturnType<typeof trackChangeEvents>;
