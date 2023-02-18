import { childProcessSync } from './child-process';

export function getProcessTree(pid: string | number) {
  const helper = (pids = [pid]) => {
    return [
      pids,
      ...pids.map(childPid =>
        childProcessSync('pgrep', {
          args: ['-P', String(childPid)],
          type: 'return',
        }),
      ),
    ];
  };

  const tree = helper();
  return tree.flat(Infinity).map(String);
}
