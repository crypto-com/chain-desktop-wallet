import React, { useState, useEffect, useRef } from 'react';
import './nft.less';
import 'antd/dist/antd.css';
import {
  Layout,
  Card,
  Tabs,
  List,
  Avatar,
  Radio,
  Table,
  Button,
  Form,
  Input,
  Upload,
  Image,
  Spin,
  message,
  notification,
} from 'antd';
import Big from 'big.js';
import Icon, {
  MenuOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useRecoilValue, useRecoilState } from 'recoil';
import ReactPlayer from 'react-player';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import axios from 'axios';

import {
  sessionState,
  nftListState,
  fetchingDBState,
  walletAssetState,
  ledgerIsExpertModeState,
} from '../../recoil/atom';
import { ellipsis, middleEllipsis, isJson, convertIpfsToHttp, sleep } from '../../utils/utils';
import { getUINormalScaleAmount } from '../../utils/NumberUtils';
import { NftModel, NftProcessedModel, BroadCastResult } from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  IPFS_MIDDLEWARE_SERVER_UPLOAD_ENDPOINT,
  FIXED_DEFAULT_FEE,
  NFT_IMAGE_DENOM_SCHEMA,
  NFT_VIDEO_DENOM_SCHEMA,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from '../../config/StaticConfig';

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
const { TextArea } = Input;

const isVideo = (type: string | undefined) => {
  return type?.indexOf('video') !== -1;
};

const supportedVideo = (mimeType: string | undefined) => {
  switch (mimeType) {
    case 'video/mp4':
      // case 'video/webm':
      // case 'video/ogg':
      // case 'audio/ogg':
      // case 'audio/mpeg':
      return true;
    default:
      return false;
  }
};

const multiplyFee = (fee: string, multiply: number) => {
  return Big(fee)
    .times(multiply)
    .toString();
};

