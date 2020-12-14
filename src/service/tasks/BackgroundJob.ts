import { assetService } from '../AssetService';

class BackgroundTask {
  public readonly interval: number;

  constructor(interval: number) {
    this.interval = interval;
  }

  public runJobs() {
    setInterval(async () => {
      try {
        await assetService.loadAndSaveAssetPrices();
        await assetService.fetchAndUpdateBalances();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error while running background task: ${e}`);
      }
    }, this.interval);
  }
}

const interval = 10_000; // Milliseconds
export const task = new BackgroundTask(interval);
