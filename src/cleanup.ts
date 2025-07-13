import { clearRenderResult } from './screen';

type CleanUpFunction = () => void;

const cleanupQueue = new Set<CleanUpFunction>();

export default async function cleanup() {
  clearRenderResult();

  for (const fn of cleanupQueue.values()) {
    await fn();
  }

  cleanupQueue.clear();
}

export function addToCleanupQueue(fn: CleanUpFunction) {
  cleanupQueue.add(fn);
}
