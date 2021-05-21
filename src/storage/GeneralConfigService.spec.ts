import 'mocha';
import { expect } from 'chai';

import { getRandomId } from '../crypto/RandomGen';
import { GeneralConfigService } from './GeneralConfigService';

describe('Testing general config storage service', () => {
  it('Test initial check on checkIfHasShownAnalyticsPopup', async () => {
    const mockGeneralConfig = new GeneralConfigService(`mock-general-config-${getRandomId()}`);

    const checkIfHasShownAnalyticsPopup = await mockGeneralConfig.checkIfHasShownAnalyticsPopup();
    expect(checkIfHasShownAnalyticsPopup).to.eq(false);

    await mockGeneralConfig.setHasShownAnalyticsPopup(true);

    expect(await mockGeneralConfig.checkIfHasShownAnalyticsPopup()).to.eq(true);
  });
});
