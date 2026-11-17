import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import { createUser, deleteUser, listUsers, updateUser, type User } from '@/services/api';

export default function UserPage() {
  const actionRef = useRef<ActionType>();
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const columns: ProColumns<User>[] = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'name' },
    {
      title: '角色',
      dataIndex: 'role',
      valueEnum: { admin: { text: '超级管理员', status: 'Error' }, user: { text: '普通用户', status: 'Default' } },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: { active: { text: '启用', status: 'Success' }, disabled: { text: '禁用', status: 'Default' } },
    },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => {
        const isSelf = record.id === initialState?.currentUser?.id;
        return [
          <a
            key="edit"
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
          >
            编辑
          </a>,
          !isSelf && (
            <Popconfirm
              key="delete"
              title="确定删除该用户？"
              onConfirm={async () => {
                await deleteUser(record.id);
                message.success('已删除');
                actionRef.current?.reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>
          ),
        ];
      },
    },
  ];

  const isSelfEditing = !!editing && editing.id === initialState?.currentUser?.id;

  return (
    <PageContainer>
      <ProTable<User>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await listUsers(params);
          return { data: res.data.list, total: res.data.total, success: true };
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            新建用户
          </Button>,
        ]}
      />

      <ModalForm<any>
        title={editing ? '编辑用户' : '新建用户'}
        open={open}
        width={480}
        modalProps={{ destroyOnHidden: true, onCancel: () => setOpen(false) }}
        initialValues={editing ?? { role: 'user', status: 'active' }}
        onFinish={async (values) => {
          if (editing) {
            const data = { ...values };
            if (!data.password) delete data.password;
            delete data.username;
            await updateUser(editing.id, data);
            message.success('已保存');
          } else {
            await createUser(values);
            message.success('已创建');
          }
          setOpen(false);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          disabled={!!editing}
          rules={[{ required: true, message: '请输入用户名' }]}
        />
        <ProFormText name="name" label="姓名" />
        <ProFormText.Password
          name="password"
          label={editing ? '新密码（留空不修改）' : '密码'}
          rules={[
            { required: !editing, message: '请输入密码' },
            { min: 6, message: '密码至少 6 位' },
          ]}
        />
        <ProFormSelect
          name="role"
          label="角色"
          disabled={isSelfEditing}
          options={[
            { label: '普通用户', value: 'user' },
            { label: '超级管理员', value: 'admin' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          disabled={isSelfEditing}
          options={[
            { label: '启用', value: 'active' },
            { label: '禁用', value: 'disabled' },
          ]}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </PageContainer>
  );
}
