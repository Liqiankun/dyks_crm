import { LogoutOutlined } from '@ant-design/icons';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { Dropdown, message } from 'antd';
import { getCurrentUser, logout, TOKEN_KEY, type CurrentUser } from './services/api';

const LOGIN_PATH = '/user/login';

function goLogin() {
  localStorage.removeItem(TOKEN_KEY);
  if (history.location.pathname !== LOGIN_PATH) {
    const redirect = history.location.pathname + history.location.search;
    history.replace(`${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}`);
  }
}

export async function getInitialState(): Promise<{
  currentUser?: CurrentUser;
  fetchUserInfo: () => Promise<CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return undefined;
    try {
      const res = await getCurrentUser();
      return res.data;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return undefined;
    }
  };

  const currentUser = history.location.pathname === LOGIN_PATH ? undefined : await fetchUserInfo();
  return { currentUser, fetchUserInfo };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const user = initialState?.currentUser;
  return {
    layout: 'mix',
    fixSiderbar: true,
    menu: { locale: false },
    avatarProps: user
      ? {
          title: `${user.name || user.username}${user.role === 'admin' ? '（超级管理员）' : ''}`,
          size: 'small',
          render: (_, dom) => (
            <Dropdown
              menu={{
                items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
                onClick: async ({ key }) => {
                  if (key !== 'logout') return;
                  try {
                    await logout();
                  } finally {
                    localStorage.removeItem(TOKEN_KEY);
                    setInitialState((s) => ({ ...s!, currentUser: undefined }));
                    history.replace(LOGIN_PATH);
                  }
                },
              }}
            >
              {dom}
            </Dropdown>
          ),
        }
      : undefined,
    onPageChange: () => {
      if (!initialState?.currentUser && history.location.pathname !== LOGIN_PATH) {
        goLogin();
      }
    },
  };
};

/** 后端统一返回 { result, error_msg, data }，result === 1 表示成功 */
export const request: RequestConfig = {
  timeout: 30000,
  requestInterceptors: [
    (config: any) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
      return config;
    },
  ],
  errorConfig: {
    errorThrower: (res: any) => {
      if (res && typeof res === 'object' && 'result' in res && res.result !== 1) {
        const error: any = new Error(res.error_msg || '请求失败');
        error.name = 'BizError';
        error.info = res;
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      if (error.name === 'BizError') {
        message.error(error.info?.error_msg || '请求失败');
        return;
      }
      const status = error.response?.status;
      const msg = error.response?.data?.error_msg;
      if (status === 401) {
        message.error(msg || '请先登录');
        goLogin();
        return;
      }
      if (error.response) {
        message.error(msg || `请求错误 ${status}`);
      } else if (error.request) {
        message.error('服务器无响应，请检查后端是否启动');
      } else {
        message.error(error.message || '请求失败');
      }
    },
  },
};
