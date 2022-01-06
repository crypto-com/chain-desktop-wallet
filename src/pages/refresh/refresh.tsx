import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

function RefreshPage() {
  const history = useHistory();

  const locationState: any = useLocation().state ?? {
    from: '',
  };

  useEffect(() => {
    if (locationState.from !== '') {
      history.push(locationState.from);
    } else {
      history.push('/');
    }
  }, [locationState]);

  return (
    <main className="refresh-page">
      <div className="container" />
    </main>
  );
}

export default RefreshPage;
