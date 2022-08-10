import React, { useEffect, useRef, useState } from 'react';
import { Route, useHistory, Switch as RouterSwitch } from 'react-router-dom';
import '../settings.less';
import 'antd/dist/antd.css';
import { Alert, Button, Checkbox, Form, Input, message, Tabs } from 'antd';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';

import { sessionState, walletAllAssetsState, walletListState } from '../../../recoil/atom';
import { walletService } from '../../../service/WalletService';
import { SettingsDataUpdate } from '../../../models/Wallet';
import ModalPopup from '../../../components/ModalPopup/ModalPopup';

import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../../../config/StaticConfig';
import { UserAsset, UserAssetConfig } from '../../../models/UserAsset';
import AddressBook from '../tabs/AddressBook/AddressBook';
import { getCronosTendermintAsset } from '../../../utils/utils';
import RevokePermission from '../tabs/RevokePermission/RevokePermission';

import { GeneralSettingsForm } from './GeneralSettingsForm';
import { MetaInfoComponent } from './MetaInfoComponent';
import { getAssetConfigFromWalletConfig } from '../utils';
import Support from '../tabs/Support/Support';
import { getDefaultUserAssetConfig } from '../../../config/StaticAssets';

const { ipcRenderer } = window.require('electron');

const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

export const FormSettings = () => {
  const [form] = Form.useForm();
  const [confirmClearForm] = Form.useForm();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isConfirmClearVisible, setIsConfirmClearVisible] = useState(false);
  const [session, setSession] = useRecoilState(sessionState);
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>();
  
  const didMountRef = useRef(false);

  const prevSettings: UserAssetConfig =
    session.activeAsset?.config || getAssetConfigFromWalletConfig(session.wallet.config);

  const history = useHistory();

  const setWalletList = useSetRecoilState(walletListState);

  const [t] = useTranslation();

  let networkFee = FIXED_DEFAULT_FEE;
  let gasLimit = FIXED_DEFAULT_GAS_LIMIT;

  useEffect(() => {
    const croAsset = getCronosTendermintAsset(walletAllAssets);

    if (prevSettings.fee !== undefined) {
      networkFee = prevSettings.fee.networkFee;
    }
    if (prevSettings.fee !== undefined) {
      gasLimit = prevSettings.fee.gasLimit;
    }

    form.setFieldsValue({
      nodeUrl: prevSettings.nodeUrl,
      chainId: prevSettings.chainId,
      indexingUrl: prevSettings.indexingUrl,
      networkFee,
      gasLimit,
    });
    if (!currentAssetIdentifier && croAsset) {
      setCurrentAssetIdentifier(croAsset?.identifier);

    }
    if (!didMountRef.current && croAsset) {
      didMountRef.current = true;
      setSession({
        ...session,
        activeAsset: croAsset,
      });
      return;
    }
  }, [form, prevSettings, walletAllAssets, session, setSession]);

  const onFinish = async values => {
    const defaultGasLimit =
      prevSettings.fee !== undefined ? prevSettings.fee.gasLimit : FIXED_DEFAULT_GAS_LIMIT;
    const defaultNetworkFee =
      prevSettings.fee !== undefined ? prevSettings.fee.networkFee : FIXED_DEFAULT_FEE;

    if (
      prevSettings.nodeUrl === values.nodeUrl &&
      prevSettings.indexingUrl === values.indexingUrl &&
      prevSettings.chainId === values.chainId &&
      defaultGasLimit === values.gasLimit &&
      defaultNetworkFee === values.networkFee
    ) {
      // No value was updated, we stop here
      return;
    }

    setIsButtonLoading(true);
    const settingsDataUpdate: SettingsDataUpdate = {
      walletId: session.wallet.identifier,
      chainId: values.chainId,
      nodeUrl: values.nodeUrl,
      indexingUrl: values.indexingUrl,
      networkFee: String(values.networkFee),
      gasLimit: String(values.gasLimit),
    };

    // This wallet level settings update should only imply the primary asset.
    if (!session.activeAsset?.isSecondaryAsset) {
      await walletService.updateWalletNodeConfig(settingsDataUpdate);
    }

    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);

    // Save updated active asset settings.
    const previousAssetConfig = session.activeAsset?.config;
    const newlyUpdatedAsset: UserAsset = {
      ...session.activeAsset!,
      config: {
        ...previousAssetConfig!,
        chainId: settingsDataUpdate.chainId!,
        fee: { gasLimit: settingsDataUpdate.gasLimit!, networkFee: settingsDataUpdate.networkFee! },
        indexingUrl: settingsDataUpdate.indexingUrl!,
        nodeUrl: settingsDataUpdate.nodeUrl!,
      },
    };

    await walletService.saveAssets([newlyUpdatedAsset]);
    setCurrentAssetIdentifier(newlyUpdatedAsset.identifier);

    const newSession = {
      ...session,
      wallet: updatedWallet,
      activeAsset: newlyUpdatedAsset,
    };
    setSession(newSession);

    await walletService.setCurrentSession(newSession);

    const allNewUpdatedWallets = await walletService.retrieveAllWallets();
    setWalletList(allNewUpdatedWallets);

    const allAssets = await walletService.retrieveCurrentWalletAssets(newSession);
    setWalletAllAssets(allAssets);

    setIsButtonLoading(false);
    message.success(
      `${t('settings.message.success1')} ${
        session.wallet.config.enableGeneralSettings
          ? `(${t('settings.message.success2')} ${session.wallet.config.name} ${t(
            'settings.message.success3',
          )})`
          : ''
      }`,
    );
  };

  const onRestorePrevSettings = () => {
    form.setFieldsValue({
      nodeUrl: prevSettings.nodeUrl,
      chainId: prevSettings.chainId,
      indexingUrl: prevSettings.indexingUrl,
      networkFee:
        prevSettings.fee && prevSettings.fee.networkFee ? prevSettings.fee.networkFee : '',
      gasLimit:
        prevSettings.fee && prevSettings.fee.gasLimit ? prevSettings.fee.gasLimit : '',
    });
  };

  const onDefaultSettings = () => {
    const defaultAssetConfig = getDefaultUserAssetConfig(session.activeAsset!, session);
    form.setFieldsValue({
      nodeUrl: defaultAssetConfig?.config.nodeUrl,
      chainId: defaultAssetConfig?.config.chainId,
      indexingUrl: defaultAssetConfig?.config.indexingUrl,
      networkFee: defaultAssetConfig?.config.fee.networkFee,
      gasLimit: defaultAssetConfig?.config.fee.gasLimit,
    });
  };

  const handleCancelConfirmationModal = () => {
    if (!isButtonLoading) {
      setIsConfirmationModalVisible(false);
      setIsConfirmClearVisible(false);
    }
  };

  const onConfirmClear = () => {
    setIsButtonLoading(true);
    const deleteDBRequest = indexedDB.deleteDatabase('NeDB');
    deleteDBRequest.onsuccess = () => {
      setTimeout(() => {
        ipcRenderer.send('restart_app');
      }, 2000);
    };
  };

  return (
    <Route
      path="/settings/:tab?"
      render={({ match }) => {
        return (
          <RouterSwitch>
            <Form
              {...layout}
              layout="vertical"
              form={form}
              name="control-hooks"
              requiredMark="optional"
              onFinish={onFinish}
            >
              <Tabs
                // defaultActiveKey={match.params.tab}
                activeKey={match.params.tab}
                onChange={key => {
                  history.push(`/settings/${key}`);
                }}
              >
                <TabPane tab={t('settings.tab1')} key="1">
                  <div className="site-layout-background settings-content">
                    <div className="container">
                      <GeneralSettingsForm
                        currentAssetIdentifier={currentAssetIdentifier}
                        setCurrentAssetIdentifier={setCurrentAssetIdentifier}
                      />
                      <Form.Item {...tailLayout} className="button">
                        <Button type="primary" htmlType="submit" loading={isButtonLoading}>
                          {t('general.save')}
                        </Button>
                        <Button type="link" htmlType="button" onClick={onRestorePrevSettings}>
                          {t('general.discard')}
                        </Button>
                        <Button type="link" htmlType="button" onClick={onDefaultSettings} style={{ color: '#20bca4' }}>
                          {t('general.default')}
                        </Button>
                      </Form.Item>
                    </div>
                  </div>
                </TabPane>
                <TabPane tab={t('settings.tab2')} key="2">
                  <MetaInfoComponent />
                </TabPane>
                <TabPane tab={t('settings.addressBook.title')} key="addressBook">
                  <AddressBook />
                </TabPane>

                <TabPane tab={t('settings.tab3')} key="4">
                  <div className="site-layout-background settings-content">
                    <div className="container">
                      <div className="description">{t('settings.clearStorage.description')}</div>
                      <Button
                        type="primary"
                        loading={isButtonLoading}
                        onClick={() => setIsConfirmationModalVisible(true)}
                        danger
                      >
                        {t('settings.clearStorage.button1')}
                      </Button>
                    </div>
                  </div>
                  <ModalPopup
                    isModalVisible={isConfirmationModalVisible}
                    handleCancel={handleCancelConfirmationModal}
                    handleOk={onConfirmClear}
                    confirmationLoading={isButtonLoading}
                    closable={!isButtonLoading}
                    footer={[
                      <Button
                        key="submit"
                        type="primary"
                        loading={isButtonLoading}
                        onClick={() => setIsConfirmClearVisible(true)}
                        hidden={isConfirmClearVisible}
                        disabled={isButtonDisabled}
                        danger
                      >
                        {t('general.confirm')}
                      </Button>,
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isButtonLoading}
                        hidden={!isConfirmClearVisible}
                        onClick={confirmClearForm.submit}
                        danger
                      >
                        {t('settings.clearStorage.button1')}
                      </Button>,

                      <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
                        {t('general.cancel')}
                      </Button>,
                    ]}
                    okText="Confirm"
                  >
                    <>
                      <div className="title">{t('settings.clearStorage.modal.title')}</div>

                      {!isConfirmClearVisible ? (
                        <>
                          <div className="description">
                            {t('settings.clearStorage.modal.description1')}
                          </div>
                          <div className="item">
                            <Alert
                              type="warning"
                              message={t('settings.clearStorage.modal.warning')}
                              showIcon
                            />
                          </div>
                          <div className="item">
                            <Checkbox
                              checked={!isButtonDisabled}
                              onChange={() => setIsButtonDisabled(!isButtonDisabled)}
                            >
                              {t('settings.clearStorage.modal.disclaimer')}
                            </Checkbox>
                          </div>
                        </>
                      ) : (
                        <div className="item">
                          <Form
                            {...layout}
                            layout="vertical"
                            form={confirmClearForm}
                            name="control-hooks"
                            requiredMark="optional"
                            onFinish={onConfirmClear}
                          >
                            <Form.Item
                              name="clear"
                              label={`${t('settings.clearStorage.modal.form1.clear.label')} CLEAR`}
                              hasFeedback
                              rules={[
                                {
                                  required: true,
                                  message: `${t(
                                    'settings.clearStorage.modal.form1.clear.error1',
                                  )} CLEAR`,
                                },
                                {
                                  pattern: /^CLEAR$/,
                                  message: `${t(
                                    'settings.clearStorage.modal.form1.clear.error1',
                                  )} CLEAR`,
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                          </Form>
                        </div>
                      )}
                    </>
                  </ModalPopup>
                </TabPane>
                <TabPane tab={t('settings.revoke-permission')} key="revoke-permission">
                  <RevokePermission />
                </TabPane>
                <TabPane tab={t('settings.support.title')} key="support">
                  <Support />
                </TabPane>
              </Tabs>
            </Form>
          </RouterSwitch>
        );
      }}
    />
  );
};
