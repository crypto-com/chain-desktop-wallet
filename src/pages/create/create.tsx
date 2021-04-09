import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { Button, Form, Input, Select, Checkbox, notification } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { walletIdentifierState, walletTempBackupState } from '../../recoil/atom';
import './create.less';
import { Wallet } from '../../models/Wallet';
import { walletService } from '../../service/WalletService';
import { WalletCreateOptions, WalletCreator } from '../../service/WalletCreator';
import { LedgerWalletMaximum, DefaultWalletConfigs, CosmosPorts } from '../../config/StaticConfig';
import logo from '../../assets/logo-products-chain.svg';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
// import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
// import PasswordFormContainer from '../../components/PasswordForm/PasswordFormContainer';
import BackButton from '../../components/BackButton/BackButton';
import { secretStoreService } from '../../storage/SecretStoreService';
import LedgerModalPopup from '../../components/LedgerModalPopup/LedgerModalPopup';
import SuccessCheckmark from '../../components/SuccessCheckmark/SuccessCheckmark';
import IconLedger from '../../svg/IconLedger';
import {
  createLedgerDevice,
  LEDGER_WALLET_TYPE,
  NORMAL_WALLET_TYPE,
} from '../../service/LedgerService';
import { TransactionUtils } from '../../utils/TransactionUtils';

const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

interface FormCustomConfigProps {
  setIsConnected: (arg: boolean) => void;
  setIsCreateDisable: (arg: boolean) => void;
  setNetworkConfig: (arg: any) => void;
}

interface FormCreateProps {
  form: FormInstance;
  isCreateDisable: boolean;
  isNetworkSelectFieldDisable: boolean;
  isWalletSelectFieldDisable: boolean;
  setWalletIdentifier: (walletIdentifier: string) => void;
  setIsCustomConfig: (arg: boolean) => void;
  setIsConnected: (arg: boolean) => void;
  setIsCreateDisable: (arg: boolean) => void;
  setIsNetworkSelectFieldDisable: (arg: boolean) => void;
  setIsWalletSelectFieldDisable: (arg: boolean) => void;
  setLedgerConnected: (arg: boolean) => void;
  setIsModalVisible: (arg: boolean) => void;
  networkConfig: any;
}

