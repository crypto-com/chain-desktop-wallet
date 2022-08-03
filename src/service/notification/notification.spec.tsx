/* eslint-disable import/no-extraneous-dependencies */

import * as React from 'react';
import 'mocha';
import { expect } from 'chai';
import { act, renderHook } from '@testing-library/react-hooks';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { fetchRemoteNotifications, isRemoteNotificationExpired } from './remote';
import { NotificationItem, RemoteNotification } from './types';
import { getNotificationsInSettings, setNotificationsInSettings, useNotification } from '.';

const DevRemoteNotificationProviderURL =
  'https://gist.githubusercontent.com/XinyuCRO/8bb2405059681fdd6e2e2812a2c5aed6/raw/000656629828f47db1fdc9af6ca95599f021e64c/notification.dev.json';

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

    expect(isRemoteNotificationExpired(notifications[0], new Date(2660869820 * 1000))).to.be.eq(
      true,
    );

    expect(isRemoteNotificationExpired(notifications[0])).to.be.eq(false);

    expect(isRemoteNotificationExpired(notifications[1])).to.be.eq(true);

    expect(isRemoteNotificationExpired(notifications[2])).to.be.eq(false);
  });
});

describe('notification management', () => {
  beforeEach(() => {
    const localStorageMock = (function() {
      let store = {};
      return {
        getItem(key) {
          return store[key];
        },
        setItem(key, value) {
          store[key] = value.toString();
        },
        clear() {
          store = {};
        },
        removeItem(key) {
          delete store[key];
        },
      };
    })();

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    globalThis.Notification = (jest.fn() as any) as jest.Mocked<typeof Notification>;
  });

  it('localstorage', async () => {
    const n1: NotificationItem = {
      id: 10,
      createdAt: 1658220227,
      content: 'test',
      type: 'remote',
      isRead: false,
    };

    setNotificationsInSettings([n1]);
    const ns = getNotificationsInSettings();
    expect(ns).to.be.length(1);
    expect(ns[0].isRead).to.be.eq(false);
  });

  it('useNotification hook', async () => {
    const wrapper = ({ children }) => (
      <RecoilRoot>
        <RecoilNexus />
        {children}
      </RecoilRoot>
    );
    const { result, waitForNextUpdate } = renderHook(() => useNotification(), { wrapper });

    expect(result.current.notifications).to.be.length(0);

    await act(async () => {
      const newNotifications = await result.current.loadRemoteNotifications(
        DevRemoteNotificationProviderURL,
      );
      expect(newNotifications).to.be.length(2);
      expect(newNotifications[0].id).to.be.eq(0);
      expect(newNotifications[1].id).to.be.eq(2);
      result.current.postRemoteNotifications(newNotifications);
    });

    expect(result.current.notifications).to.be.length(2);
    expect(result.current.notifications[0].isRead).to.be.eq(false);

    await act(async () => {
      result.current.markAsRead(result.current.notifications[0]);
      await waitForNextUpdate();
    });

    expect(result.current.notifications).to.be.length(2);
    expect(result.current.notifications[0].isRead).to.be.eq(true);

    await act(async () => {
      result.current.postLocalNotification({
        content: 'abc',
        type: 'customerService',
      });
      await waitForNextUpdate();
    });

    expect(result.current.notifications).to.be.length(3);
    expect(result.current.notifications[2].content).to.be.eq('abc');
    expect(result.current.notifications[2].isRead).to.be.eq(false);

    await act(async () => {
      result.current.markAsRead(result.current.notifications[2]);
      await waitForNextUpdate();
    });

    expect(result.current.notifications[2].isRead).to.be.eq(true);

    await act(async () => {
      const newNotifications = await result.current.loadRemoteNotifications(
        DevRemoteNotificationProviderURL,
      );
      expect(newNotifications).to.be.length(0);
      result.current.postRemoteNotifications(newNotifications);
    });

    expect(result.current.notifications).to.be.length(3);

    await act(async () => {
      result.current.postLocalNotification({
        content: 'abc',
        type: 'customerService',
      });
      await waitForNextUpdate();
    });

    expect(result.current.notifications[0].isRead).to.be.eq(true);
    expect(result.current.notifications[1].isRead).to.be.eq(false);
    expect(result.current.notifications[2].isRead).to.be.eq(true);
  });

  it('read logic', async () => {
    const wrapper = ({ children }) => (
      <RecoilRoot>
        <RecoilNexus />
        {children}
      </RecoilRoot>
    );
    const { result, waitForNextUpdate } = renderHook(() => useNotification(), { wrapper });

    expect(result.current.notifications).to.be.length(0);
    await act(async () => {
      const newNotifications = await result.current.loadRemoteNotifications(
        DevRemoteNotificationProviderURL,
      );
      expect(newNotifications).to.be.length(2);
      expect(newNotifications[0].id).to.be.eq(0);
      expect(newNotifications[1].id).to.be.eq(2);
      result.current.postRemoteNotifications(newNotifications);
    });

    expect(result.current.notifications).to.be.length(2);
    expect(result.current.notifications[0].isRead).to.be.eq(false);
    expect(result.current.notifications[1].isRead).to.be.eq(false);

    await act(async () => {
      result.current.markAllAsRead();
    });

    expect(result.current.hasUnread).to.be.eq(false);
    expect(result.current.notifications[0].isRead).to.be.eq(true);
    expect(result.current.notifications[1].isRead).to.be.eq(true);

    await act(async () => {
      result.current.postLocalNotification({
        content: 'abc',
        type: 'customerService',
      });
      await waitForNextUpdate();
      result.current.postLocalNotification({
        content: 'abc',
        type: 'customerService',
      });
    });

    expect(result.current.hasUnread).to.be.eq(true);
    expect(result.current.notifications[2].isRead).to.be.eq(false);
    expect(result.current.notifications[3].isRead).to.be.eq(false);

    await act(async () => {
      result.current.markAsRead(result.current.notifications[2]);
      await waitForNextUpdate();
      result.current.markAsRead(result.current.notifications[3]);
    });

    expect(result.current.hasUnread).to.be.eq(false);

    await act(async () => {
      result.current.postLocalNotification({
        content: 'abc',
        type: 'customerService',
      });
      await waitForNextUpdate();
      result.current.postLocalNotification({
        content: 'abc',
        type: 'customerService',
      });
    });

    expect(result.current.hasUnread).to.be.eq(true);

    await act(async () => {
      result.current.markAllAsRead();
    });

    expect(result.current.hasUnread).to.be.eq(false);
  });
});
