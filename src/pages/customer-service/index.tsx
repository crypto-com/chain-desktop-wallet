import * as React from 'react';
import { useEffect, useState } from 'react';
import { useIntercom } from 'react-use-intercom';
import { useCronosEvmAsset } from '../../hooks/useAsset';
import i18n from '../../language/I18n';
import { postLocalNotification } from '../../service/notification';

let lastUnreadCount = 0;

export const handleUnreadCountChange = (unreadCount: number) => {
  if (unreadCount < 1) {
    lastUnreadCount = 0;
    return;
  }

  if (unreadCount > lastUnreadCount) {

    postLocalNotification({
      content: i18n.t('general.customerService.notification.body'),
      type: 'customerService'
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
