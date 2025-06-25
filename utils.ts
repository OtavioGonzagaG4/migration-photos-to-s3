export function formatLogs(id: string, message: string, err?: any): string {
  const errorMessage = err ? `, ${err}` : "";
  return `${new Date().toISOString()},${id},${message},${errorMessage}\n`;
}
