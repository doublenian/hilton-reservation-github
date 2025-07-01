import React, { useState } from 'react';
import { Table, Card, Tag, Button, Space, Select, Input, message, Modal } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { 
  GET_RESERVATIONS, 
  APPROVE_RESERVATION,
  CANCEL_RESERVATION,
  COMPLETE_RESERVATION
} from '../lib/graphql-queries';
import { Reservation, ReservationStatus, PaginationInput } from '../types';

const { Option } = Select;

// 重新定义筛选接口以匹配原有结构
interface ReservationFilter {
  status?: ReservationStatus[];
  startDate?: string;
  endDate?: string;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
}

export function ReservationsPage() {
  const [filters, setFilters] = useState<ReservationFilter>({});
  const [pagination, setPagination] = useState<PaginationInput>({ page: 1, limit: 20 });

  // 查询预订列表
  const { data, loading, refetch } = useQuery(GET_RESERVATIONS, {
    variables: { filter: filters, pagination },
    pollInterval: 30000, // 每30秒自动刷新
  });

  // GraphQL变更操作 - 使用原有的mutation
  const [approveReservation] = useMutation(APPROVE_RESERVATION, {
    onCompleted: () => {
      message.success('预订已批准');
      refetch();
    },
    onError: (error) => {
      message.error('批准预订失败：' + error.message);
    }
  });

  const [cancelReservation] = useMutation(CANCEL_RESERVATION, {
    onCompleted: () => {
      message.success('预订已取消');
      refetch();
    },
    onError: (error) => {
      message.error('取消预订失败：' + error.message);
    }
  });

  const [completeReservation] = useMutation(COMPLETE_RESERVATION, {
    onCompleted: () => {
      message.success('预订已完成');
      refetch();
    },
    onError: (error) => {
      message.error('完成预订失败：' + error.message);
    }
  });

  // 处理操作
  const handleApprove = (id: string) => {
    approveReservation({ variables: { id } });
  };

  const handleCancel = (id: string) => {
    Modal.confirm({
      title: '确认取消预订',
      content: '您确定要取消这个预订吗？',
      onOk: () => {
        cancelReservation({ variables: { id } });
      },
    });
  };

  const handleComplete = (id: string) => {
    Modal.confirm({
      title: '确认完成预订',
      content: '确认这个预订已经完成了吗？',
      onOk: () => {
        completeReservation({ variables: { id } });
      },
    });
  };

  // 筛选处理
  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 }); // 重置到第一页
  };

  const handleReset = () => {
    setFilters({});
    setPagination({ page: 1, limit: 20 });
  };

  // 状态标签配置
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'requested': { color: 'orange', text: '已请求' },
      'approved': { color: 'green', text: '已批准' },
      'cancelled': { color: 'red', text: '已取消' },
      'completed': { color: 'blue', text: '已完成' },
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '预订ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => id.substring(0, 8) + '...',
    },
    {
      title: '客户姓名',
      dataIndex: 'guestName',
      key: 'guestName',
      width: 120,
    },
    {
      title: '联系邮箱',
      dataIndex: 'guestEmail',
      key: 'guestEmail',
      width: 200,
    },
    {
      title: '联系电话',
      dataIndex: 'guestPhone',
      key: 'guestPhone',
      width: 120,
    },
    {
      title: '人数',
      dataIndex: 'tableSize',
      key: 'tableSize',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '预约时间',
      dataIndex: 'expectedArrivalTime',
      key: 'expectedArrivalTime',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right' as const,
      render: (_: unknown, record: Reservation) => (
        <Space>
          {record.status === 'requested' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.id)}
            >
              批准
            </Button>
          )}
          {(record.status === 'requested' || record.status === 'approved') && (
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancel(record.id)}
            >
              取消
            </Button>
          )}
          {record.status === 'approved' && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="预订管理" style={{ marginBottom: '24px' }}>
        {/* 筛选器 */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Select
            placeholder="选择状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => handleFilterChange('status', value ? [value] : undefined)}
          >
            <Option value="requested">已请求</Option>
            <Option value="approved">已批准</Option>
            <Option value="cancelled">已取消</Option>
            <Option value="completed">已完成</Option>
          </Select>

          <Input
            placeholder="客户邮箱"
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            onChange={(e) => handleFilterChange('guestEmail', e.target.value)}
            allowClear
          />

          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              loading={loading}
            >
              刷新
            </Button>
            <Button onClick={handleReset}>重置筛选</Button>
          </Space>
        </div>

        {/* 预订列表 */}
        <Table
          columns={columns}
          dataSource={data?.reservations?.data || []}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: data?.reservations?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ page, limit: pageSize });
            },
          }}
        />
      </Card>
    </div>
  );
} 