const FormMintNft = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    fileList: '',
    tokenId: '',
    denomId: '',
    drop: '',
    description: '',
    senderAddress: '',
    recipientAddress: '',
    data: '',
    uri: '',
    amount: '',
    memo: '',
  });
  const currentSession = useRecoilValue(sessionState);
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nftList, setNftList] = useRecoilState(nftListState);

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isUploadButtonVisible, setIsUploadButtonVisible] = useState(true);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [isDenomIdOwner, setIsDenomIdOwner] = useState(false);
  const [isDenomIdIssued, setIsDenomIdIssued] = useState(false);

  const [ipfsMediaJsonUrl, setIpfsMediaJsonUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [fileType, setFileType] = useState('');

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);

  const analyticsService = new AnalyticsService(currentSession);

  const networkFee =
    currentSession.wallet.config.fee !== undefined &&
    currentSession.wallet.config.fee.networkFee !== undefined
      ? currentSession.wallet.config.fee.networkFee
      : FIXED_DEFAULT_FEE;

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    setIsVisibleConfirmationModal(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const fileUploadValidator = () => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validator(rule, value) {
      const reason = `Files Upload hasn't completed`;
      if (isUploadSuccess) {
        return Promise.resolve();
      }
      return Promise.reject(reason);
    },
  });

  const showConfirmationModal = async () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
    setFormValues({
      ...form.getFieldsValue(true),
      senderAddress: currentSession.wallet.address,
      recipientAddress: currentSession.wallet.address,
    });
    const denomData = await walletService.getDenomIdData(form.getFieldValue('denomId'));

    if (denomData) {
      // Denom ID registered
      setIsDenomIdIssued(true);
      if (denomData.denomCreator === currentSession.wallet.address) {
        setIsDenomIdOwner(true);
      } else {
        setIsDenomIdOwner(false);
      }
    } else {
      // Denom ID not registered yet
      setIsDenomIdIssued(false);
      setIsDenomIdOwner(true);
    }
  };

  const showPasswordInput = () => {
    if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      showConfirmationModal();
    } else {
      setInputPasswordVisible(true);
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

  const beforeUpload = file => {
    let error = false;
    const isVideoFile = isVideo(file.type);
    const isSupportedVideo = supportedVideo(file.type);
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    const isImageTooLarge = file.size > MAX_IMAGE_SIZE;
    const isVideoTooLarge = file.size > MAX_VIDEO_SIZE;
    if (isVideoFile && !isVideo(fileType)) {
      if (!isSupportedVideo) {
        message.error('You can only upload MP4 file!');
        error = true;
      }
      if (isVideoTooLarge) {
        message.error('Video must smaller than 20MB!');
        error = true;
      }
    } else {
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        error = true;
      }
      if (isImageTooLarge) {
        message.error('Image must smaller than 10MB!');
        error = true;
      }
    }

    if (error) {
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleChange = ({ fileList }) => {
    if (fileList.length === 0) {
      setIsUploadButtonVisible(true);
      setIsUploadSuccess(false);
      setFileType('');
    } else if (fileList.length === 1) {
      if (isVideo(fileList[0].type)) {
        setIsUploadButtonVisible(true);
      } else {
        setIsUploadButtonVisible(false);
      }
      setFileType(fileList[0].type);
    } else {
      setIsUploadButtonVisible(false);
    }
    setFiles(fileList);
  };

  const onMintNft = async () => {
    const { walletType } = currentSession.wallet;
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }
    const data = {
      name: formValues.drop,
      drop: formValues.drop,
      description: formValues.description,
      image: imageUrl,
      animation_url: isVideo(fileType) ? videoUrl : undefined,
      mimeType: fileType,
    };
    try {
      setConfirmLoading(true);

      if (!isDenomIdIssued) {
        const issueDenomResult = await walletService.broadcastNFTDenomIssueTx({
          denomId: formValues.denomId,
          name: formValues.denomId,
          sender: formValues.senderAddress,
          schema: isVideo(fileType)
            ? JSON.stringify(NFT_VIDEO_DENOM_SCHEMA)
            : JSON.stringify(NFT_IMAGE_DENOM_SCHEMA),
          memo,
          decryptedPhrase,
          asset: walletAsset,
          walletType,
        });

        analyticsService.logTransactionEvent(
          issueDenomResult.transactionHash as string,
          formValues.amount,
          AnalyticsTxType.NftTransaction,
          AnalyticsActions.NftIssue,
          AnalyticsCategory.Nft,
        );

        // eslint-disable-next-line no-console
        console.log('Denom Issue', issueDenomResult);

        // Wait a bit for denom mint sync
        await sleep(4_000);
      }

      const mintNftResult = await walletService.broadcastMintNFT({
        tokenId: formValues.tokenId,
        denomId: formValues.denomId,
        sender: formValues.senderAddress,
        recipient: formValues.recipientAddress,
        data: JSON.stringify(data),
        name: formValues.drop,
        uri: ipfsMediaJsonUrl,
        memo,
        decryptedPhrase,
        asset: walletAsset,
        walletType,
      });

      setBroadcastResult(mintNftResult);

      analyticsService.logTransactionEvent(
        mintNftResult.transactionHash as string,
        formValues.amount,
        AnalyticsTxType.NftTransaction,
        AnalyticsActions.NftMint,
        AnalyticsCategory.Nft,
      );

      setConfirmLoading(false);
      setIsVisibleConfirmationModal(false);
      setIsSuccessModalVisible(true);

      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);

      const latestLoadedNFTs = await walletService.retrieveNFTs(currentSession.wallet.identifier);
      setNftList(latestLoadedNFTs);

      form.resetFields();
      setIpfsMediaJsonUrl('');
      setImageUrl('');
      setVideoUrl('');
      setFiles([]);
      setFileType('');
      setIsUploadButtonVisible(true);
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(e.toString()));
      }

      setErrorMessages(e.message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>
        {isVideo(fileType) ? (
          <>
            Video Thumbnail
            <br />
            JPG, PNG
          </>
        ) : (
          <>
            Image: JPG, PNG <br />
            Video: MP4
          </>
        )}
      </div>
    </div>
  );

  const customRequest = async option => {
    const { onProgress, onError, onSuccess, action, file } = option;
    const url = action;
    const isVideoFile = isVideo(file.type);
    const isSupportedVideo = supportedVideo(file.type);
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    const formData = new FormData();
    // Uploaded Video
    if (files.length >= 2) {
      formData.append('videoFile', files[0].originFileObj);
    }

    if (isVideoFile && isSupportedVideo) {
      onSuccess();
      return;
      // eslint-disable-next-line no-else-return
    } else if (isJpgOrPng) {
      formData.append('imageFile', file);
    } else {
      setIsUploadSuccess(false);
      onError();
      return;
    }

    try {
      const response = await axios.post(url, formData, {
        onUploadProgress: e => {
          onProgress({ percent: (e.loaded / e.total) * 100 });
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 200) {
        const ipfsUrl = convertIpfsToHttp(response.data.ipfsUrl);
        setIpfsMediaJsonUrl(ipfsUrl);
        const media: any = await axios.get(ipfsUrl);
        setImageUrl(convertIpfsToHttp(media.data.image));
        if (media.data.animation_url) {
          setVideoUrl(convertIpfsToHttp(media.data.animation_url));
        }
        setIsUploadSuccess(true);
        onSuccess(response);
      }
    } catch (e) {
      setIsUploadSuccess(false);
      onError(e);
      notification.error({
        message: 'Upload failed',
        description: 'Please confirm your connection & try again later.',
        placement: 'topRight',
        duration: 5,
      });
    }
  };

  return (
    <>
      <Form
        {...layout}
        layout="vertical"
        form={form}
        name="control-ref"
        onFinish={showPasswordInput}
        requiredMark={false}
      >
        <Form.Item
          name="denomId"
          label="Denom Name"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Denom ID is required' },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: 'Denom ID can only be alphabetic & between 3 and 64 characters',
            },
          ]}
        >
          <Input maxLength={64} placeholder='e.g. "denomid123"' />
        </Form.Item>
        <Form.Item
          name="tokenId"
          label="Token ID"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Token ID is required' },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: 'Token ID can only be alphabetic & between 3 and 64 characters',
            },
          ]}
        >
          <Input maxLength={64} placeholder='e.g. "edition123"' />
        </Form.Item>
        <Form.Item
          name="drop"
          label="Drop Name"
          hasFeedback
          validateFirst
          rules={[{ required: true, message: 'Drop Name is required' }]}
        >
          <Input maxLength={64} placeholder='e.g. "Crypto.org Genesis"' />
        </Form.Item>
        <Form.Item name="description" label="Drop Description" hasFeedback>
          <TextArea
            showCount
            maxLength={1000}
            placeholder='e.g. "Commemorating the launch of the Crypto.org Chain and the Crypto.com NFT Platform..."'
          />
        </Form.Item>
        {/* <Switch /> */}
        <Form.Item
          name="files"
          label="Upload Files"
          // hasFeedback
          rules={[{ required: true, message: 'Upload Files is required' }, fileUploadValidator]}
        >
          <div>
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={{
                showPreviewIcon: false,
              }}
              fileList={files}
              customRequest={customRequest}
              action={IPFS_MIDDLEWARE_SERVER_UPLOAD_ENDPOINT}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              accept="audio/*,video/*,image/*"
              onRemove={file => {
                if (isVideo(file.type)) {
                  setVideoUrl('');
                } else {
                  setImageUrl('');
                }
              }}
            >
              {isUploadButtonVisible ? uploadButton : null}
            </Upload>
          </div>
        </Form.Item>
        <ModalPopup
          isModalVisible={isConfirmationModalVisible}
          handleCancel={() => {
            if (!confirmLoading) {
              setIsVisibleConfirmationModal(false);
            }
          }}
          handleOk={() => {}}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={onMintNft}
              loading={confirmLoading}
              disabled={isDenomIdIssued && !isDenomIdOwner}
            >
              Confirm
            </Button>,
            <Button
              key="back"
              type="link"
              onClick={() => {
                if (!confirmLoading) {
                  setIsVisibleConfirmationModal(false);
                }
              }}
            >
              Cancel
            </Button>,
          ]}
          button={
            <Button htmlType="submit" type="primary" onClick={() => {}}>
              Review
            </Button>
          }
          okText="Confirm"
          className="nft-mint-modal"
        >
          <>
            <>
              <div className="title">Confirm Mint NFT</div>
              <div className="description">Please review the information below.</div>
              <div className="item">
                <div className="nft-image">
                  <Image
                    // width={200}
                    style={{ width: '100%', height: '100%' }}
                    src={imageUrl}
                    // src={`https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png?${random}`}
                    alt="avatar"
                    placeholder={<Spin spinning indicator={<LoadingOutlined />} />}
                  />
                </div>
              </div>
              {isVideo(fileType) ? (
                <div className="item">
                  <div className="nft-video">
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
                      playing={isConfirmationModalVisible}
                    />
                  </div>
                </div>
              ) : (
                ''
              )}
              <div className="item">
                <div className="label">Denom Name</div>
                <div>{`${formValues.denomId}`}</div>
              </div>
              {isDenomIdIssued && !isDenomIdOwner ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>
                      The Denom Name is registered by another address. Please choose another one.
                    </Content>
                  </Layout>
                </div>
              ) : (
                ''
              )}
              <div className="item">
                <div className="label">Token ID</div>
                <div>{`${formValues.tokenId}`}</div>
              </div>
              <div className="item">
                <div className="label">Drop Name</div>
                <div>{`${formValues.drop}`}</div>
              </div>
              <div className="item">
                <div className="label">Drop Description</div>
                <div>{`${ellipsis(formValues.description, 1000)}`}</div>
              </div>
              <div className="item">
                <div className="label">Transaction Fee</div>
                <div>
                  {getUINormalScaleAmount(
                    multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1),
                    walletAsset.decimals,
                  )}{' '}
                  {walletAsset.symbol}
                </div>
              </div>
              {multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1) > walletAsset.balance ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>
                      Insufficient balance. Please ensure you have at least{' '}
                      {getUINormalScaleAmount(
                        multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1),
                        walletAsset.decimals,
                      )}{' '}
                      {walletAsset.symbol} for network fee.
                    </Content>
                  </Layout>
                </div>
              ) : (
                ''
              )}
              <div className="item notice">
                <Layout>
                  <Sider width="20px">
                    <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                  </Sider>
                  <Content>This NFT will be minted on the Crypto.org Chain.</Content>
                </Layout>
              </div>
            </>
          </>
        </ModalPopup>
      </Form>
      <PasswordFormModal
        description="Input the app password decrypt wallet"
        okButtonText="Decrypt wallet"
        onCancel={() => {
          setInputPasswordVisible(false);
          // setIsNftTransferModalVisible(true);
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
            <div className="description">Your NFT was minted successfully!</div>
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
            The NFT transaction failed. Please try again later.
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
    </>
  );
};

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

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isNftModalVisible, setIsNftModalVisible] = useState(false);
  const [isNftTransferModalVisible, setIsNftTransferModalVisible] = useState(false);
  const [isNftTransferConfirmVisible, setIsNftTransferConfirmVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [nft, setNft] = useState<NftProcessedModel | undefined>();
  const [processedNftList, setProcessedNftList] = useState<NftProcessedModel[]>([]);
  const [nftView, setNftView] = useState('grid');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>('');

  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');

  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(currentSession);

  const nftViewOptions = [
    { label: <MenuOutlined />, value: 'list' },
    { label: <AppstoreOutlined />, value: 'grid' },
  ];

  const networkFee =
    currentSession.wallet.config.fee !== undefined &&
    currentSession.wallet.config.fee.networkFee !== undefined
      ? currentSession.wallet.config.fee.networkFee
      : FIXED_DEFAULT_FEE;

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

  const renderNftTitle = (_nft: NftProcessedModel | undefined, length: number = 0) => {
    if (_nft?.tokenData && _nft?.tokenData.name) {
      return length > 0 ? ellipsis(_nft?.tokenData.name, length) : _nft?.tokenData.name;
    }
    if (_nft?.tokenData && _nft?.tokenData.drop) {
      return length > 0 ? ellipsis(_nft?.tokenData.drop, length) : _nft?.tokenData.drop;
    }
    if (_nft) {
      return length > 0
        ? ellipsis(`${_nft?.denomId} - #${_nft?.tokenId}`, length)
        : `${_nft?.denomId} - #${_nft?.tokenId}`;
    }
    return 'n.a.';
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
        sendResult.transactionHash as string,
        formValues.amount,
        AnalyticsTxType.NftTransaction,
        AnalyticsActions.NftTransfer,
        AnalyticsCategory.Nft,
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
    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('NFT');
    }
  }, [fetchingDB, nftList]);

  const NftColumns = [
    {
      title: 'Drop Name',
      key: 'name',
      render: record => {
        const { drop, name } = record.tokenData;
        return name || drop ? name || drop : 'n.a.';
      },
    },
    {
      title: 'Denom Name',
      key: 'denomId',
      render: record => {
        return record.denomId;
      },
    },
    {
      title: 'Token ID',
      key: 'tokenId',
      render: record => {
        return record.tokenId;
      },
    },
    {
      title: 'Creator',
      key: 'creator',
      render: record => {
        return (
          <a
            data-original={record.tokenMinter}
            target="_blank"
            rel="noreferrer"
            href={`${currentSession.wallet.config.explorerUrl}/account/${record.tokenMinter}`}
          >
            {middleEllipsis(record.tokenMinter, 8)}
          </a>
        );
      },
    },
    {
      title: 'Action',
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
                            {supportedVideo(item?.tokenData.mimeType) ? (
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
                          title={renderNftTitle(item, 20)}
                          description={
                            <>
                              <Avatar
                                style={{
                                  background:
                                    'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                  verticalAlign: 'middle',
                                }}
                              />
                              {middleEllipsis(item?.tokenMinter, 6)}{' '}
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
            <>
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
                      <div className="title">{renderNftTitle(nft)}</div>
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
                              <a
                                data-original={nft?.tokenMinter}
                                target="_blank"
                                rel="noreferrer"
                                href={`${currentSession.wallet.config.explorerUrl}/account/${nft?.tokenMinter}`}
                              >
                                {nft?.tokenMinter}
                              </a>
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
                          <div>Denom Name</div>
                          <div>{nft?.denomName}</div>
                        </div>
                        <div className="table-row">
                          <div>Token ID</div>
                          <div>{nft?.tokenId}</div>
                        </div>
                        {nft?.tokenData.mimeType ? (
                          <div className="table-row">
                            <div>Content URL</div>
                            <a
                              data-original={nft?.denomName}
                              target="_blank"
                              rel="noreferrer"
                              href={
                                supportedVideo(nft?.tokenData.mimeType)
                                  ? nft?.tokenData.animation_url
                                  : nft?.tokenData.image
                              }
                            >
                              {supportedVideo(nft?.tokenData.mimeType)
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
                      disabled={networkFee > walletAsset.balance}
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
                            This NFT is on the Crypto.org Chain. Transferring the NFT to a recipient
                            address that is not compatible with the Crypto.org Chain NFT token
                            standard will result in the permanent loss of your asset.
                          </Content>
                        </Layout>
                      </div>
                      <div className="item">
                        <div className="label">Denom Name</div>
                        <div>{`${formValues.denomId}`}</div>
                      </div>
                      <div className="item">
                        <div className="label">Token ID</div>
                        <div>{`${formValues.tokenId}`}</div>
                      </div>
                      <div className="item">
                        <div className="label">Transaction Fee</div>
                        <div>
                          {getUINormalScaleAmount(networkFee, walletAsset.decimals)}{' '}
                          {walletAsset.symbol}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="title">Transfer NFT</div>
                      <div className="description">
                        Fill in the information below to transfer your NFT.
                      </div>
                      <div className="item">
                        <div className="nft-image">{renderPreview(nft)}</div>
                      </div>
                      <div className="item">
                        <div className="label">Sending</div>
                        <div className="address">{renderNftTitle(nft)}</div>
                      </div>
                      <Form
                        {...layout}
                        layout="vertical"
                        form={form}
                        name="control-ref"
                        onFinish={showPasswordInput}
                        requiredMark={false}
                      >
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
                      {networkFee > walletAsset.balance ? (
                        <div className="item notice">
                          <Layout>
                            <Sider width="20px">
                              <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                            </Sider>
                            <Content>
                              Insufficient balance. Please ensure you have at least{' '}
                              {getUINormalScaleAmount(networkFee, walletAsset.decimals)}{' '}
                              {walletAsset.symbol} for network fee.
                            </Content>
                          </Layout>
                        </div>
                      ) : (
                        ''
                      )}
                      <div className="item notice">
                        <Layout>
                          <Sider width="20px">
                            <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                          </Sider>
                          <Content>
                            This NFT is on the Crypto.org Chain. Transferring the NFT to a recipient
                            address that is not compatible with the Crypto.org Chain NFT token
                            standard will result in the permanent loss of your asset.
                          </Content>
                        </Layout>
                      </div>
                    </>
                  )}
                </>
              </ModalPopup>
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
                    <div className="description">
                      Your NFT transaction was broadcasted successfully!
                    </div>
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
                    The NFT transaction failed. Please try again later.
                    <br />
                    {errorMessages
                      .filter((item, idx) => {
                        return errorMessages.indexOf(item) === idx;
                      })
                      .map((err, idx) => (
                        <div key={idx}>- {err}</div>
                      ))}
                    {ledgerIsExpertMode ? (
                      <div>
                        Please ensure that your have enabled Expert mode on your ledger device.
                      </div>
                    ) : (
                      ''
                    )}
                  </div>
                </>
              </ErrorModalPopup>
            </>
          </TabPane>
          <TabPane tab="Mint NFT" key="2">
            <div className="site-layout-background nft-content">
              <div className="container">
                <div className="description">
                  Mint your NFT with Image or Video on Crypto.org chain.
                </div>
                <FormMintNft />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Content>

      <Footer />
    </Layout>
  );
};

export default NftPage;
