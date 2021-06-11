import React, { useState, useEffect } from 'react';
import './nft.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Card, Tabs, List, Avatar, Radio, Table, Button, Form, Input } from 'antd';
import Icon, { MenuOutlined, AppstoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRecoilValue, useRecoilState } from 'recoil';
import ReactPlayer from 'react-player';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';

import {
  sessionState,
  nftListState,
  fetchingDBState,
  walletAssetState,
  ledgerIsExpertModeState,
} from '../../recoil/atom';
import { ellipsis, middleEllipsis, isJson } from '../../utils/utils';
import { NftModel, NftProcessedModel, BroadCastResult } from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';

import { walletService } from '../../service/WalletService';
import { secretStoreService } from '../../storage/SecretStoreService';
import { detectConditionsError, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import {
  AnalyticsActions,
  AnalyticsCategory,
  AnalyticsService,
  AnalyticsTxType,
} from '../../service/analytics/AnalyticsService';

import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';

import IconTick from '../../svg/IconTick';
import IconPlayer from '../../svg/IconPlayer';
import nftThumbnail from '../../assets/nft-thumbnail.png';

const { Header, Content, Footer, Sider } = Layout;
const { TabPane } = Tabs;
const { Meta } = Card;
const layout = {};

const NftPage = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    tokenId: '',
    denomId: '',
    senderAddress: '',
    recipientAddress: '',
    amount: '',
    memo: '',
  });
  const currentSession = useRecoilValue(sessionState);
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const [nftList, setNftList] = useRecoilState(nftListState);
  const fetchingDB = useRecoilValue(fetchingDBState);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');

  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isNftModalVisible, setIsNftModalVisible] = useState(false);
  const [isNftTransferModalVisible, setIsNftTransferModalVisible] = useState(false);
  const [isNftTransferConfirmVisible, setIsNftTransferConfirmVisible] = useState(false);

  const [nft, setNft] = useState<NftProcessedModel | undefined>();
  const [nftView, setNftView] = useState('grid');
  const [processedNftList, setProcessedNftList] = useState<NftProcessedModel[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>('');

  const analyticsService = new AnalyticsService(currentSession);

  const nftViewOptions = [
    { label: <MenuOutlined />, value: 'list' },
    { label: <AppstoreOutlined />, value: 'grid' },
  ];

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    setIsNftModalVisible(false);
    setIsNftTransferConfirmVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const processNftList = (currentList: NftModel[] | undefined) => {
    if (currentList) {
      return currentList.map(item => {
        const denomSchema = isJson(item.denomSchema)
          ? JSON.parse(item.denomSchema)
          : item.denomSchema;
        const tokenData = isJson(item.tokenData) ? JSON.parse(item.tokenData) : item.tokenData;
        const nftModel: NftProcessedModel = {
          ...item,
          denomSchema,
          tokenData,
        };
        return nftModel;
      });
    }
    return [];
  };

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    walletAsset,
    AddressType.USER,
  );

  const supportedVideo = (mimeType: string | undefined) => {
    switch (mimeType) {
      case 'video/mp4':
      case 'video/webm':
      case 'video/ogg':
      case 'audio/ogg':
      case 'audio/mpeg':
        return true;
      default:
        return false;
    }
  };

  const renderPreview = (_nft: NftProcessedModel | undefined, showThumbnail: boolean = true) => {
    if (!showThumbnail && supportedVideo(_nft?.tokenData.mimeType)) {
      return (
        <ReactPlayer
          url={videoUrl}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
              },
            },
          }}
          controls
          playing={isVideoPlaying}
        />
      );
    }
    return (
      <img
        alt={_nft?.denomName}
        src={_nft?.tokenData.image ? _nft?.tokenData.image : nftThumbnail}
        onError={e => {
          (e.target as HTMLImageElement).src = nftThumbnail;
        }}
      />
    );
  };

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsNftTransferConfirmVisible(true);
    setIsNftTransferModalVisible(true);
    setFormValues({
      ...form.getFieldsValue(true),
      // Replace scientific notation to plain string values
      denomId: nft?.denomId,
      tokenId: nft?.tokenId,
      senderAddress: currentSession.wallet.address,
    });
  };

  const showPasswordInput = () => {
    if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      showConfirmationModal();
    } else {
      setInputPasswordVisible(true);
      setIsNftTransferModalVisible(false);
    }
  };

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);
    showConfirmationModal();
  };

  const onConfirmTransfer = async () => {
    const { walletType } = currentSession.wallet;
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }
    try {
      setConfirmLoading(true);
      const sendResult = await walletService.sendNFT({
        tokenId: formValues.tokenId,
        denomId: formValues.denomId,
        sender: formValues.senderAddress,
        recipient: formValues.recipientAddress,
        memo,
        decryptedPhrase,
        asset: walletAsset,
        walletType,
      });

      analyticsService.logTransactionEvent(
        broadcastResult.transactionHash as string,
        formValues.amount,
        AnalyticsTxType.TransferTransaction,
        AnalyticsActions.FundsTransfer,
        AnalyticsCategory.Transfer,
      );

      const latestLoadedNFTs = await walletService.retrieveNFTs(currentSession.wallet.identifier);
      setNftList(latestLoadedNFTs);
      const processedNFTsLists = processNftList(latestLoadedNFTs);
      setProcessedNftList(processedNFTsLists);

      setBroadcastResult(sendResult);

      setIsNftModalVisible(false);
      setIsNftTransferModalVisible(false);
      setIsNftTransferConfirmVisible(false);
      setConfirmLoading(false);

      setIsSuccessModalVisible(true);
      setInputPasswordVisible(false);

      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);

      form.resetFields();
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(e.toString()));
      }

      setErrorMessages(e.message.split(': '));
      setIsNftModalVisible(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  useEffect(() => {
    const fetchNftList = async () => {
      const currentNftList = processNftList(nftList);
      setProcessedNftList(currentNftList);
    };
    fetchNftList();
  }, [fetchingDB]);

  const NftColumns = [
    {
      title: 'Drop Name',
      key: 'name',
      render: record => {
        return record.tokenData.drop ? record.tokenData.drop : 'n.a.';
      },
    },
    {
      title: 'NFT Name',
      key: 'denomId',
      render: record => {
        return record.denomId;
      },
    },
    {
      title: 'NFT ID',
      key: 'tokenId',
      render: record => {
        return record.tokenId;
      },
    },
    {
      title: 'View',
      key: 'viewAction',
      render: record => {
        return (
          <a
            onClick={() => {
              setNft(record);
              setVideoUrl(record?.tokenData.animation_url);
              setIsVideoPlaying(true);
              setIsNftModalVisible(true);
            }}
          >
            View
          </a>
        );
      },
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">My NFT</Header>
      <div className="header-description">
        An overview of your NFT Collection on Crypto.org Chain.
      </div>
      <Content>
        <Tabs defaultActiveKey="1">
          <TabPane tab="NFT Collection" key="1">
            <div className="site-layout-background nft-content">
              <div className="view-selection">
                <Radio.Group
                  options={nftViewOptions}
                  defaultValue="grid"
                  onChange={e => {
                    setNftView(e.target.value);
                  }}
                  optionType="button"
                />
              </div>
              {nftView === 'grid' ? (
                <List
                  grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 2,
                    md: 3,
                    lg: 3,
                    xl: 3,
                    xxl: 6,
                  }}
                  dataSource={processedNftList}
                  renderItem={item => (
                    <List.Item>
                      <Card
                        style={{ width: 200 }}
                        cover={
                          <>
                            {renderPreview(item)}
                            {item?.tokenData.mimeType === 'video/mp4' ? (
                              <Icon component={IconPlayer} />
                            ) : (
                              ''
                            )}
                          </>
                        }
                        hoverable
                        onClick={() => {
                          setNft(item);
                          setVideoUrl(item?.tokenData.animation_url);
                          setIsVideoPlaying(true);
                          setIsNftModalVisible(true);
                        }}
                        className="nft"
                      >
                        <Meta
                          title={
                            item?.tokenData.drop
                              ? ellipsis(item?.tokenData.drop, 20)
                              : ellipsis(item?.denomId, 20)
                          }
                          description={
                            <>
                              <Avatar
                                style={{
                                  background:
                                    'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                  verticalAlign: 'middle',
                                }}
                              />
                              {middleEllipsis(item?.tokenOwner, 6)}{' '}
                              {item?.isMintedByCDC ? <IconTick style={{ height: '12px' }} /> : ''}
                            </>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                  pagination={{
                    pageSize: 6,
                  }}
                  loading={fetchingDB}
                />
              ) : (
                <Table columns={NftColumns} dataSource={processedNftList} />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <ModalPopup
        isModalVisible={isNftModalVisible}
        handleCancel={() => {
          // Stop the video when closing
          setIsVideoPlaying(false);
          setVideoUrl(undefined);
          setTimeout(() => {
            setIsNftModalVisible(false);
          }, 10);
        }}
        handleOk={() => {}}
        footer={[]}
        okText="Confirm"
        className="nft-modal"
      >
        <Layout className="nft-detail">
          <Content>
            <div className="nft-image">{renderPreview(nft, false)}</div>
          </Content>
          <Sider width="50%">
            <>
              <div className="title">
                {nft?.tokenData.drop ? nft?.tokenData.drop : nft?.denomId}
              </div>
              <div className="item">
                <Meta
                  description={
                    <>
                      <Avatar
                        style={{
                          background:
                            'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                          verticalAlign: 'middle',
                        }}
                      />
                      {nft?.tokenOwner}{' '}
                      {nft?.isMintedByCDC ? <IconTick style={{ height: '12px' }} /> : ''}
                    </>
                  }
                />
              </div>
              <div className="item">
                <div className="subtitle">About the Drop</div>
                <div className="description">
                  {nft?.tokenData.description ? nft?.tokenData.description : 'n.a.'}
                </div>
              </div>
              <div className="item">
                <div className="table-row">
                  <div>NFT Name</div>
                  <div>{nft?.denomName}</div>
                </div>
                <div className="table-row">
                  <div>NFT ID</div>
                  <div>{nft?.tokenId}</div>
                </div>
                {nft?.tokenData.mimeType ? (
                  <div className="table-row">
                    <div>CONTENT URL</div>
                    <a
                      data-original={nft?.denomName}
                      target="_blank"
                      rel="noreferrer"
                      href={
                        nft?.tokenData.mimeType === 'video/mp4'
                          ? nft?.tokenData.animation_url
                          : nft?.tokenData.image
                      }
                    >
                      {nft?.tokenData.mimeType === 'video/mp4'
                        ? nft?.tokenData.animation_url
                        : nft?.tokenData.image}
                    </a>
                  </div>
                ) : (
                  ''
                )}
              </div>
              <div className="item">
                <Button
                  key="submit"
                  type="primary"
                  onClick={() => {
                    setIsNftTransferModalVisible(true);
                    setIsNftModalVisible(false);
                  }}
                >
                  Transfer NFT
                </Button>
              </div>
              <div className="item goto-marketplace">
                {nft?.marketplaceLink !== '' ? (
                  <a
                    data-original={nft?.denomName}
                    target="_blank"
                    rel="noreferrer"
                    href={nft?.marketplaceLink}
                  >
                    View on Crypto.com NFT
                  </a>
                ) : (
                  ''
                )}
              </div>
            </>
          </Sider>
        </Layout>
      </ModalPopup>
      <ModalPopup
        isModalVisible={isNftTransferModalVisible}
        handleCancel={() => {
          setIsNftTransferModalVisible(false);
          setIsNftTransferConfirmVisible(false);
          setIsNftModalVisible(true);
          form.resetFields();
        }}
        handleOk={() => {}}
        footer={[
          isNftTransferConfirmVisible ? (
            <Button
              key="submit"
              type="primary"
              onClick={onConfirmTransfer}
              loading={confirmLoading}
            >
              Confirm Transfer
            </Button>
          ) : (
            <Button
              key="submit"
              type="primary"
              htmlType="submit"
              onClick={() => {
                form.submit();
              }}
            >
              Next
            </Button>
          ),
          <Button
            key="back"
            type="link"
            onClick={() => {
              if (isNftTransferConfirmVisible) {
                setIsNftTransferConfirmVisible(false);
              } else {
                setIsNftTransferModalVisible(false);
                setIsNftModalVisible(true);
                form.resetFields();
              }
            }}
          >
            Cancel
          </Button>,
        ]}
        okText="Confirm"
        className="nft-transfer-modal"
      >
        <>
          {isNftTransferConfirmVisible ? (
            <>
              <div className="title">Confirm Transfer</div>
              <div className="description">Please review the information below.</div>
              <div className="item">
                <div className="nft-image">{renderPreview(nft)}</div>
              </div>
              <div className="item">
                <div className="label">To</div>
                <div className="address">{`${form.getFieldValue('recipientAddress')}`}</div>
              </div>
              <div className="item notice">
                <Layout>
                  <Sider width="20px">
                    <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                  </Sider>
                  <Content>
                    This NFT is on the Crypto.org Chain. Transferring the NFT to a recipient address
                    that is not compatible with the Crypto.org Chain NFT token standard will result
                    in the permanent loss of your asset.
                  </Content>
                </Layout>
              </div>
              <div className="item">
                <div className="label">NFT Name</div>
                <div>{`${formValues.denomId}`}</div>
              </div>
              <div className="item">
                <div className="label">NFT ID</div>
                <div>{`${formValues.tokenId}`}</div>
              </div>
            </>
          ) : (
            <>
              <div className="title">Transfer NFT</div>
              <div className="description">Fill in the information below to transfer your NFT.</div>
              <div className="item">
                <div className="nft-image">{renderPreview(nft)}</div>
              </div>
              <div className="item">
                <div className="label">Sending</div>
                <div className="address">
                  {nft?.tokenData.drop ? nft?.tokenData.drop : nft?.denomId}
                </div>
              </div>
              <Form
                {...layout}
                layout="vertical"
                form={form}
                name="control-ref"
                onFinish={showPasswordInput}
                requiredMark={false}
              >
                {/* <div className="sender">Sender Address</div> */}
                {/* <div className="sender">{currentSession.wallet.address}</div> */}
                <Form.Item
                  name="recipientAddress"
                  label="Recipient Address"
                  hasFeedback
                  validateFirst
                  rules={[
                    { required: true, message: 'Recipient address is required' },
                    customAddressValidator,
                  ]}
                >
                  <Input placeholder="Enter recipient address" />
                </Form.Item>
              </Form>
              <div className="item notice">
                <Layout>
                  <Sider width="20px">
                    <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                  </Sider>
                  <Content>
                    This NFT is on the Crypto.org Chain. Transferring the NFT to a recipient address
                    that is not compatible with the Crypto.org Chain NFT token standard will result
                    in the permanent loss of your asset.
                  </Content>
                </Layout>
              </div>
            </>
          )}
        </>
      </ModalPopup>
      <Footer />
      <PasswordFormModal
        description="Input the app password decrypt wallet"
        okButtonText="Decrypt wallet"
        onCancel={() => {
          setInputPasswordVisible(false);
          setIsNftTransferModalVisible(true);
        }}
        onSuccess={onWalletDecryptFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
          };
        }}
        successText="Wallet decrypted successfully !"
        title="Provide app password"
        visible={inputPasswordVisible}
        successButtonText="Continue"
        confirmPassword={false}
      />
      <SuccessModalPopup
        isModalVisible={isSuccessModalVisible}
        handleCancel={closeSuccessModal}
        handleOk={closeSuccessModal}
        title="Success!"
        button={null}
        footer={[
          <Button key="submit" type="primary" onClick={closeSuccessModal}>
            Ok
          </Button>,
        ]}
      >
        <>
          {broadcastResult?.code !== undefined &&
          broadcastResult?.code !== null &&
          broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
            <div className="description">
              The transaction timed out but it will be included in the subsequent blocks
            </div>
          ) : (
            <div className="description">Your NFT transaction was broadcasted successfully!</div>
          )}
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={closeErrorModal}
        handleOk={closeErrorModal}
        title="An error happened!"
        footer={[]}
      >
        <>
          <div className="description">
            The vote transaction failed. Please try again later.
            <br />
            {errorMessages
              .filter((item, idx) => {
                return errorMessages.indexOf(item) === idx;
              })
              .map((err, idx) => (
                <div key={idx}>- {err}</div>
              ))}
            {ledgerIsExpertMode ? (
              <div>Please ensure that your have enabled Expert mode on your ledger device.</div>
            ) : (
              ''
            )}
          </div>
        </>
      </ErrorModalPopup>
    </Layout>
  );
};

export default NftPage;
