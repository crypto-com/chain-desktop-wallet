import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { Button, Form, Input, Select } from 'antd';
import { walletIdentifierState } from '../../recoil/atom';
import './create.less';
import { Wallet } from '../../models/Wallet';
import { walletService } from '../../service/WalletService';
import { WalletCreateOptions } from '../../service/WalletCreator';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import logo from '../../assets/logo-products-chain.svg';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { Session } from '../../models/Session';
// import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
// import PasswordFormContainer from '../../components/PasswordForm/PasswordFormContainer';
import BackButton from '../../components/BackButton/BackButton';

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
}

interface FormCreateProps {
  isModalVisible: boolean;
  isCreateDisable: boolean;
  handleCancel: () => void;
  handleOk: () => void;
  onNetworkChange: (network: string) => void;
}

const FormCustomConfig: React.FC<FormCustomConfigProps> = props => {
  const isNodeValid = true;
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  const checkNodeConnectivity = () => {
    // TO-DO Node Connectivity check
    if (isNodeValid) {
      showModal();
    } else {
      showErrorModal();
    }
  };

  return (
    <>
      <div className="row">
        <Form.Item
          name="networkName"
          label="Network Name"
          hasFeedback
          rules={[{ required: true, message: 'Network Name is required' }]}
        >
          <Input maxLength={36} placeholder="Network Name" />
        </Form.Item>
        <Form.Item
          name="derivationPath"
          label="Derivation Path"
          hasFeedback
          rules={[{ required: true, message: 'Derivation Path is required' }]}
        >
          <Input maxLength={36} placeholder="Derivation Path" />
        </Form.Item>
      </div>

      <Form.Item
        name="nodeUrl"
        label="Node URL"
        hasFeedback
        rules={[{ required: true, message: 'Node URL is required' }]}
      >
        <Input placeholder="Node URL" />
      </Form.Item>
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
          <Button type="primary" onClick={checkNodeConnectivity}>
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
            Your Network Configuration is invalid. Please check again.
          </div>
        </>
      </ErrorModalPopup>
    </>
  );
};

const FormCreate: React.FC<FormCreateProps> = props => {
  return (
    <>
      <Form.Item
        name="name"
        label="Wallet Name"
        hasFeedback
        rules={[{ required: true, message: 'Wallet name is required' }]}
      >
        <Input maxLength={36} placeholder="Wallet name" />
      </Form.Item>
      <Form.Item name="network" label="Network" rules={[{ required: true }]}>
        <Select placeholder="Select wallet network" onChange={props.onNetworkChange}>
          {walletService.supportedConfigs().map(config => (
            <Select.Option key={config.name} value={config.name} disabled={!config.enabled}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <SuccessModalPopup
          isModalVisible={props.isModalVisible}
          handleCancel={props.handleCancel}
          handleOk={props.handleOk}
          title="Success!"
          button={
            <Button type="primary" htmlType="submit" disabled={props.isCreateDisable}>
              Create Wallet
            </Button>
          }
          footer={[
            <Button key="submit" type="primary" onClick={props.handleOk}>
              Next
            </Button>,
          ]}
        >
          <>
            <div className="description">Your wallet has been created!</div>
          </>
        </SuccessModalPopup>
      </Form.Item>
    </>
  );
};

const CreatePage = () => {
  const [form] = Form.useForm();
  const [wallet, setWallet] = useState<Wallet>();
  const [walletIdentifier, setWalletIdentifier] = useRecoilState(walletIdentifierState);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateDisable, setIsCreateDisable] = useState(false);
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const didMountRef = useRef(false);
  const history = useHistory();

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
    setWalletIdentifier(wallet?.identifier ?? '');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setWalletIdentifier(wallet?.identifier ?? '');
  };

  const onNetworkChange = (network: string) => {
    form.setFieldsValue({ network });
    if (network === DefaultWalletConfigs.CustomDevNet.name) {
      setIsCustomConfig(true);
      setIsConnected(false);
      setIsCreateDisable(true);
    }
  };

  const onWalletCreateFinish = async () => {
    const { name, network } = form.getFieldsValue();
    if (!name || !network) {
      return;
    }
    const selectedNetwork = walletService
      .supportedConfigs()
      .find(config => config.name === network);

    if (!selectedNetwork) {
      return;
    }

    const createOptions: WalletCreateOptions = {
      walletName: name,
      config: selectedNetwork,
    };

    try {
      const createdWallet = await walletService.createAndSaveWallet(createOptions);
      await walletService.setCurrentSession(new Session(createdWallet));
      setWallet(createdWallet);
      showModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet create', e);

      // TODO : Show pop up on failure to create wallet
      return;
    }

    form.resetFields();
  };

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
    } else {
      // Jump to backup screen after walletIdentifier created & setWalletIdentifier finished
      history.push({
        pathname: '/create/backup',
        state: { walletIdentifier },
      });
    }
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
          <Form
            {...layout}
            layout="vertical"
            form={form}
            name="control-ref"
            onFinish={onWalletCreateFinish}
          >
            {!isCustomConfig || isConnected ? (
              <FormCreate
                isCreateDisable={isCreateDisable}
                isModalVisible={isModalVisible}
                handleOk={handleOk}
                handleCancel={handleCancel}
                onNetworkChange={onNetworkChange}
              />
            ) : (
              <FormCustomConfig
                setIsConnected={setIsConnected}
                setIsCreateDisable={setIsCreateDisable}
              />
            )}
          </Form>
        </div>
      </div>
    </main>
  );
};

export default CreatePage;
