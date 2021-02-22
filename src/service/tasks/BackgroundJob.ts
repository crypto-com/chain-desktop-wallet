import { walletService } from '../WalletService';

class BackgroundTask {
  public readonly interval: number;

  constructor(interval: number) {
    this.interval = interval;
  }

  public runJobs() {
    setInterval(async () => {
      try {
        await walletService.syncAll();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error while running background task: ${e}`);
      }
    }, this.interval);
  }
}

const interval = 30_000; // 30 seconds
export const task = new BackgroundTask(interval);
