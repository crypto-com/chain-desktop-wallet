import React, { useState, useEffect } from 'react';
import './nft.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Card, Tabs, List, Avatar, Radio, Table, Button } from 'antd';
import Icon, { MenuOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useRecoilValue } from 'recoil';
import ReactPlayer from 'react-player';
// import axios from 'axios';
import {
  // sessionState,
  nftListState,
  fetchingDBState,
  // walletAssetState
} from '../../recoil/atom';

import {
  NftModel,
  // ProposalModel,
  // VoteOption,
  // BroadCastResult,
} from '../../models/Transaction';
// import { walletService } from '../../service/WalletService';
// import { secretStoreService } from '../../storage/SecretStoreService';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
// import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
// import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
// import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
// import { LEDGER_WALLET_TYPE } from '../../service/LedgerService';
// import { DEFAULT_CLIENT_MEMO } from '../../config/StaticConfig';
// import { ellipsis } from '../../utils/utils';
import { middleEllipsis, isJson } from '../../utils/utils';
import IconPlayer from '../../svg/IconPlayer';
import nftThumbnail from '../../assets/nft-thumbnail.png';
// import nftThumbnail from '../../assets/nft1.jpg';
// import nftThumbnail from '../../assets/original.jpeg';

const { Header, Content, Footer, Sider } = Layout;
const { TabPane } = Tabs;
const { Meta } = Card;

