import 'mocha';
import { expect } from 'chai';
import { fetchRemoteNotifications, isRemoteNotificationExpired } from './remote';
import { RemoteNotification } from './types';

const DevRemoteNotificationProviderURL =
  'https://gist.githubusercontent.com/XinyuCRO/8bb2405059681fdd6e2e2812a2c5aed6/raw/1235991857628cc591c31a2768d8642fc611d851/notification.dev.json';

describe('remote notification', () => {
  let notifications: RemoteNotification[] = [];

  beforeAll(async () => {
    notifications = await fetchRemoteNotifications(DevRemoteNotificationProviderURL);
  });

  it('can fetch remote notifications', async () => {
    expect(notifications).to.be.an('array');
    expect(notifications).to.be.length(3);
    expect(notifications[0].id).to.be.eq(0);
    expect(notifications[0].created_at).to.be.eq(1658220227);

    expect(notifications[2].id).to.be.eq(2);
  });

  it('can detect expired notification', async () => {
    expect(isRemoteNotificationExpired(notifications[0], new Date(1660869820 * 1000))).to.be.eq(
      false,
    );

    expect(isRemoteNotificationExpired(notifications[0], new Date(1660869899 * 1000))).to.be.eq(
      true,
    );

    expect(isRemoteNotificationExpired(notifications[1])).to.be.eq(true);
  });
});

describe('notification management', () => {
  const mockFridge = {};

  beforeAll(() => {
    global.Storage.prototype.setItem = jest.fn((key, value) => {
      mockFridge[key] = value;
    });
    global.Storage.prototype.getItem = jest.fn(key => mockFridge[key]);
  });

  it('mock localstorage', async () => {
    expect(true).to.equal(true);
  });
});