const FormCustomConfig: React.FC<FormCustomConfigProps> = props => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checkingNodeConnection, setCheckingNodeConnection] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    props.setIsConnected(true);
    props.setIsCreateDisable(false);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const handleErrorOk = () => {
    setIsErrorModalVisible(false);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
  };

  const checkNodeConnectivity = async () => {
    // TO-DO Node Connectivity check
    form.validateFields().then(async values => {
      setCheckingNodeConnection(true);
      const { nodeUrl } = values;
      const isNodeLive = await walletService.checkNodeIsLive(`${nodeUrl}${CosmosPorts.Main}`);
      setCheckingNodeConnection(false);

      if (isNodeLive) {
        showModal();
        props.setNetworkConfig(values);
      } else {
        showErrorModal();
      }
    });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      name="control-ref"
      initialValues={{
        indexingUrl: DefaultWalletConfigs.TestNetConfig.indexingUrl,
        nodeUrl: 'http://127.0.0.1',
        derivationPath: "m/44'/394'/0'/0/0",
        validatorPrefix: 'crocncl',
        croDenom: 'cro',
        baseDenom: 'basecro',
        chainId: 'test',
        addressPrefix: 'cro',
      }}
    >
      <Form.Item
        name="nodeUrl"
        label="Node URL"
        hasFeedback
        rules={[
          { required: true, message: 'Node URL is required' },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid node url',
          },
        ]}
      >
        <Input placeholder="Node URL" />
      </Form.Item>

      <Form.Item
        name="indexingUrl"
        label="Chain Indexing URL"
        hasFeedback
        rules={[
          { required: true, message: 'Chain Indexing URL is required' },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid indexing url',
          },
        ]}
      >
        <Input placeholder="Chain Indexing URL" />
      </Form.Item>

      <div className="row">
        <Form.Item
          name="derivationPath"
          label="Derivation Path"
          hasFeedback
          rules={[
            { required: true, message: 'Derivation Path is required' },
            {
              pattern: /^m\/\d+'?\/\d+'?\/\d+'?\/\d+'?\/\d+'?$/,
              message: 'Please enter a valid derivation path',
            },
          ]}
        >
          <Input maxLength={64} placeholder="Derivation Path" />
        </Form.Item>
        <Form.Item
          name="validatorPrefix"
          label="Validator Prefix"
          hasFeedback
          rules={[{ required: true, message: 'Validator Prefix is required' }]}
        >
          <Input placeholder="Validator Prefix" />
        </Form.Item>
      </div>

      <div className="row">
        <Form.Item
          name="addressPrefix"
          label="Address Prefix"
          hasFeedback
          rules={[{ required: true, message: 'Address Prefix is required' }]}
        >
          <Input placeholder="Address Prefix" />
        </Form.Item>
        <Form.Item
          name="chainId"
          label="Chain ID"
          hasFeedback
          rules={[{ required: true, message: 'Chain ID is required' }]}
        >
          <Input placeholder="Chain ID" />
        </Form.Item>
      </div>
      <div className="row">
        <Form.Item
          name="baseDenom"
          label="Base Denom"
          hasFeedback
          rules={[{ required: true, message: 'Base Denom is required' }]}
        >
          <Input placeholder="Base Denom" />
        </Form.Item>
        <Form.Item
          name="croDenom"
          label="CRO Denom"
          hasFeedback
          rules={[{ required: true, message: 'CRO Denom is required' }]}
        >
          <Input placeholder="CRO Denom" />
        </Form.Item>
      </div>

      <SuccessModalPopup
        isModalVisible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        title="Success!"
        button={
          <Button type="primary" onClick={checkNodeConnectivity} loading={checkingNodeConnection}>
            Connect
          </Button>
        }
        footer={[
          <Button key="submit" type="primary" onClick={handleOk}>
            Next
          </Button>,
        ]}
      >
        <>
          <div className="description">Your node is connected!</div>
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={handleErrorCancel}
        handleOk={handleErrorOk}
        title="An error happened!"
        footer={[]}
      >
        <>
          <div className="description">
            Could not connect to the specified node URL. Please check again.
          </div>
        </>
      </ErrorModalPopup>
    </Form>
  );
};

