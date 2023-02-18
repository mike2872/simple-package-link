interface Step {
  pkgId?: string;
  n?: number;
  n_total?: number;
  message: string;
}

export const logStep = (step: Step) => {
  const msg = `\x1b[32m${step.message}\x1b[0m`;
  const pkgId = step.pkgId ? `\x1b[35m[spl/${step.pkgId}] ` : `\x1b[35m[spl] `;
  const progress =
    step.n && step.n_total ? `\x1b[34m[${step.n}/${step.n_total}]\x1b[0m` : '';

  console.log(pkgId, progress, msg);
};

export const logSubStep = (step: Step) => {
  const msg = `\x1b[32m${step.message}\x1b[0m`;
  const progress =
    step.n && step.n_total ? `\x1b[34m[${step.n}/${step.n_total}]\x1b[0m` : '';

  console.log(
    new Array((step.pkgId ? `[spl/${step.pkgId}]` : `[spl]`).length + 7).join(
      ' ',
    ),
    progress,
    msg,
  );
};
