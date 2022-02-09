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
  Tag,
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
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import ReactPlayer from 'react-player';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import axios from 'axios';
import { Promise } from 'bluebird';
import { useTranslation } from 'react-i18next';

import {
  sessionState,
  nftListState,
  fetchingDBState,
  walletAssetState,
  ledgerIsExpertModeState,
} from '../../recoil/atom';
import {
  ellipsis,
  middleEllipsis,
  isJson,
  convertIpfsToHttp,
  sleep,
  useWindowSize,
} from '../../utils/utils';
import { getUINormalScaleAmount } from '../../utils/NumberUtils';
import {
  NftModel,
  NftProcessedModel,
  TransactionStatus,
  NftAccountTransactionData,
  NftTransactionType,
  BroadCastResult,
} from '../../models/Transaction';
import { renderExplorerUrl } from '../../models/Explorer';
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
import ReceiveDetail from '../assets/components/ReceiveDetail';
import { croNftApi } from '../../service/rpc/NftApi';
import { ExternalNftMetadataResponse } from '../../service/rpc/models/nftApi.models';
import { useLedgerStatus } from '../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../components/LedgerNotification/LedgerNotification';

const { Header, Content, Footer, Sider } = Layout;
const { TabPane } = Tabs;
const { Meta } = Card;
const layout = {};
const { TextArea } = Input;

interface NftTransferTabularData {
  key: string;
  transactionHash: string;
  messageType: NftTransactionType;
  denomId: string;
  tokenId: string;
  recipientAddress: string;
  time: string;
  status: TransactionStatus;
}

