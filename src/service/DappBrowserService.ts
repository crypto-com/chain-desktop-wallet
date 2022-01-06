import { BrowserBookmark, SavedBrowserBookmark } from '../models/DappBrowser';
import { StorageService } from '../storage/StorageService';

export class DappBrowserService {
  private readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  async addBookmark(bookmark: BrowserBookmark) {
    let model: SavedBrowserBookmark | undefined;
    try {
      const saved = await this.storageService.saveBrowserBookmark(bookmark);
      model = {
        // eslint-disable-next-line no-underscore-dangle
        id: saved._id,
        url: saved.url,
        title: saved.title,
        faviconURL: saved.faviconURL,
      };
    } catch (error) {
      // no-op
    }

    return model;
  }

  async removeBookmark(id: string) {
    let success = false;
    try {
      await this.storageService.removeBrowserBookmark(id);
      success = true;
    } catch (error) {
      // no-op
    }

    return success;
  }

  async retrieveBookmarks() {
    let models: SavedBrowserBookmark[] = [];

    try {
      const documents = await this.storageService.retrieveAllBrowserBookmarks();
      models = documents.map(doc => ({
        /* eslint no-underscore-dangle: 0 */
        id: doc._id,
        url: doc.url,
        title: doc.title,
        faviconURL: doc.faviconURL,
      }));
    } catch (error) {
      // no-op
    }

    return models;
  }
}
