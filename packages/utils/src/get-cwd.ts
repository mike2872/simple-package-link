export function getCWD() {
  return process.env.INIT_CWD ?? process.cwd();
}
