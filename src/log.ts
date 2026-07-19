const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

export function log(label: string, data: unknown): void {
  console.log(`\n${CYAN}--- ${label} ---${RESET}`);
  console.log(JSON.stringify(data, null, 2));
}
