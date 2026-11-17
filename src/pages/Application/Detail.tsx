import { ImportOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProDescriptions,
  ProFormDigit,
  ProFormTextArea,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import { App, Button, Popconfirm, Result, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { APP_TYPE_ENUM } from '@/constants';
import {
  deleteInteractionData,
  getApplication,
  importInteractionData,
  listInteractionData,
  updateInteractionData,
  type Application,
  type InteractionData,
  type InteractionSummary,
} from '@/services/api';

const IMPORT_PLACEHOLDER = `支持粘贴上游接口原始返回，或 items 数组，例如：
{
  "result": 1,
  "error_msg": "",
  "data": {
    "items": [
      {
        "type": 0,
        "date": "2024-01-07",
        "queryCnt": 2,
        "impression": 0,
        "impressionRadio": 0.0,
        "click": 0,
        "clickRadio": 0.0,
        "ecpm": 0.0,
        "costTotal": 0.07
      }
    ]
  }
}
同一 type + date 已存在时会覆盖更新。`;

const num = (v?: number, digits = 0) =>
  v === undefined || v === null ? '-' : Number(v).toLocaleString('zh-CN', { maximumFractionDigits: digits });

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAccess();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [app, setApp] = useState<Application>();
  const [loadError, setLoadError] = useState(false);
  const [summary, setSummary] = useState<InteractionSummary>();
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<InteractionData | null>(null);

  useEffect(() => {
    if (!id) return;
    getApplication(id)
      .then((res) => setApp(res.data))
      .catch(() => setLoadError(true));
  }, [id]);

  if (loadError) {
    return (
      <PageContainer>
        <Result
          status="404"
          title="Application 不存在或无权访问"
          extra={<Button onClick={() => history.push('/applications')}>返回列表</Button>}
        />
      </PageContainer>
    );
  }
  if (!app) return <Spin style={{ display: 'block', marginTop: 120 }} />;

  const columns: ProColumns<InteractionData>[] = [
    {
      title: '日期范围',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: { transform: (v: [string, string]) => ({ startDate: v[0], endDate: v[1] }) },
    },
    { title: '日期', dataIndex: 'date', search: false },
    { title: 'type', dataIndex: 'type', valueType: 'digit' },
    { title: '拉取量', dataIndex: 'queryCnt', search: false, render: (_, r) => num(r.queryCnt) },
    { title: '曝光量', dataIndex: 'impression', search: false, render: (_, r) => num(r.impression) },
    { title: '曝光率', dataIndex: 'impressionRadio', search: false, render: (_, r) => num(r.impressionRadio, 4) },
    { title: '点击次数', dataIndex: 'click', search: false, render: (_, r) => num(r.click) },
    { title: '点击率', dataIndex: 'clickRadio', search: false, render: (_, r) => num(r.clickRadio, 4) },
    { title: '千次收入(ecpm)', dataIndex: 'ecpm', search: false, render: (_, r) => num(r.ecpm, 2) },
    { title: '收入', dataIndex: 'costTotal', search: false, render: (_, r) => num(r.costTotal, 2) },
  ];
  if (isAdmin) {
    columns.push({
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => setEditing(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除这条数据？"
          onConfirm={async () => {
            await deleteInteractionData(record.id);
            message.success('已删除');
            actionRef.current?.reload();
          }}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    });
  }

  return (
    <PageContainer
      title={app.name}
      onBack={() => history.push('/applications')}
      content={
        <ProDescriptions column={4} dataSource={app}>
          <ProDescriptions.Item label="平台" dataIndex="type" valueEnum={APP_TYPE_ENUM} />
          <ProDescriptions.Item label="app_id" dataIndex="app_id" copyable />
          <ProDescriptions.Item label="所属用户">
            {app.user ? `${app.user.name || app.user.username} (${app.user.username})` : '-'}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="备注" dataIndex="remark" />
        </ProDescriptions>
      }
    >
      <StatisticCard.Group direction="row" style={{ marginBottom: 16 }}>
        <StatisticCard statistic={{ title: '总拉取量', value: num(summary?.queryCnt) }} />
        <ProCard.Divider type="vertical" />
        <StatisticCard statistic={{ title: '总曝光量', value: num(summary?.impression) }} />
        <ProCard.Divider type="vertical" />
        <StatisticCard statistic={{ title: '总点击次数', value: num(summary?.click) }} />
        <ProCard.Divider type="vertical" />
        <StatisticCard statistic={{ title: '总收入', value: num(summary?.costTotal, 2) }} />
        <ProCard.Divider type="vertical" />
        <StatisticCard
          statistic={{
            title: '平均 ecpm',
            value: num(summary?.ecpm, 2),
            description: `曝光率 ${num(summary?.impressionRadio, 4)} / 点击率 ${num(summary?.clickRadio, 4)}`,
          }}
        />
      </StatisticCard.Group>

      <ProTable<InteractionData>
        headerTitle="点击数据（interaction_data）"
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        pagination={{ defaultPageSize: 20 }}
        request={async (params) => {
          const res = await listInteractionData(app.id, params);
          setSummary(res.data.summary);
          return { data: res.data.items, total: res.data.total, success: true };
        }}
        toolBarRender={() =>
          isAdmin
            ? [
                <Button key="import" type="primary" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
                  导入数据
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<{ json: string }>
        title="导入点击数据"
        open={importOpen}
        width={640}
        modalProps={{ destroyOnHidden: true, onCancel: () => setImportOpen(false) }}
        onFinish={async ({ json }) => {
          let body: unknown;
          try {
            body = JSON.parse(json);
          } catch {
            message.error('JSON 格式错误');
            return false;
          }
          const res = await importInteractionData(app.id, body);
          message.success(`导入完成：共 ${res.data.total} 条，新增 ${res.data.inserted}，更新 ${res.data.updated}`);
          setImportOpen(false);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormTextArea
          name="json"
          fieldProps={{ rows: 16, style: { fontFamily: 'monospace' } }}
          placeholder={IMPORT_PLACEHOLDER}
          rules={[{ required: true, message: '请粘贴 JSON 数据' }]}
        />
      </ModalForm>

      <ModalForm<Partial<InteractionData>>
        title={editing ? `编辑 ${editing.date}（type ${editing.type}）` : ''}
        open={!!editing}
        width={520}
        initialValues={editing ?? undefined}
        modalProps={{ destroyOnHidden: true, onCancel: () => setEditing(null) }}
        onFinish={async (values) => {
          await updateInteractionData(editing!.id, values);
          message.success('已保存');
          setEditing(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormDigit name="queryCnt" label="拉取量" min={0} fieldProps={{ precision: 0 }} />
        <ProFormDigit name="impression" label="曝光量" min={0} fieldProps={{ precision: 0 }} />
        <ProFormDigit name="impressionRadio" label="曝光率" fieldProps={{ precision: 4 }} />
        <ProFormDigit name="click" label="点击次数" min={0} fieldProps={{ precision: 0 }} />
        <ProFormDigit name="clickRadio" label="点击率" fieldProps={{ precision: 4 }} />
        <ProFormDigit name="ecpm" label="千次收入(ecpm)" fieldProps={{ precision: 2 }} />
        <ProFormDigit name="costTotal" label="收入" fieldProps={{ precision: 2 }} />
      </ModalForm>
    </PageContainer>
  );
}