const FormCreate: React.FC<FormCreateProps> = props => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [walletTempBackupSeed, setWalletTempBackupSeed] = useRecoilState(walletTempBackupState);
  const [hwcheck, setHwcheck] = useState(!props.isWalletSelectFieldDisable);

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
    props.setWalletIdentifier(wallet?.identifier ?? '');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    props.setWalletIdentifier(wallet?.identifier ?? '');
  };

  const handleErrorOk = () => {
    setIsErrorModalVisible(false);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const onChange = () => {
    const { name } = props.form.getFieldsValue();
    if (typeof name === 'undefined') {
      props.setIsNetworkSelectFieldDisable(true);
    } else if (name !== '') {
      props.setIsNetworkSelectFieldDisable(false);
    } else {
      props.setIsNetworkSelectFieldDisable(true);
    }
  };

  const onCheckboxChange = e => {
    setHwcheck(!hwcheck);
    props.setIsWalletSelectFieldDisable(!e.target.checked);
    if (e.target.checked) props.form.setFieldsValue({ walletType: LEDGER_WALLET_TYPE });
    else props.form.setFieldsValue({ walletType: NORMAL_WALLET_TYPE });
  };

  const onNetworkChange = (network: string) => {
    props.form.setFieldsValue({ network });
    if (network === DefaultWalletConfigs.CustomDevNet.name) {
      props.setIsCustomConfig(true);
      props.setIsConnected(false);
      props.setIsCreateDisable(true);
    }
  };

  // eslint-disable-next-line
  const onWalletCreateFinishCore = async () => {
    setCreateLoading(true);
    const { addressIndex, name, walletType, network } = props.form.getFieldsValue();
    if (!name || !walletType || !network) {
      return;
    }

    const selectedNetworkConfig = walletService.getSelectedNetwork(network, props);
    if (!selectedNetworkConfig) {
      return;
    }

    const createOptions: WalletCreateOptions = {
      walletName: name,
      config: selectedNetworkConfig,
      walletType,
      addressIndex,
    };

    try {
      const createdWallet = WalletCreator.create(createOptions);
      setWalletTempBackupSeed(createdWallet);
      setWallet(createdWallet);
      setCreateLoading(false);
      showModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet create', e);

      setCreateLoading(false);
      showErrorModal();
      return;
    }

    props.form.resetFields();
  };

  const onWalletCreateFinish = async () => {
    const { walletType, addressIndex } = props.form.getFieldsValue();

    if (walletType === NORMAL_WALLET_TYPE) {
      onWalletCreateFinishCore();
      return;
    }
    props.setIsModalVisible(true);
    props.setLedgerConnected(false);
    let hwok = false;
    try {
      const device = createLedgerDevice();
      // check ledger device ok
      await device.getPubKey(addressIndex, false);
      props.setLedgerConnected(true);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      props.setIsModalVisible(false);

      hwok = true;
    } catch (e) {
      props.setLedgerConnected(false);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      props.setIsModalVisible(false);

      notification.error({
        message: `Cannot detect any Ledger device`,
        description: `Please connect with your Ledger device`,
        placement: 'topRight',
        duration: 3,
      });
    }
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
    if (hwok) {
      // proceed
      onWalletCreateFinishCore();
    }
  };

  const customMaxValidator = TransactionUtils.maxValidator(
    `${LedgerWalletMaximum}`,
    `Address index exceeds ${LedgerWalletMaximum}`,
  );
  const customMinValidator = TransactionUtils.minValidator('0', 'Address index is lower than 0');

  return (
    <Form
      {...layout}
      layout="vertical"
      form={props.form}
      name="control-ref"
      onFinish={onWalletCreateFinish}
      onChange={onChange}
      initialValues={{
        walletType: 'normal',
        addressIndex: '0',
        network: 'MAINNET',
      }}
    >
      <Form.Item
        name="name"
        label="Wallet Name"
        hasFeedback
        rules={[{ required: true, message: 'Wallet name is required' }]}
      >
        <Input maxLength={36} placeholder="Wallet name" />
      </Form.Item>
      <Checkbox onChange={onCheckboxChange} checked={hwcheck}>
        Want to create with hardware wallet?
      </Checkbox>
      <Form.Item name="walletType" label="Wallet Type" hidden={props.isWalletSelectFieldDisable}>
        <Select placeholder="Select wallet type" disabled={props.isWalletSelectFieldDisable}>
          <Select.Option key="normal" value="normal">
            Normal
          </Select.Option>
          <Select.Option key="ledger" value="ledger">
            Ledger
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="addressIndex"
        label="Address Index"
        rules={[
          {
            required: true,
            message: 'Please input your address index',
          },

          customMinValidator,
          customMaxValidator,
        ]}
        hidden={props.isWalletSelectFieldDisable}
      >
        <Input placeholder="0" />
      </Form.Item>
      <Form.Item name="network" label="Network" rules={[{ required: true }]}>
        <Select
          placeholder="Select wallet network"
          onChange={onNetworkChange}
          disabled={props.isNetworkSelectFieldDisable}
        >
          {walletService.supportedConfigs().map(config => (
            <Select.Option key={config.name} value={config.name} disabled={!config.enabled}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <SuccessModalPopup
          isModalVisible={isModalVisible}
          handleCancel={handleCancel}
          handleOk={handleOk}
          title="Success!"
          button={
            <Button
              type="primary"
              htmlType="submit"
              disabled={props.isCreateDisable}
              loading={createLoading}
            >
              Create Wallet
            </Button>
          }
          footer={[
            <Button key="submit" type="primary" onClick={handleOk}>
              Next
            </Button>,
          ]}
        >
          <>
            <div className="description">Your wallet has been created!</div>
          </>
        </SuccessModalPopup>
        <ErrorModalPopup
          isModalVisible={isErrorModalVisible}
          handleCancel={handleErrorCancel}
          handleOk={handleErrorOk}
          title="An error happened!"
          footer={[]}
        >
          <>
            <div className="description">
              Failed to create wallet, the derivation path might be incorrect.
            </div>
          </>
        </ErrorModalPopup>
      </Form.Item>
    </Form>
  );
};

const CreatePage = () => {
  const [form] = Form.useForm();
  const [isCreateDisable, setIsCreateDisable] = useState(false);
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isNetworkSelectFieldDisable, setIsNetworkSelectFieldDisable] = useState(true);
  const [isWalletSelectFieldDisable, setIsWalletSelectFieldDisable] = useState(true);
  const [networkConfig, setNetworkConfig] = useState();
  const [walletIdentifier, setWalletIdentifier] = useRecoilState(walletIdentifierState);
  const didMountRef = useRef(false);
  const history = useHistory();
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [goHomeButtonLoading, setGoHomeButtonLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [ledgerConnected, setLedgerConnected] = useState(false);
  const [walletTempBackupSeed] = useRecoilState(walletTempBackupState);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onWalletBackupFinish = async (password: string) => {
    setGoHomeButtonLoading(true);
    if (!wallet) {
      return;
    }
    await walletService.encryptWalletAndSetSession(password, wallet);
    setGoHomeButtonLoading(false);
    history.push('/home');
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      const fetchedWallet = walletTempBackupSeed;
      if (fetchedWallet === undefined || fetchedWallet === null) return;
      setWallet(fetchedWallet);

      if (fetchedWallet.walletType === LEDGER_WALLET_TYPE) {
        setInputPasswordVisible(true);
      } else {
        // Jump to backup screen after walletIdentifier created & setWalletIdentifier finished
        history.push({
          pathname: '/create/backup',
          state: { walletIdentifier },
        });
      }
    };

    if (!didMountRef.current) {
      didMountRef.current = true;
    } else {
      fetchWalletData();
    }
    // eslint-disable-next-line
  }, [walletIdentifier, history]);

  return (
    <main className="create-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <BackButton />
        <div>
          <div className="title">
            {!isCustomConfig || isConnected ? 'Create Wallet' : 'Custom Configuration'}
          </div>
          <div className="slogan">
            {!isCustomConfig || isConnected
              ? 'Create a name and select the network for your wallet.'
              : 'Fill in the below to connect to this custom network.'}
          </div>

          {!isCustomConfig || isConnected ? (
            <FormCreate
              form={form}
              isCreateDisable={isCreateDisable}
              isNetworkSelectFieldDisable={isNetworkSelectFieldDisable}
              isWalletSelectFieldDisable={isWalletSelectFieldDisable}
              setIsNetworkSelectFieldDisable={setIsNetworkSelectFieldDisable}
              setIsWalletSelectFieldDisable={setIsWalletSelectFieldDisable}
              setWalletIdentifier={setWalletIdentifier}
              setIsCustomConfig={setIsCustomConfig}
              setIsConnected={setIsConnected}
              setIsCreateDisable={setIsCreateDisable}
              networkConfig={networkConfig}
              setLedgerConnected={setLedgerConnected}
              setIsModalVisible={setIsModalVisible}
            />
          ) : (
            <FormCustomConfig
              setIsConnected={setIsConnected}
              setIsCreateDisable={setIsCreateDisable}
              setNetworkConfig={setNetworkConfig}
            />
          )}

          <PasswordFormModal
            description="Input the app password to encrypt the wallet to be restored"
            okButtonText="Encrypt wallet"
            isButtonLoading={goHomeButtonLoading}
            onCancel={() => {
              setInputPasswordVisible(false);
            }}
            onSuccess={onWalletBackupFinish}
            onValidatePassword={async (password: string) => {
              const isValid = await secretStoreService.checkIfPasswordIsValid(password);
              return {
                valid: isValid,
                errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
              };
            }}
            successText="Wallet created and encrypted successfully !"
            title="Provide app password"
            visible={inputPasswordVisible}
            successButtonText="Go to Home"
            confirmPassword={false}
          />
        </div>
      </div>

      <LedgerModalPopup
        isModalVisible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        title={ledgerConnected ? 'Success!' : 'Connect your Ledger Device'}
        footer={[]}
        image={ledgerConnected ? <SuccessCheckmark /> : <IconLedger />}
      >
        <div className="description">
          {ledgerConnected
            ? 'Your ledger device has been connected successfully.'
            : 'Please confirm connection on your Ledger Device'}
        </div>
      </LedgerModalPopup>
    </main>
  );
};

export default CreatePage;
