import * as React from 'react';
import { useEffect, useState } from 'react';
import { useIntercom } from 'react-use-intercom';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';

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