const convertNftTransfers = (allTransfers: NftAccountTransactionData[]) => {
  const getStatus = (transfer: NftAccountTransactionData) => {
    if (transfer.success) {
      return TransactionStatus.SUCCESS;
    }
    return TransactionStatus.FAILED;
  };
  const getType = (transfer: NftAccountTransactionData) => {
    if (transfer.messageType === NftTransactionType.ISSUE_DENOM) {
      return NftTransactionType.ISSUE_DENOM;
      // eslint-disable-next-line no-else-return
    } else if (transfer.messageType === NftTransactionType.MINT_NFT) {
      return NftTransactionType.MINT_NFT;
    } else if (transfer.messageType === NftTransactionType.EDIT_NFT) {
      return NftTransactionType.EDIT_NFT;
    } else if (transfer.messageType === NftTransactionType.BURN_NFT) {
      return NftTransactionType.BURN_NFT;
    }
    return NftTransactionType.TRANSFER_NFT;
  };

  return allTransfers.map((transfer, idx) => {
    const data: NftTransferTabularData = {
      key: `${idx}-${transfer.transactionHash}-${transfer.data.recipient}-${transfer.data.denomId}-${transfer.data.tokenId}`,
      transactionHash: transfer.transactionHash,
      messageType: getType(transfer),
      denomId: transfer.data.denomId,
      tokenId: transfer.data.tokenId,
      recipientAddress: transfer.data.recipient,
      time: new Date(transfer.blockTime).toLocaleString(),
      status: getStatus(transfer),
    };
    return data;
  });
};

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
  const setNftList = useSetRecoilState(nftListState);

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isUploadButtonVisible, setIsUploadButtonVisible] = useState(true);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [isBeforeUpload, setIsBeforeUpload] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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
  const { isLedgerConnected } = useLedgerStatus({ asset: walletAsset });

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

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
      if (files.length === 0) {
        return Promise.reject(new Error(t('nft.fileUploadValidator.error1')));
      }
      if (
        (isUploadSuccess && !isVideo(fileType) && files.length === 1) ||
        (isUploadSuccess && isVideo(fileType) && files.length === 2)
      ) {
        return Promise.resolve();
      }
      // Hide the error before uploading anything
      if (isBeforeUpload) {
        return Promise.reject();
      }
      // Hide the error when uploading or upload video in progress
      if (isUploading || (files.length === 1 && isVideo(fileType))) {
        return Promise.reject();
      }
      return Promise.reject(new Error(t('nft.fileUploadValidator.error2')));
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
      if (!isLedgerConnected) {
        ledgerNotification(currentSession.wallet, walletAsset!);
      }
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
        message.error(`${t('nft.beforeUpload.error1')} MP4 ${t('nft.media.video')}`);
        error = true;
      }
      if (isVideoTooLarge) {
        message.error(`${t('nft.beforeUpload.error2')} 20MB`);
        error = true;
      }
    } else {
      if (!isJpgOrPng) {
        message.error(`${t('nft.beforeUpload.error1')} JPG/PNG ${t('nft.media.image')}`);
        error = true;
      }
      if (isImageTooLarge) {
        message.error(`${t('nft.beforeUpload.error3')} 10MB`);
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
    setIsBeforeUpload(false);
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
            {t('nft.media.thumbnail')}
            <br />
            JPG, PNG
          </>
        ) : (
          <>
            {t('nft.media.image')}: JPG, PNG <br />
            {t('nft.media.video')}: MP4
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

    setIsUploading(true);
    // Uploaded Video
    if (files.length >= 2) {
      formData.append('videoFile', files[0].originFileObj);
    }

    if (isVideoFile && isSupportedVideo) {
      setIsUploading(false);
      onSuccess();
      return;
      // eslint-disable-next-line no-else-return
    } else if (isJpgOrPng) {
      formData.append('imageFile', file);
    } else {
      setIsUploading(false);
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
        setIsUploading(false);
        onSuccess(response);
      }
    } catch (e) {
      setIsUploadSuccess(false);
      setIsUploading(false);
      onError(e);
      notification.error({
        message: t('nft.notification.uploadFailed.message'),
        description: t('nft.notification.uploadFailed.description'),
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
          label={t('nft.formMintNft.denomId.label')}
          hasFeedback
          validateFirst
          rules={[
            {
              required: true,
              message: `${t('nft.formMintNft.denomId.label')} ${t('general.required')}`,
            },
            {
              min: 3,
              max: 64,
              message: `${t('nft.formMintNft.denomId.error1')} 3 ${t(
                'nft.formMintNft.denomId.error2',
              )} 64 ${t('nft.formMintNft.denomId.error3')}`,
            },
            {
              pattern: /^[a-z]/,
              message: `${t('nft.formMintNft.denomId.error4')}`,
            },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: `${t('nft.formMintNft.denomId.error5')}`,
            },
          ]}
        >
          <Input
            maxLength={64}
            placeholder={`${t('nft.formMintNft.denomId.placeholder')} "denomid123"`}
          />
        </Form.Item>
        <Form.Item
          name="tokenId"
          label={t('nft.formMintNft.tokenId.label')}
          hasFeedback
          validateFirst
          rules={[
            {
              required: true,
              message: `${t('nft.formMintNft.tokenId.label')} ${t('general.required')}`,
            },
            {
              min: 3,
              max: 64,
              message: `${t('nft.formMintNft.tokenId.error1')} 3 ${t(
                'nft.formMintNft.tokenId.error2',
              )} 64 ${t('nft.formMintNft.tokenId.error3')}`,
            },
            {
              pattern: /^[a-z]/,
              message: `${t('nft.formMintNft.tokenId.error4')}`,
            },
            {
              pattern: /(^[a-z](([a-z0-9]){2,63})$)/,
              message: `${t('nft.formMintNft.tokenId.error5')}`,
            },
          ]}
        >
          <Input
            maxLength={64}
            placeholder={`${t('nft.formMintNft.tokenId.placeholder')} "edition123"`}
          />
        </Form.Item>
        <Form.Item
          name="drop"
          label={t('nft.formMintNft.drop.label')}
          hasFeedback
          validateFirst
          rules={[
            {
              required: true,
              message: `${t('nft.formMintNft.drop.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input
            maxLength={64}
            placeholder={`${t('nft.formMintNft.drop.placeholder')} "Crypto.org Genesis"`}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={`${t('nft.formMintNft.description.label')}`}
          hasFeedback
        >
          <TextArea
            showCount
            maxLength={1000}
            placeholder={`${t(
              'nft.formMintNft.drop.placeholder',
            )} "Commemorating the launch of the Crypto.org Chain and the Crypto.com NFT Platform..."`}
          />
        </Form.Item>
        <Form.Item
          name="files"
          label={t('nft.formMintNft.files.label')}
          validateFirst
          // hasFeedback
          rules={[fileUploadValidator]}
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
                setIsBeforeUpload(true);
                setIsUploadSuccess(false);
              }}
            >
              {isUploadButtonVisible ? uploadButton : null}
            </Upload>
            {isUploading ? (
              <>
                <Spin
                  spinning
                  indicator={<LoadingOutlined />}
                  style={{ left: 'auto', marginRight: '5px' }}
                />{' '}
                {t('nft.formMintNft.files.description1')}
              </>
            ) : (
              ''
            )}
            {isVideo(fileType) && files.length === 1 ? (
              <>
                <ExclamationCircleOutlined style={{ color: '#1199fa', marginRight: '5px' }} />{' '}
                {t('nft.formMintNft.files.description2')}
              </>
            ) : (
              ''
            )}
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
              disabled={
                (isDenomIdIssued && !isDenomIdOwner) ||
                new Big(multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1)).gt(
                  walletAsset.balance,
                ) ||
                (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE)
              }
            >
              {t('general.confirm')}
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
              {t('general.cancel')}
            </Button>,
          ]}
          button={
            <Button htmlType="submit" type="primary" onClick={() => {}}>
              {t('general.review')}
            </Button>
          }
          okText={t('general.confirm')}
          className="nft-mint-modal"
        >
          <>
            <>
              <div className="title">{t('nft.modal1.title')}</div>
              <div className="description">{t('nft.modal1.description')}</div>
              <div className="item">
                <div className="nft-image">
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    src={imageUrl}
                    alt="avatar"
                    placeholder={<Spin spinning indicator={<LoadingOutlined />} />}
                    onError={e => {
                      (e.target as HTMLImageElement).src = nftThumbnail;
                    }}
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
                <div className="label">{t('nft.modal1.label1')}</div>
                <div>{`${formValues.denomId}`}</div>
              </div>
              {isDenomIdIssued && !isDenomIdOwner ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>{t('nft.modal1.notice1')}</Content>
                  </Layout>
                </div>
              ) : (
                ''
              )}
              <div className="item">
                <div className="label">{t('nft.modal1.label2')}</div>
                <div>{`${formValues.tokenId}`}</div>
              </div>
              <div className="item">
                <div className="label">{t('nft.modal1.label3')}</div>
                <div>{`${formValues.drop}`}</div>
              </div>
              {formValues.description ? (
                <div className="item">
                  <div className="label">{t('nft.modal1.label4')}</div>
                  <div>{`${formValues.description}`}</div>
                </div>
              ) : (
                <></>
              )}
              <div className="item">
                <div className="label">{t('nft.modal1.label5')}</div>
                <div>
                  {getUINormalScaleAmount(
                    multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1),
                    walletAsset.decimals,
                  )}{' '}
                  {walletAsset.symbol}
                </div>
              </div>
              {new Big(multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1)).gt(
                walletAsset.balance,
              ) ? (
                <div className="item notice">
                  <Layout>
                    <Sider width="20px">
                      <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                    </Sider>
                    <Content>
                      {`${t('nft.modal1.notice2')} ${getUINormalScaleAmount(
                        multiplyFee(networkFee, !isDenomIdIssued ? 2 : 1),
                        walletAsset.decimals,
                      )} ${walletAsset.symbol} ${t('nft.modal1.notice3')}`}
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
                  <Content>{t('nft.modal1.notice4')}</Content>
                </Layout>
              </div>
            </>
          </>
        </ModalPopup>
      </Form>
      <PasswordFormModal
        description={t('general.passwordFormModal.description')}
        okButtonText={t('general.passwordFormModal.okButton')}
        onCancel={() => {
          setInputPasswordVisible(false);
          // setIsNftTransferModalVisible(true);
        }}
        onSuccess={onWalletDecryptFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? t('general.passwordFormModal.error') : '',
          };
        }}
        successText={t('general.passwordFormModal.success')}
        title={t('general.passwordFormModal.title')}
        visible={inputPasswordVisible}
        successButtonText={t('general.continue')}
        confirmPassword={false}
      />
      <SuccessModalPopup
        isModalVisible={isSuccessModalVisible}
        handleCancel={closeSuccessModal}
        handleOk={closeSuccessModal}
        title={t('general.successModalPopup.title')}
        button={null}
        footer={[
          <Button key="submit" type="primary" onClick={closeSuccessModal}>
            {t('general.ok')}
          </Button>,
        ]}
      >
        <>
          {broadcastResult?.code !== undefined &&
          broadcastResult?.code !== null &&
          broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
            <div className="description">{t('general.successModalPopup.timeout.description')}</div>
          ) : (
            <div className="description">{t('general.successModalPopup.nftMint.description')}</div>
          )}
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={closeErrorModal}
        handleOk={closeErrorModal}
        title={t('general.errorModalPopup.title')}
        footer={[]}
      >
        <>
          <div className="description">
            {t('general.errorModalPopup.nftMint.description')}
            <br />
            {errorMessages
              .filter((item, idx) => {
                return errorMessages.indexOf(item) === idx;
              })
              .map((err, idx) => (
                <div key={idx}>- {err}</div>
              ))}
            {ledgerIsExpertMode ? <div>{t('general.errorModalPopup.ledgerExportMode')}</div> : ''}
          </div>
        </>
      </ErrorModalPopup>
    </>
  );
};

const ReceiveTab = () => {
  const currentSession = useRecoilValue(sessionState);
  const walletAsset = useRecoilValue(walletAssetState);

  return <ReceiveDetail currentAsset={walletAsset} session={currentSession} isNft />;
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
  const [nftTransfers, setNftTransfers] = useState<NftTransferTabularData[]>([]);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>('');

  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const { isLedgerConnected } = useLedgerStatus({ asset: walletAsset });

  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const nftViewOptions = [
    { label: <MenuOutlined />, value: 'list' },
    { label: <AppstoreOutlined />, value: 'grid' },
  ];

  const networkFee =
    currentSession.wallet.config.fee !== undefined &&
    currentSession.wallet.config.fee.networkFee !== undefined
      ? currentSession.wallet.config.fee.networkFee
      : FIXED_DEFAULT_FEE;

  const size = useWindowSize();

  const handlePageSize = () => {
    if (size.width > 1461) {
      return 10;
    }
    if (size.width > 1096) {
      return 8;
    }
    return 6;
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    setIsNftModalVisible(false);
    setIsNftTransferConfirmVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const processNftList = async (currentList: NftModel[] | undefined) => {
    if (currentList) {
      return await Promise.map(currentList, async item => {
        const denomSchema = isJson(item.denomSchema)
          ? JSON.parse(item.denomSchema)
          : item.denomSchema;
        const tokenData = isJson(item.tokenData)
          ? await extractTokenMetadata(item.tokenData, item.denomId)
          : item.tokenData;
        const nftModel = {
          ...item,
          denomSchema,
          tokenData,
        };
        return nftModel;
      });
    }
    return [];
  };

  async function extractTokenMetadata(tokenDataString: string, denomId: string) {
    const parsedTokenData = JSON.parse(tokenDataString);

    // ETH Wrapped or External issued NFT
    if (parsedTokenData.isExternal) {
      let externalMetadata = await croNftApi.getExternalNftMetadataByIdentifier(denomId);

      // On errors
      if (Array.isArray(externalMetadata) && !externalMetadata.length) {
        // eslint-disable-next-line no-console
        console.log(`[extractTokenMetadata], Unable to extract External token metadata.`);
        return parsedTokenData;
      }

      // Type casting for leveraging type support
      externalMetadata = externalMetadata as ExternalNftMetadataResponse;

      // On external metadata being `non-translatable`
      if (!externalMetadata.data.translatedNft.translatable) {
        // eslint-disable-next-line no-console
        console.log(`[extractTokenMetadata], External metadata is untranslatable.`);
        return parsedTokenData;
      }

      // Transform `translatable` external nft metadata
      if (
        externalMetadata.data.translatedNft.translatable &&
        externalMetadata.data.translatedNft.metadata
      ) {
        const { metadata } = externalMetadata.data.translatedNft;
        return {
          description: metadata?.description || '',
          drop: metadata?.dropId || null,
          image: metadata?.image || undefined,
          mimeType: metadata?.mimeType || '',
          animationUrl: metadata?.animationUrl || '',
          animationMimeType: metadata?.animationMimeType || '',
          name: metadata?.name || '',
          collectionId: metadata?.collectionId || '',
          attributes: metadata?.attributes || [],
        };
      }
    }

    // Crypto.org chain NFT Issued NFT
    return parsedTokenData;
  }

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    walletAsset,
    AddressType.USER,
  );

  const renderPreview = (_nft: NftProcessedModel | undefined, showThumbnail: boolean = true) => {
    if (
      !showThumbnail &&
      (supportedVideo(_nft?.tokenData.mimeType) ||
        supportedVideo(_nft?.tokenData.animationMimeType))
    ) {
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

  const renderNftTitle = (_nft: NftProcessedModel | undefined, length: number = 999) => {
    if (_nft?.tokenData && _nft?.tokenData.name) {
      return ellipsis(_nft?.tokenData.name, length);
    }
    if (_nft?.tokenData && _nft?.tokenData.drop) {
      return ellipsis(_nft?.tokenData.drop, length);
    }
    if (_nft) {
      return ellipsis(`${_nft?.denomId} - #${_nft?.tokenId}`, length);
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
      if (!isLedgerConnected) {
        ledgerNotification(currentSession.wallet, walletAsset!);
      }
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
      const processedNFTsLists = await processNftList(latestLoadedNFTs);
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
      const currentNftList = await processNftList(nftList);
      setProcessedNftList(currentNftList);
    };
    const fetchNftTransfers = async () => {
      const allNftTransfer: NftAccountTransactionData[] = await walletService.getAllNFTAccountTxs(
        currentSession,
      );
      const nftTransferTabularData = convertNftTransfers(allNftTransfer);
      setNftTransfers(nftTransferTabularData);
    };
    fetchNftList();
    fetchNftTransfers();

    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('NFT');
    }
  }, [fetchingDB, nftList]);

  const NftColumns = [
    {
      title: t('nft.nftCollection.table1.name'),
      key: 'name',
      render: record => {
        const { drop, name } = record.tokenData;
        return name || drop ? name || drop : 'n.a.';
      },
    },
    {
      title: t('nft.nftCollection.table1.denomId'),
      key: 'denomId',
      render: record => {
        return record.denomId;
      },
    },
    {
      title: t('nft.nftCollection.table1.tokenId'),
      key: 'tokenId',
      render: record => {
        return record.tokenId;
      },
    },
    {
      title: t('nft.nftCollection.table1.creator'),
      key: 'creator',
      render: record => {
        return (
          <a
            data-original={record.tokenMinter}
            target="_blank"
            rel="noreferrer"
            href={`${renderExplorerUrl(currentSession.wallet.config, 'address')}/${
              record.tokenMinter
            }`}
          >
            {middleEllipsis(record.tokenMinter, 8)}
          </a>
        );
      },
    },
    {
      title: t('nft.nftCollection.table1.viewAction'),
      key: 'viewAction',
      render: record => {
        return (
          <a
            onClick={() => {
              setNft(record);
              setVideoUrl(record?.tokenData.animation_url || record?.tokenData.animationUrl);
              setIsVideoPlaying(true);
              setIsNftModalVisible(true);
            }}
          >
            {t('nft.nftCollection.table1.action1')}
          </a>
        );
      },
    },
  ];

  const NftTransactionColumns = [
    {
      title: t('home.transactions.table3.transactionHash'),
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(currentSession.wallet.config, 'tx')}/${text}`}
        >
          {middleEllipsis(text, 6)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table3.messageType'),
      dataIndex: 'messageType',
      key: 'messageType',
      render: (text, record: NftTransferTabularData) => {
        let statusColor;
        if (!record.status) {
          statusColor = 'error';
        } else if (record.messageType === NftTransactionType.MINT_NFT) {
          statusColor = 'success';
        } else if (record.messageType === NftTransactionType.TRANSFER_NFT) {
          statusColor =
            record.recipientAddress === currentSession.wallet.address ? 'processing' : 'error';
        } else {
          statusColor = 'default';
        }

        if (record.status) {
          if (record.messageType === NftTransactionType.MINT_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Minted NFT
              </Tag>
            );
            // eslint-disable-next-line no-else-return
          } else if (record.messageType === NftTransactionType.TRANSFER_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                {record.recipientAddress === currentSession.wallet.address
                  ? 'Received NFT'
                  : 'Sent NFT'}
              </Tag>
            );
          } else if (record.messageType === NftTransactionType.ISSUE_DENOM) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Issued Denom
              </Tag>
            );
          }
          return (
            <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
              {record.messageType}
            </Tag>
          );
          // eslint-disable-next-line no-else-return
        } else {
          if (record.messageType === NftTransactionType.MINT_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Failed Mint
              </Tag>
            );
            // eslint-disable-next-line no-else-return
          } else if (record.messageType === NftTransactionType.TRANSFER_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Failed Transfer
              </Tag>
            );
          } else if (record.messageType === NftTransactionType.ISSUE_DENOM) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Failed Issue
              </Tag>
            );
          }
          return (
            <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
              Failed {record.messageType}
            </Tag>
          );
        }
      },
    },
    {
      title: t('home.transactions.table3.denomId'),
      dataIndex: 'denomId',
      key: 'denomId',
      render: text => <div data-original={text}>{text ? ellipsis(text, 12) : 'n.a.'}</div>,
    },
    {
      title: t('home.transactions.table3.tokenId'),
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: text => <div data-original={text}>{text ? ellipsis(text, 12) : 'n.a.'}</div>,
    },
    {
      title: t('home.transactions.table3.recipientAddress'),
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      render: text => {
        return text ? (
          <a
            data-original={text}
            target="_blank"
            rel="noreferrer"
            href={`${renderExplorerUrl(currentSession.wallet.config, 'address')}/${text}`}
          >
            {middleEllipsis(text, 12)}
          </a>
        ) : (
          <div data-original={text}>n.a.</div>
        );
      },
    },
    {
      title: t('home.transactions.table3.time'),
      dataIndex: 'time',
      key: 'time',
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('nft.title')}</Header>
      <div className="header-description">{t('nft.description')}</div>
      <Content>
        <Tabs defaultActiveKey="1">
          <TabPane tab={t('nft.tab1')} key="1">
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
                    xl: 4,
                    xxl: 5,
                  }}
                  dataSource={processedNftList}
                  renderItem={item => (
                    <List.Item>
                      <Card
                        style={{ width: 200 }}
                        cover={
                          <>
                            {renderPreview(item)}
                            {supportedVideo(item?.tokenData.mimeType) ||
                            supportedVideo(item?.tokenData.animationMimeType) ? (
                              <Icon component={IconPlayer} />
                            ) : (
                              ''
                            )}
                          </>
                        }
                        hoverable
                        onClick={() => {
                          setNft(item);
                          setVideoUrl(
                            item?.tokenData.animation_url || item?.tokenData.animationUrl,
                          );
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
                    pageSize: handlePageSize(),
                  }}
                  loading={fetchingDB}
                />
              ) : (
                <Table
                  locale={{
                    triggerDesc: t('general.table.triggerDesc'),
                    triggerAsc: t('general.table.triggerAsc'),
                    cancelSort: t('general.table.cancelSort'),
                  }}
                  columns={NftColumns}
                  dataSource={processedNftList}
                />
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
                                href={`${renderExplorerUrl(
                                  currentSession.wallet.config,
                                  'address',
                                )}/${nft?.tokenMinter}`}
                              >
                                {nft?.tokenMinter}
                              </a>
                              {nft?.isMintedByCDC ? <IconTick style={{ height: '12px' }} /> : ''}
                            </>
                          }
                        />
                      </div>
                      <div className="item">
                        <div className="subtitle">{t('nft.detailModal.subtitle')}</div>
                        <div className="description">
                          {nft?.tokenData.description ? nft?.tokenData.description : 'n.a.'}
                        </div>
                      </div>
                      <div className="item">
                        <div className="table-row">
                          <div>{t('nft.detailModal.label1')}</div>
                          <div>{nft?.denomId}</div>
                        </div>
                        <div className="table-row">
                          <div>{t('nft.detailModal.label2')}</div>
                          <div>{nft?.denomName}</div>
                        </div>
                        <div className="table-row">
                          <div>{t('nft.detailModal.label3')}</div>
                          <div>{nft?.tokenId}</div>
                        </div>
                        {nft?.tokenData.mimeType ? (
                          <div className="table-row">
                            <div>{t('nft.detailModal.label4')}</div>
                            <a
                              data-original={nft?.denomId}
                              target="_blank"
                              rel="noreferrer"
                              href={
                                supportedVideo(nft?.tokenData.mimeType) ||
                                supportedVideo(nft?.tokenData.animationMimeType)
                                  ? nft?.tokenData.animation_url || nft?.tokenData.animationUrl
                                  : nft?.tokenData.image
                              }
                            >
                              {supportedVideo(nft?.tokenData.mimeType) ||
                              supportedVideo(nft?.tokenData.animationMimeType)
                                ? nft?.tokenData.animation_url || nft?.tokenData.animationUrl
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
                          {t('nft.detailModal.button1')}
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
                            {t('nft.detailModal.button2')}
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
                      disabled={
                        !isLedgerConnected &&
                        currentSession.wallet.walletType === LEDGER_WALLET_TYPE
                      }
                      loading={confirmLoading}
                    >
                      {t('nft.modal2.button1')}
                    </Button>
                  ) : (
                    <Button
                      key="submit"
                      type="primary"
                      htmlType="submit"
                      disabled={new Big(networkFee).gt(walletAsset.balance)}
                      onClick={() => {
                        form.submit();
                      }}
                    >
                      {t('general.continue')}
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
                    {t('general.cancel')}
                  </Button>,
                ]}
                okText="Confirm"
                className="nft-transfer-modal"
              >
                <>
                  {isNftTransferConfirmVisible ? (
                    <>
                      <div className="title">{t('nft.modal2.title')}</div>
                      <div className="description">{t('nft.modal2.description')}</div>
                      <div className="item">
                        <div className="nft-image">{renderPreview(nft)}</div>
                      </div>
                      <div className="item">
                        <div className="label">{t('nft.modal2.label1')}</div>
                        <div className="address">{`${form.getFieldValue('recipientAddress')}`}</div>
                      </div>
                      <div className="item notice">
                        <Layout>
                          <Sider width="20px">
                            <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                          </Sider>
                          <Content>{t('nft.modal2.notice1')}</Content>
                        </Layout>
                      </div>
                      <div className="item notice">
                        <Layout>
                          <Sider width="20px">
                            <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                          </Sider>
                          <Content>{t('nft.modal2.notice2')}</Content>
                        </Layout>
                      </div>
                      <div className="item">
                        <div className="label">{t('nft.modal2.label2')}</div>
                        <div>{`${formValues.denomId}`}</div>
                      </div>
                      <div className="item">
                        <div className="label">{t('nft.modal2.label3')}</div>
                        <div>{`${formValues.tokenId}`}</div>
                      </div>
                      <div className="item">
                        <div className="label">{t('nft.modal2.label4')}</div>
                        <div>
                          {getUINormalScaleAmount(networkFee, walletAsset.decimals)}{' '}
                          {walletAsset.symbol}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="title">{t('nft.modal3.title')}</div>
                      <div className="description">{t('nft.modal3.description')}</div>
                      <div className="item">
                        <div className="nft-image">{renderPreview(nft)}</div>
                      </div>
                      <div className="item">
                        <div className="label">{t('nft.modal3.label1')}</div>
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
                          label={t('nft.modal3.form.recipientAddress.label')}
                          hasFeedback
                          validateFirst
                          rules={[
                            {
                              required: true,
                              message: `${t('nft.modal3.form.recipientAddress.label')} ${t(
                                'general.required',
                              )}`,
                            },
                            customAddressValidator,
                          ]}
                        >
                          <Input placeholder={t('nft.modal3.form.recipientAddress.placeholder')} />
                        </Form.Item>
                      </Form>
                      {new Big(networkFee).gt(walletAsset.balance) ? (
                        <div className="item notice">
                          <Layout>
                            <Sider width="20px">
                              <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                            </Sider>
                            <Content>
                              {`${t('nft.modal1.notice2')} ${getUINormalScaleAmount(
                                networkFee,
                                walletAsset.decimals,
                              )} ${walletAsset.symbol} ${t('nft.modal1.notice3')}`}
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
                          <Content>{t('nft.modal2.notice1')}</Content>
                        </Layout>
                      </div>
                      <div className="item notice">
                        <Layout>
                          <Sider width="20px">
                            <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
                          </Sider>
                          <Content>{t('nft.modal2.notice2')}</Content>
                        </Layout>
                      </div>
                    </>
                  )}
                </>
              </ModalPopup>
              <PasswordFormModal
                description={t('general.passwordFormModal.description')}
                okButtonText={t('general.passwordFormModal.okButton')}
                onCancel={() => {
                  setInputPasswordVisible(false);
                  setIsNftTransferModalVisible(true);
                }}
                onSuccess={onWalletDecryptFinish}
                onValidatePassword={async (password: string) => {
                  const isValid = await secretStoreService.checkIfPasswordIsValid(password);
                  return {
                    valid: isValid,
                    errMsg: !isValid ? t('general.passwordFormModal.error') : '',
                  };
                }}
                successText={t('general.passwordFormModal.success')}
                title={t('general.passwordFormModal.title')}
                visible={inputPasswordVisible}
                successButtonText={t('general.continue')}
                confirmPassword={false}
              />
              <SuccessModalPopup
                isModalVisible={isSuccessModalVisible}
                handleCancel={closeSuccessModal}
                handleOk={closeSuccessModal}
                title={t('general.successModalPopup.title')}
                button={null}
                footer={[
                  <Button key="submit" type="primary" onClick={closeSuccessModal}>
                    {t('general.ok')}
                  </Button>,
                ]}
              >
                <>
                  {broadcastResult?.code !== undefined &&
                  broadcastResult?.code !== null &&
                  broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
                    <div className="description">
                      {t('general.successModalPopup.timeout.description')}
                    </div>
                  ) : (
                    <div className="description">
                      {t('general.successModalPopup.nftTransfer.description')}
                    </div>
                  )}
                </>
              </SuccessModalPopup>
              <ErrorModalPopup
                isModalVisible={isErrorModalVisible}
                handleCancel={closeErrorModal}
                handleOk={closeErrorModal}
                title={t('general.errorModalPopup.title')}
                footer={[]}
              >
                <>
                  <div className="description">
                    {t('general.errorModalPopup.nftTransfer.description')}
                    <br />
                    {errorMessages
                      .filter((item, idx) => {
                        return errorMessages.indexOf(item) === idx;
                      })
                      .map((err, idx) => (
                        <div key={idx}>- {err}</div>
                      ))}
                    {ledgerIsExpertMode ? (
                      <div>{t('general.errorModalPopup.ledgerExportMode')}</div>
                    ) : (
                      ''
                    )}
                  </div>
                </>
              </ErrorModalPopup>
            </>
          </TabPane>
          <TabPane tab={t('home.nft.tab2')} key="2">
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              columns={NftTransactionColumns}
              dataSource={nftTransfers}
              rowKey={record => record.key}
            />
          </TabPane>
          <TabPane tab={t('nft.tab2')} key="3">
            <div className="site-layout-background nft-content">
              <div className="container">
                <div className="description">{t('nft.container.description')}</div>
                <FormMintNft />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('nft.tab3')} key="4">
            <div className="site-layout-background nft-content">
              <div className="container">
                <ReceiveTab />
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
