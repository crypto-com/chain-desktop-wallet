import React from 'react';
import './settings.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout, Select, Tabs } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

// const FormGeneral = () => {
//   return (
//     <Form.Item name="name" label="Name">
//       <Input />
//     </Form.Item>
//   )
// }

// const FormNetwork = () => {
//   return (
//     <Form.Item name="address" label="Address Prefix">
//     <Input />
//   </Form.Item>
//   )
// }

// const FormSettings = () => {
//   const [form] = Form.useForm();
//   const didMountRef = useRef(false);

//   useEffect(() => {
//     if (!didMountRef.current) {
//       didMountRef.current = true;
//     } else {
//       // Jump to backup screen after walletIdentifier created & setWalletIdentifier finished
//       console.log('hi')
//     }
//   }, []);

//   const onFinish = (values: any) => {
//     console.log('Success:', values);
//     console.log('Success:', form.getFieldsValue());
//   };

//   const onFinishFailed = (errorInfo: any) => {
//     console.log('Failed:', errorInfo);
//   };

//   const onReset = () => {
//     form.resetFields();
//   };

//   const onFill = () => {
//     form.setFieldsValue({
//       name: 'Hello world!',
//       address: 'testnet id',
//     });
//   };
//   return (
//     <Form
//       {...layout}
//       name="basic"
//       initialValues={{ remember: true }}
//       onFinish={onFinish}
//       onFinishFailed={onFinishFailed}
//     >
//       {/* <Tabs defaultActiveKey="1">
//         <TabPane tab="General" key="1">
//           <div className="site-layout-background stake-content">
//             <div className="container">
//               <div className="description">Withdraw rewards from delegated funds.</div>
//               <FormGeneral />
//             </div>
//           </div>
//         </TabPane>
//         <TabPane tab="Network" key="2">
//           <div className="site-layout-background stake-content">
//             <div className="container">
//               <div className="description">Delegate funds to validator.</div>
//               <FormNetwork />
//             </div>
//           </div>
//         </TabPane>
//       </Tabs> */}
//       <Form.Item name="coin" label="Coin">
//     <Input />
//   </Form.Item>
//       <Form.Item name="symbol" label="Symbol">
//     <Input />
//   </Form.Item>
//       <Form.Item {...tailLayout}>
//         <Button type="primary" htmlType="submit">
//           Submit
//         </Button>
//         <Button htmlType="button" onClick={onReset}>
//           Reset
//         </Button>
//         <Button type="link" htmlType="button" onClick={onFill}>
//           Fill form
//         </Button>
//       </Form.Item>
//     </Form>
//   )
// }

const FormSettings = () => {
  const [form] = Form.useForm();

  const onGenderChange = (value: string) => {
    switch (value) {
      case 'male':
        form.setFieldsValue({ note: 'Hi, man!' });
        break;
      case 'female':
        form.setFieldsValue({ note: 'Hi, lady!' });
        break;
      case 'other':
        form.setFieldsValue({ note: 'Hi there!' });
        break;
      default:
        form.setFieldsValue({ note: 'Hi' });
    }
  };

  const onFinish = values => {
    console.log(values);
  };

  const onReset = () => {
    form.resetFields();
  };

  const onFill = () => {
    form.setFieldsValue({
      name: 'Hello world!',
      gender: 'male',
    });
  };

  return (
    <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="General" key="1">
          <div className="site-layout-background stake-content">
            <div className="container">
              <div className="description">Withdraw rewards from delegated funds.</div>
              <Form.Item
                name="name"
                label="Name"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
          </div>
        </TabPane>
        <TabPane tab="Network" key="2">
          <div className="site-layout-background stake-content">
            <div className="container">
              <div className="description">Delegate funds to validator.</div>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select
                  placeholder="Select a option and change input text above"
                  onChange={onGenderChange}
                  allowClear
                >
                  <Option value="male">male</Option>
                  <Option value="female">female</Option>
                  <Option value="other">other</Option>
                </Select>
              </Form.Item>
              
            </div>
          </div>
        </TabPane>
      </Tabs>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.gender !== currentValues.gender}
      >
        {({ getFieldValue }) => {
          return getFieldValue('gender') === 'other' ? (
            <Form.Item
              name="customizeGender"
              label="Customize Gender"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          ) : null;
        }}
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
        <Button htmlType="button" onClick={onReset}>
          Reset
        </Button>
        <Button type="link" htmlType="button" onClick={onFill}>
          Fill form
        </Button>
      </Form.Item>
    </Form>
  );
};

function SettingsPage() {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Settings</Header>
      <Content>
        <FormSettings />
      </Content>
      <Footer />
    </Layout>
  );
}

export default SettingsPage;
