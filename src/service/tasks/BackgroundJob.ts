import { walletService } from '../WalletService';

class BackgroundTask {
  public readonly interval: number;

  constructor(interval: number) {
    this.interval = interval;
  }

  public runJobs() {
    setInterval(async () => {
      try {
        await walletService.syncData();
        await walletService.syncTransactionsData();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error while running background task: ${e}`);
      }
    }, this.interval);
  }
}

const interval = 20_000; // 20 seconds
export const task = new BackgroundTask(interval);
