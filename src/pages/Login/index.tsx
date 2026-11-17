import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Alert, App } from 'antd';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { login, TOKEN_KEY } from '@/services/api';

export default function LoginPage() {
  const { setInitialState } = useModel('@@initialState');
  const [error, setError] = useState<string>();
  const { message } = App.useApp();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setError(undefined);
    try {
      const res = await login(values);
      localStorage.setItem(TOKEN_KEY, res.data.token);
      flushSync(() => {
        setInitialState((s: any) => ({ ...s, currentUser: res.data.user }));
      });
      message.success('登录成功');
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      history.replace(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/');
    } catch (e: any) {
      setError(e?.response?.data?.error_msg || e?.info?.error_msg || '登录失败，请检查后端服务');
    }
  };

  return (
    <div style={{ height: '100vh', background: '#f0f2f5', paddingTop: '12vh' }}>
      <LoginForm
        title="CRM 管理系统"
        subTitle="快手 / 抖音 Application 数据管理"
        onFinish={handleSubmit}
      >
        {error && <Alert style={{ marginBottom: 24 }} message={error} type="error" showIcon />}
        <ProFormText
          name="username"
          fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
          placeholder="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
          placeholder="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        />
      </LoginForm>
    </div>
  );
}
