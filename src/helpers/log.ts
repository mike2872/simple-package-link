interface Step {
  pkgId?: string;
  n: number;
  n_total: number;
  message: string;
}

export const logStep = (step: Step) => {
  const msg = `\x1b[32m${step.message}\x1b[0m`;
  const progress = step.pkgId
    ? `\x1b[35m[${step.pkgId}] \x1b[34m[${step.n}/${step.n_total}]\x1b[0m`
    : `\x1b[34m[${step.n}/${step.n_total}]\x1b[0m`;

  console.log(progress, msg);
};

export const logSubStep = (step: Step) => {
  const msg = `\x1b[32m${step.message}\x1b[0m`;
  const progress = `\x1b[34m[${step.n}/${step.n_total}]\x1b[0m`;

  console.log(
    step.pkgId ? new Array(`[${step.pkgId}]`.length + 1).join(' ') : `   `,
    progress,
    msg,
  );
};
