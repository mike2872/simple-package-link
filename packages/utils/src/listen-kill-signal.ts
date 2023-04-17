const getProcess = () => process;

export function listenKillSignal(onKilled: (signal: string) => void) {
  const _process = getProcess();

  ['disconnect', 'SIGINT', 'SIGTERM'].forEach(signal =>
    _process.on(signal, () => {
      onKilled(signal);
    }),
  );
}
