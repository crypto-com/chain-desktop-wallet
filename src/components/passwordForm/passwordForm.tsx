import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';
import './passwordForm.less';

interface PasswordFormProps {
  title: string;
  description?: string;
  visible: boolean;
  confirmPassword?: boolean;

  onError: (errMsg: string) => void;
  inlineErrMsg?: string;

  okButtonText?: string;
  // TODO: use secure-string
  onOk: (password: string) => void;
}

const PasswordForm: React.FC<PasswordFormProps> = props => {
  const [form] = Form.useForm();
  const [validationErrMsg, setValidatorErrMsg] = useState<string>();
  const onFormChange = () => {
    setValidatorErrMsg('');
  };
  const onFormFinish = ({ password, passwordConfirm }) => {
    console.log(password, passwordConfirm);
    if (props.confirmPassword && password !== passwordConfirm) {
      setValidatorErrMsg('password mismatch');
    }
  };

  const errMsg = props.inlineErrMsg || validationErrMsg;
  const isErrVisible = !!errMsg;

  return (
    <div className="password-form">
      <div className="container">
        <div className="title">{props.title}</div>
        {props.description && <div className="description">{props.description}</div>}
        {isErrVisible && <div className="error">{errMsg}</div>}
        <Form
          layout="vertical"
          form={form}
          name="control-ref"
          onChange={onFormChange}
          onFinish={onFormFinish}
        >
          <Form.Item name="password" label="Wallet Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Wallet password" />
          </Form.Item>
          {props.confirmPassword && (
            <Form.Item name="passwordConfirm" label="Confirm Password" rules={[{ required: true }]}>
              <Input.Password placeholder="Confirm the password" />
            </Form.Item>
          )}
          <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
            <Button type="primary" htmlType="submit">
              {props.okButtonText || 'Submit'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

// const PasswordForm2 = () => {
//   const [form] = Form.useForm();
//   const [wallet, setWallet] = useState<Wallet>();
//   const [walletIdentifier, setWalletIdentifier] = useRecoilState(walletIdentifierState);
//   const [setIsModalVisible] = useState(false);
//   // const [isModalVisible, setIsModalVisible] = useState(false);
//   const didMountRef = useRef(false);
//   const history = useHistory();

//   const showModal = () => {
//     setIsModalVisible(true);
//   };

//   // const handleOk = () => {
//   //   setIsModalVisible(false);
//   //   setWalletIdentifier(wallet?.identifier ?? '');
//   // };

//   // const handleCancel = () => {
//   //   setIsModalVisible(false);
//   //   setWalletIdentifier(wallet?.identifier ?? '');
//   // };

//   const onWalletCreateFinish = async () => {
//     const { name, network } = form.getFieldsValue();
//     if (!name || !network) {
//       return;
//     }
//     const selectedNetwork = walletService
//       .supportedConfigs()
//       .find(config => config.name === network);

//     if (!selectedNetwork) {
//       return;
//     }

//     const createOptions: WalletCreateOptions = {
//       walletName: name,
//       config: selectedNetwork,
//     };
//     try {
//       const createdWallet = await walletService.createAndSaveWallet(createOptions);
//       await walletService.setCurrentSession(new Session(createdWallet));
//       setWallet(createdWallet);
//       showModal();
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('issue on wallet create', e);

//       // TODO : Show pop up on failure to create wallet
//       return;
//     }

//     form.resetFields();
//   };

//   useEffect(() => {
//     if (!didMountRef.current) {
//       didMountRef.current = true;
//     } else {
//       // Jump to backup screen after walletIdentifier created & setWalletIdentifier finished
//       history.push({
//         pathname: '/create/backup',
//         state: { walletIdentifier },
//       });
//     }
//   }, [walletIdentifier, history]);

//   return (
//     <Form
//       {...layout}
//       layout="vertical"
//       form={form}
//       name="control-ref"
//       onFinish={onWalletCreateFinish}
//     >
//       <Form.Item name="name" label="Wallet Passphrase" rules={[{ required: true }]}>
//         <Input.Password placeholder="Wallet passphrase" />
//       </Form.Item>
//       <Form.Item name="name" label="Confirm" rules={[{ required: true }]}>
//         <Input.Password placeholder="Confirm the passphrase" />
//       </Form.Item>
//     </Form>
//   );
// };

// // function CreatePage() {
// //   return (
// //     <main className="create-page">
// //       <div className="header">
// //         <img src={logo} className="logo" alt="logo" />
// //       </div>
// //       <div className="container">
// //         <div>
// //           <div className="title">Create wallet</div>
// //           <div className="slogan">Create a name and select the network for your wallet.</div>
// //           <FormCreate />
// //         </div>
// //       </div>
// //     </main>
// //   );
// // }

export default PasswordForm;
