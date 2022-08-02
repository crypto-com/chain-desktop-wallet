import * as React from 'react';
import { useEffect, useState } from 'react';
import { useIntercom } from 'react-use-intercom';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';
import i18n from '../../language/I18n';

let lastUnreadCount = 0;

export const handleUnreadCountChange = (unreadCount: number) => {
  if (unreadCount < 1) {
    lastUnreadCount = 0;
    return;
  }

  if (unreadCount > lastUnreadCount) {
    // eslint-disable-next-line no-new
    new Notification(i18n.t('general.customerService.notification.title'), {
      body: i18n.t('general.customerService.notification.body'),
    });
  }

  lastUnreadCount = unreadCount;
};

const IntercomCustomerService = () => {
  const { boot, shutdown } = useIntercom();
  const asset = useCronosEvmAsset();
  const [lastAddress, setLastAddress] = useState('');

  useEffect(() => {
    const address = asset?.address?.toLowerCase();

    if (!address) {
      return;
    }

    if (lastAddress !== address) {
      setLastAddress(address);
      lastUnreadCount = 0;
      shutdown();
      boot({
        hideDefaultLauncher: true,
        userId: address,
      });
    }
  }, [asset]);

  return <></>;
};

export default IntercomCustomerService;
