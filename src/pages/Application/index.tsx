import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { App, Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import { APP_TYPE_ENUM, APP_TYPE_OPTIONS } from '@/constants';
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
  userOptions,
  type Application,
} from '@/services/api';

export default function ApplicationPage() {
  const actionRef = useRef<ActionType>();
  const { isAdmin } = useAccess();
  const { message } = App.useApp();
  const [editing, setEditing] = useState<Application | null>(null);
  const [open, setOpen] = useState(false);

  const loadUserOptions = async () => (await userOptions()).data;

  const columns: ProColumns<Application>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, r) => <a onClick={() => history.push(`/applications/${r.id}`)}>{r.name}</a>,
    },
    { title: '平台', dataIndex: 'type', valueEnum: APP_TYPE_ENUM },
    { title: 'app_id', dataIndex: 'app_id', copyable: true },
    {
      title: '所属用户',
      dataIndex: 'user_id',
      hideInSearch: !isAdmin,
      hideInTable: !isAdmin,
      valueType: 'select',
      request: isAdmin ? loadUserOptions : undefined,
      fieldProps: { showSearch: true },
      render: (_, r) => (r.user ? r.user.name || r.user.username : '-'),
    },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="data" onClick={() => history.push(`/applications/${record.id}`)}>
          点击数据
        </a>,
        isAdmin && (
          <a
            key="edit"
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
          >
            编辑
          </a>
        ),
        isAdmin && (
          <Popconfirm
            key="delete"
            title="删除后该 Application 下的点击数据也会一并删除，确定？"
            onConfirm={async () => {
              await deleteApplication(record.id);
              message.success('已删除');
              actionRef.current?.reload();
            }}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        ),
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<Application>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await listApplications(params);
          return { data: res.data.list, total: res.data.total, success: true };
        }}
        toolBarRender={() =>
          isAdmin
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  新建 Application
                </Button>,
              ]
            : []
        }
      />

      {isAdmin && (
        <ModalForm<Partial<Application>>
          title={editing ? '编辑 Application' : '新建 Application'}
          open={open}
          width={520}
          modalProps={{ destroyOnHidden: true, onCancel: () => setOpen(false) }}
          initialValues={editing ?? { type: 1 }}
          onFinish={async (values) => {
            if (editing) {
              await updateApplication(editing.id, values);
              message.success('已保存');
            } else {
              await createApplication(values);
              message.success('已创建');
            }
            setOpen(false);
            actionRef.current?.reload();
            return true;
          }}
        >
          <ProFormText name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]} />
          <ProFormSelect
            name="type"
            label="平台类型"
            options={APP_TYPE_OPTIONS}
            rules={[{ required: true, message: '请选择平台' }]}
          />
          <ProFormText name="app_id" label="app_id" rules={[{ required: true, message: '请输入 app_id' }]} />
          <ProFormSelect
            name="user_id"
            label="分配给用户"
            showSearch
            request={loadUserOptions}
            rules={[{ required: true, message: '请选择所属用户' }]}
          />
          <ProFormTextArea name="remark" label="备注" />
        </ModalForm>
      )}
    </PageContainer>
  );
}