const NftPage = () => {
  // const [form] = Form.useForm();
  // const [voteOption, setVoteOption] = useState<VoteOption>(VoteOption.VOTE_OPTION_ABSTAIN);
  // const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  // const [isModalVisible, setIsModalVisible] = useState(false);
  // const [confirmLoading, setConfirmLoading] = useState(false);
  // const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  // const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  // const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isNftModalVisible, setIsNftModalVisible] = useState(false);
  const [isNftTransferModalVisible, setIsNftTransferModalVisible] = useState(false);
  // const [decryptedPhrase, setDecryptedPhrase] = useState('');
  // const [errorMessages, setErrorMessages] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>('');

  const [nft, setNft] = useState<any>();

  // const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const nftList = useRecoilValue(nftListState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  // const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  // const currentSession = useRecoilValue(sessionState);
  // const userAsset = useRecoilValue(walletAssetState);

  const [processedNftList, setProcessedNftList] = useState<any[]>([]);
  const [nftView, setNftView] = useState('grid');

  // const handleCancelConfirmationModal = () => {
  //   setIsVisibleConfirmationModal(false);
  // };

  // const closeSuccessModal = () => {
  //   setIsSuccessModalVisible(false);
  //   setIsVisibleConfirmationModal(false);
  // };

  // const closeErrorModal = () => {
  //   setIsErrorModalVisible(false);
  // };

  // const showConfirmationModal = () => {
  //   setInputPasswordVisible(false);
  //   setIsVisibleConfirmationModal(true);
  // };

  // const showPasswordInput = () => {
  //   if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
  //     showConfirmationModal();
  //   } else {
  //     setInputPasswordVisible(true);
  //   }
  // };

  // const onWalletDecryptFinish = async (password: string) => {
  //   const phraseDecrypted = await secretStoreService.decryptPhrase(
  //     password,
  //     currentSession.wallet.identifier,
  //   );
  //   setDecryptedPhrase(phraseDecrypted);
  //   showConfirmationModal();
  // };

  // const onRadioChange = e => {
  //   setVoteOption(e.target.value);
  // };

  // const onVote = async () => {
  //   showPasswordInput();
  // };

  // const onConfirm = async () => {
  //   if (!nft) {
  //     return;
  //   }

  //   setConfirmLoading(true);
  //   try {
  //     // const proposalID =
  //     //   nft?.proposal_id !== null && nft?.proposal_id !== undefined
  //     //     ? nft?.proposal_id
  //     //     : '';
  //     // const sendResult = await walletService.sendVote({
  //     //   voteOption,
  //     //   proposalID,
  //     //   memo: DEFAULT_CLIENT_MEMO,
  //     //   decryptedPhrase,
  //     //   asset: userAsset,
  //     //   walletType: currentSession.wallet.walletType,
  //     // });

  //     // setBroadcastResult(sendResult);
  //     setIsVisibleConfirmationModal(false);
  //     setConfirmLoading(false);
  //     // setInputPasswordVisible(false);
  //     // setIsSuccessModalVisible(true);
  //   } catch (e) {
  //     // setErrorMessages(e.message.split(': '));
  //     setIsVisibleConfirmationModal(false);
  //     setConfirmLoading(false);
  //     // setInputPasswordVisible(false);
  //     // setIsErrorModalVisible(true);
  //     // eslint-disable-next-line no-console
  //     console.log('Error occurred while transfer', e);
  //   }
  //   setConfirmLoading(false);
  // };

  const nftViewOptions = [
    { label: <MenuOutlined />, value: 'list' },
    { label: <AppstoreOutlined />, value: 'grid' },
  ];

  const processNftList = (currentList: NftModel[] | undefined) => {
    if (currentList) {
      return currentList.map((item, idx) => {
        const denomSchema = isJson(item.denomSchema)
          ? JSON.parse(item.denomSchema)
          : item.denomSchema;
        const tokenData = isJson(item.tokenData) ? JSON.parse(item.tokenData) : item.tokenData;
        const nftModel = {
          ...item,
          key: `${idx}`,
          denomSchema,
          tokenData,
        };
        return nftModel;
      });
    }
    return [];
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
        An overview of your NFT Collection on Crypto.org Chain
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
                            <img
                              alt={item?.denomName}
                              src={
                                item?.isMintedByCDC && item?.tokenData.image
                                  ? item?.tokenData.image
                                  : nftThumbnail
                              }
                            />
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
                          title={item?.tokenData.drop ? item?.tokenData.drop : item?.denomName}
                          description={
                            <>
                              <Avatar
                                style={{
                                  background:
                                    'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                  verticalAlign: 'middle',
                                }}
                              />
                              {middleEllipsis(item?.tokenOwner, 6)}
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
        // confirmationLoading={confirmLoading}
        footer={[]}
        okText="Confirm"
        className="nft-modal"
      >
        <Layout className="nft-detail">
          <Content>
            <div className="nft-image">
              {nft?.isMintedByCDC && nft?.tokenData.mimeType === 'video/mp4' ? (
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
              ) : (
                <img
                  alt={nft?.denomName}
                  src={
                    nft?.isMintedByCDC && nft?.tokenData.image ? nft?.tokenData.image : nftThumbnail
                  }
                />
              )}
            </div>
          </Content>
          <Sider width="50%">
            <>
              <div className="title">
                {nft?.tokenData.drop ? nft?.tokenData.drop : nft?.denomName}
              </div>
              <div className="item">
                <Meta
                  // title={nft?.name}
                  description={
                    <>
                      <Avatar
                        style={{
                          background:
                            'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                          verticalAlign: 'middle',
                        }}
                      />
                      {nft?.tokenOwner}
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
                  onClick={() => setIsNftTransferModalVisible(true)}
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
        handleCancel={() => setIsNftTransferModalVisible(false)}
        handleOk={() => {}}
        footer={[
          <Button key="submit" type="primary">
            Confirm
          </Button>,
          <Button key="back" type="link" onClick={() => setIsNftTransferModalVisible(false)}>
            Cancel
          </Button>,
        ]}
        okText="Confirm"
        className="nft-transfer-modal"
      >
        <>
          <div className="title">Transfer NFT</div>
          <div className="description">Fill in the information below to transfer your NFT</div>
          <div className="item">
            <div className="nft-image">
              {nft?.isMintedByCDC && nft?.tokenData.mimeType === 'video/mp4' ? (
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
              ) : (
                <img
                  alt={nft?.denomName}
                  src={
                    nft?.isMintedByCDC && nft?.tokenData.image ? nft?.tokenData.image : nftThumbnail
                  }
                />
              )}
            </div>
          </div>
          <div className="item">
            <div className="label">Sending</div>
            <div className="address">{`${nft?.drop}`}</div>
          </div>
          {/* <div className="item">
            <div className="label">Vote to Proposal</div>
            <div className="address">{`#${nft?.proposal_id} ${nft?.content.title}`}</div>
          </div>
          <div className="item">
            <div className="label">Vote</div>
            <div>{processVoteTag(voteOption)}</div>
          </div> */}
        </>
      </ModalPopup>
      <Footer />
      {/* <PasswordFormModal
        description="Input the app password decrypt wallet"
        okButtonText="Decrypt wallet"
        onCancel={() => {
          setInputPasswordVisible(false);
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
      /> */}
      {/* <ModalPopup
        isModalVisible={isConfirmationModalVisible}
        handleCancel={handleCancelConfirmationModal}
        handleOk={() => { }}
        footer={[
          <Button key="submit" type="primary" loading={confirmLoading} onClick={onConfirm}>
            Confirm
          </Button>,
          <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
            Cancel
          </Button>,
        ]}
        okText="Confirm"
      >
        <>
          <div className="title">Confirm Vote Transaction</div>
          <div className="description">Please review the below information. </div>
          <div className="item">
            <div className="label">Sender Address</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">Vote to Proposal</div>
            <div className="address">{`#${nft?.proposal_id} ${nft?.content.title}`}</div>
          </div>
          <div className="item">
            <div className="label">Vote</div>
            <div>{processVoteTag(voteOption)}</div>
          </div>
        </>
      </ModalPopup> */}
      {/* <SuccessModalPopup
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
            <div className="description">Your vote was broadcasted successfully!</div>
          )}
        </>
      </SuccessModalPopup> */}
      {/* <ErrorModalPopup
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
          </div>
        </>
      </ErrorModalPopup> */}
    </Layout>
  );
};

export default NftPage;
