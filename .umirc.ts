import { defineConfig } from '@umijs/max';

export default defineConfig({
  // appConfig 会用 antd <App> 包裹应用，页面里可以使用 App.useApp()
  antd: { appConfig: {} },
  access: {},
  model: {},
  initialState: {},
  request: {},
  locale: { default: 'zh-CN', antd: true, baseNavigator: false },
  layout: {
    title: 'CRM 管理系统',
    locale: false,
  },
  proxy: {
    '/api': {
      target: process.env.API_URL || 'http://127.0.0.1:7001',
      changeOrigin: true,
    },
  },
  routes: [
    { path: '/user/login', component: './Login', layout: false },
    { path: '/', redirect: '/applications' },
    {
      name: 'Application',
      path: '/applications',
      icon: 'AppstoreOutlined',
      component: './Application',
    },
    {
      path: '/applications/:id',
      component: './Application/Detail',
      hideInMenu: true,
      name: 'Application 详情',
    },
    {
      name: '用户管理',
      path: '/users',
      icon: 'TeamOutlined',
      access: 'isAdmin',
      component: './User',
    },
    { path: '*', component: './404', layout: false },
  ],
  npmClient: 'npm',
});
