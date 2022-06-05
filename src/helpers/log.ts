interface Step {
  n: number;
  n_total: number;
  message: string;
}

export const logStep = (step: Step) => {
  const progress = `\x1b[34m[${step.n}/${step.n_total}]\x1b[0m`;
  const msg = `\x1b[32m${step.message}\x1b[0m`;
  console.log(progress, msg);
};

export const logSubStep = (step: Step) => {
  const progress = `\x1b[34m[${step.n}/${step.n_total}]\x1b[0m`;
  const msg = `\x1b[32m${step.message}\x1b[0m`;
  console.log(`   `, progress, msg);
};
