import { request } from '@umijs/max';

/** 后端统一响应结构 */
export interface ApiResponse<T> {
  result: number;
  error_msg: string;
  data: T;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

export type Role = 'admin' | 'user';

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface User extends CurrentUser {
  status: 'active' | 'disabled';
  created_at: string;
}

/** 1 快手 2 抖音 */
export type AppType = 1 | 2;

export interface Application {
  id: string;
  name: string;
  type: AppType;
  app_id: string;
  user_id: string;
  user: { id: string; username: string; name: string } | null;
  remark: string;
  created_at: string;
}

export interface InteractionData {
  id: string;
  application_id: string;
  type: number;
  date: string;
  queryCnt: number;
  impression: number;
  impressionRadio: number;
  click: number;
  clickRadio: number;
  ecpm: number;
  costTotal: number;
}

export interface InteractionSummary {
  queryCnt: number;
  impression: number;
  impressionRadio: number;
  click: number;
  clickRadio: number;
  ecpm: number;
  costTotal: number;
}

export interface InteractionResult {
  items: InteractionData[];
  total: number;
  current: number;
  pageSize: number;
  summary: InteractionSummary;
}

export const TOKEN_KEY = 'crm_token';

// ---------- 认证 ----------
export const login = (body: { username: string; password: string }) =>
  request<ApiResponse<{ token: string; user: CurrentUser }>>('/api/auth/login', {
    method: 'POST',
    data: body,
    skipErrorHandler: true,
  });

export const getCurrentUser = () =>
  request<ApiResponse<CurrentUser>>('/api/auth/current', { skipErrorHandler: true });

export const logout = () => request<ApiResponse<boolean>>('/api/auth/logout', { method: 'POST' });

// ---------- 用户 ----------
export const listUsers = (params: Record<string, any>) =>
  request<ApiResponse<PageResult<User>>>('/api/users', { params });

export const userOptions = () =>
  request<ApiResponse<{ label: string; value: string }[]>>('/api/users/options');

export const createUser = (data: Partial<User> & { password: string }) =>
  request<ApiResponse<User>>('/api/users', { method: 'POST', data });

export const updateUser = (id: string, data: Partial<User> & { password?: string }) =>
  request<ApiResponse<User>>(`/api/users/${id}`, { method: 'PUT', data });

export const deleteUser = (id: string) =>
  request<ApiResponse<boolean>>(`/api/users/${id}`, { method: 'DELETE' });

// ---------- Application ----------
export const listApplications = (params: Record<string, any>) =>
  request<ApiResponse<PageResult<Application>>>('/api/applications', { params });

export const getApplication = (id: string) =>
  request<ApiResponse<Application>>(`/api/applications/${id}`);

export const createApplication = (data: Partial<Application>) =>
  request<ApiResponse<Application>>('/api/applications', { method: 'POST', data });

export const updateApplication = (id: string, data: Partial<Application>) =>
  request<ApiResponse<Application>>(`/api/applications/${id}`, { method: 'PUT', data });

export const deleteApplication = (id: string) =>
  request<ApiResponse<boolean>>(`/api/applications/${id}`, { method: 'DELETE' });

// ---------- 点击数据 ----------
export const listInteractionData = (appId: string, params: Record<string, any>) =>
  request<ApiResponse<InteractionResult>>(`/api/applications/${appId}/interaction-data`, { params });

export const importInteractionData = (appId: string, data: unknown) =>
  request<ApiResponse<{ total: number; inserted: number; updated: number }>>(
    `/api/applications/${appId}/interaction-data`,
    { method: 'POST', data },
  );

export const updateInteractionData = (id: string, data: Partial<InteractionData>) =>
  request<ApiResponse<InteractionData>>(`/api/interaction-data/${id}`, { method: 'PUT', data });

export const deleteInteractionData = (id: string) =>
  request<ApiResponse<boolean>>(`/api/interaction-data/${id}`, { method: 'DELETE' });
