export interface SavedBrowserBookmark {
  id: string;
  url: string;
  title: string;
  faviconURL: string;
}

export type BrowserBookmark = Omit<SavedBrowserBookmark, 'id'>;
