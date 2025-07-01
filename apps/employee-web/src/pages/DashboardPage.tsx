import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Space, message } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { GET_RESERVATION_STATS, GET_RESERVATIONS, APPROVE_RESERVATION, CANCEL_RESERVATION } from '../lib/graphql-queries';
import { Reservation } from '../types';

export function DashboardPage() {
  // 获取统计数据
  const { data: statsData, loading: statsLoading } = useQuery(GET_RESERVATION_STATS);
  
  // 获取最近的预订数据
  const { data: reservationsData, loading: reservationsLoading, refetch } = useQuery(GET_RESERVATIONS, {
    variables: {
      filter: { status: ['requested'] },
      pagination: { page: 1, limit: 10 }
    }
  });

  // 批准预订
  const [approveReservation] = useMutation(APPROVE_RESERVATION, {
    onCompleted: () => {
      message.success('预订已批准');
      refetch();
    },
    onError: (error) => {
      message.error('批准预订失败：' + error.message);
    }
  });

  // 取消预订
  const [cancelReservation] = useMutation(CANCEL_RESERVATION, {
    onCompleted: () => {
      message.success('预订已取消');
      refetch();
    },
    onError: (error) => {
      message.error('取消预订失败：' + error.message);
    }
  });

  const handleApprove = (id: string) => {
    approveReservation({ variables: { id } });
  };

  const handleCancel = (id: string) => {
    cancelReservation({ variables: { id } });
  };

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

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'guestName',
      key: 'guestName',
    },
    {
      title: '联系邮箱',
      dataIndex: 'guestEmail',
      key: 'guestEmail',
    },
    {
      title: '人数',
      dataIndex: 'tableSize',
      key: 'tableSize',
    },
    {
      title: '预约时间',
      dataIndex: 'expectedArrivalTime',
      key: 'expectedArrivalTime',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Reservation) => (
        <Space>
          {record.status === 'requested' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                批准
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record.id)}
              >
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const stats = statsData?.reservationStats;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>仪表板</h1>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总预订数"
              value={stats?.total || 0}
              prefix={<CalendarOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats?.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已确认"
              value={stats?.confirmed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日预订"
              value={stats?.todayReservations || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 待处理预订列表 */}
      <Card title="待处理预订" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={reservationsData?.reservations?.data || []}
          rowKey="id"
          loading={reservationsLoading}
          pagination={{
            total: reservationsData?.reservations?.total || 0,
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
} 