import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Card, 
  Button, 
  Badge, 
  Empty, 
  Selector, 
  Space, 
  Loading,
  ErrorBlock,
  Input,
  Form,
  DatePicker,
  TextArea
} from 'antd-mobile';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  TeamOutlined, 
  PhoneOutlined, 
  MailOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';

import { GET_RESERVATIONS_BY_EMAIL, CANCEL_RESERVATION, UPDATE_RESERVATION } from '../graphql/queries';
import type { Reservation } from '../types';
import { ReservationStatus } from '../types';

interface ReservationListProps {
  refreshTrigger?: number;
}

// 改进的Toast替代函数
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const toastDiv = document.createElement('div');
  toastDiv.textContent = message;
  
  const backgroundColor = {
    success: 'linear-gradient(135deg, #52c41a, #73d13d)',
    error: 'linear-gradient(135deg, #ff4d4f, #ff7875)', 
    info: 'linear-gradient(135deg, #1890ff, #40a9ff)'
  }[type];
  
  toastDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: ${backgroundColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    max-width: 80%;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    opacity: 0;
  `;
  
  document.body.appendChild(toastDiv);
  
  // 动画进入
  setTimeout(() => {
    toastDiv.style.transform = 'translateX(-50%) translateY(0)';
    toastDiv.style.opacity = '1';
  }, 10);
  
  // 3秒后动画退出并移除
  setTimeout(() => {
    toastDiv.style.transform = 'translateX(-50%) translateY(-100px)';
    toastDiv.style.opacity = '0';
    
    setTimeout(() => {
      if (document.body.contains(toastDiv)) {
        document.body.removeChild(toastDiv);
      }
    }, 300);
  }, 3000);
};

export function ReservationList({ refreshTrigger }: ReservationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [email, setEmail] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [editData, setEditData] = useState<any>(null);
  
  // 在组件挂载时检查localStorage中是否有保存的邮箱
  useEffect(() => {
    if (isInitialLoad) {
      const savedEmail = localStorage.getItem('hilton-guest-email');
      if (savedEmail) {
        setEmail(savedEmail);
        setHasSearched(true);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);
  
  const { data, loading, error, refetch } = useQuery(GET_RESERVATIONS_BY_EMAIL, {
    variables: { email },
    skip: !email || !hasSearched, // 只有输入邮箱并点击搜索后才执行查询
    fetchPolicy: 'cache-and-network',
  });

  const [cancelReservation, { loading: cancelLoading }] = useMutation(CANCEL_RESERVATION, {
    onCompleted: () => {
      showToast('预订已成功取消', 'success');
      refetch();
    },
    onError: (error) => {
      showToast('取消预订失败，请重试', 'error');
      console.error('取消预定失败:', error);
    }
  });

  const [updateReservation, { loading: updateLoading }] = useMutation(UPDATE_RESERVATION, {
    onCompleted: () => {
      showToast('预订已成功更新', 'success');
      refetch();
    },
    onError: (error) => {
      showToast('更新预订失败，请重试', 'error');
      console.error('更新预订失败:', error);
    }
  });

  useEffect(() => {
    if (refreshTrigger && hasSearched) {
      refetch();
    }
  }, [refreshTrigger, refetch, hasSearched]);

  const handleSearch = () => {
    if (!email) {
      showToast('请输入邮箱地址', 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('请输入有效的邮箱地址', 'error');
      return;
    }
    
    // 保存邮箱到localStorage
    localStorage.setItem('hilton-guest-email', email);
    
    setHasSearched(true);
    refetch();
  };

  const resetSearch = () => {
    setHasSearched(false);
    setEmail('');
    // 不清除localStorage，保留最后一次使用的邮箱
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingId(reservation.id!);
    setEditData({
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      expectedArrivalTime: new Date(reservation.expectedArrivalTime),
      tableSize: reservation.tableSize,
      notes: reservation.notes || ''
    });
    editForm.setFieldsValue({
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      expectedArrivalTime: new Date(reservation.expectedArrivalTime),
      tableSize: reservation.tableSize,
      notes: reservation.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
    editForm.resetFields();
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      const reservation = filteredReservations.find((r: Reservation) => r.id === editingId);
      
      let updateInput: any;
      
      if (reservation?.status === ReservationStatus.APPROVED) {
        // 已确认的预订只允许更新特殊要求
        updateInput = {
          notes: values.notes
        };
      } else {
        // 等待确认的预订可以更新所有字段
        updateInput = {
          guestName: values.guestName,
          guestPhone: values.guestPhone,
          expectedArrivalTime: values.expectedArrivalTime.toISOString(),
          tableSize: values.tableSize,
          notes: values.notes
        };
      }
      
      await updateReservation({
        variables: {
          id: editingId,
          input: updateInput
        }
      });
      
      setEditingId(null);
      setEditData(null);
      editForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) {
        showToast('请检查表单信息', 'error');
      }
      // Other errors handled by mutation onError
    }
  };

  const handleDelete = (id: string, guestName: string) => {
    // 使用原生确认对话框，确保可靠性
    if (window.confirm(`确定要取消 ${guestName} 的预订吗？\n\n此操作无法撤销，预订状态将变为"已取消"。`)) {
      cancelReservation({ variables: { id } });
    }
  };

  const handleRefresh = async () => {
    if (hasSearched && email) {
      await refetch();
      showToast('预订列表已刷新', 'success');
    }
  };

  const getStatusConfig = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.REQUESTED:
        return {
          color: 'warning' as const,
          text: '等待确认',
          icon: ExclamationCircleOutlined,
          bgColor: '#fff7e6',
          textColor: '#fa8c16'
        };
      case ReservationStatus.APPROVED:
        return {
          color: 'success' as const,
          text: '已确认',
          icon: CheckCircleOutlined,
          bgColor: '#f6ffed',
          textColor: '#52c41a'
        };
      case ReservationStatus.CANCELLED:
        return {
          color: 'danger' as const,
          text: '已取消',
          icon: CloseCircleOutlined,
          bgColor: '#fff1f0',
          textColor: '#ff4d4f'
        };
      case ReservationStatus.COMPLETED:
        return {
          color: 'primary' as const,
          text: '已完成',
          icon: StarOutlined,
          bgColor: '#f0f7ff',
          textColor: '#1890ff'
        };
      default:
        return {
          color: 'default' as const,
          text: status,
          icon: ExclamationCircleOutlined,
          bgColor: '#f5f5f5',
          textColor: '#666'
        };
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    };
  };

  const isUpcoming = (dateTimeString: string) => {
    return new Date(dateTimeString) > new Date();
  };

  const filterOptions = [
    { label: '全部状态', value: 'all' },
    { label: '等待确认', value: ReservationStatus.REQUESTED },
    { label: '已确认', value: ReservationStatus.APPROVED },
    { label: '已完成', value: ReservationStatus.COMPLETED },
    { label: '已取消', value: ReservationStatus.CANCELLED },
  ];

  // 如果还没有搜索，显示搜索界面
  if (!hasSearched) {
    const savedEmail = localStorage.getItem('hilton-guest-email');
    
    return (
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 'bold' }}>查看我的预订</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.4 }}>
              {savedEmail 
                ? '使用之前保存的邮箱，或输入新的邮箱地址'
                : '请输入您预订时使用的邮箱地址'
              }
            </p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder={savedEmail ? `上次使用: ${savedEmail}` : "请输入邮箱地址"}
              value={email}
              onChange={setEmail}
              clearable
              style={{ '--font-size': '16px' } as React.CSSProperties}
            />
          </div>
          
          {savedEmail && !email && (
            <Button
              block
              color="primary"
              size="large"
              onClick={() => {
                setEmail(savedEmail);
                localStorage.setItem('hilton-guest-email', savedEmail);
                setHasSearched(true);
                refetch();
              }}
              className="hilton-btn-primary"
              style={{ marginBottom: 12 }}
            >
              使用上次邮箱: {savedEmail}
            </Button>
          )}
          
          <Button
            block
            color="primary"
            size="large"
            onClick={handleSearch}
            disabled={!email}
            className="hilton-btn-primary"
          >
            <SearchOutlined style={{ marginRight: 8 }} />
            查找我的预订
          </Button>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)' }}>
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--hilton-primary)', marginBottom: 8 }} />
            <h4 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--hilton-text)' }}>
              隐私保护
            </h4>
            <Space direction="vertical" style={{ '--gap': '4px' } as React.CSSProperties}>
              <div style={{ fontSize: 13, color: 'var(--hilton-text-light)' }}>✓ 只能查看自己邮箱的预订</div>
              <div style={{ fontSize: 13, color: 'var(--hilton-text-light)' }}>✓ 数据安全加密传输</div>
              <div style={{ fontSize: 13, color: 'var(--hilton-text-light)' }}>✓ 严格保护个人隐私</div>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <Loading />
        <p style={{ marginTop: 16, color: '#666' }}>正在查找预订...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBlock
        status="default"
        title="查找失败"
        description="无法查找预订信息，请检查邮箱地址或网络连接"
        style={{ margin: '40px 16px' }}
      >
        <Space>
          <Button color="primary" onClick={resetSearch}>
            重新输入邮箱
          </Button>
          <Button onClick={handleRefresh}>
            重试
          </Button>
        </Space>
      </ErrorBlock>
    );
  }

  const reservations = data?.getReservationsByEmail || [];

  // 过滤预订
  const filteredReservations = reservations.filter((reservation: Reservation) => {
    if (statusFilter === 'all') return true;
    return reservation.status === statusFilter;
  });

  if (filteredReservations.length === 0) {
    return (
      <div>
        {/* 搜索信息和重新搜索按钮 */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>预订列表</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>邮箱: {email}</p>
            </div>
            <Space>
              <Button size="small" onClick={resetSearch}>
                换邮箱
              </Button>
              <Button size="small" onClick={handleRefresh}>
                <ReloadOutlined />
              </Button>
            </Space>
          </div>
          <Selector
            options={filterOptions}
            value={[statusFilter]}
            onChange={(value) => setStatusFilter(value[0])}
          />
        </Card>

        <Empty
          description={
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>暂无预订记录</h3>
              <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                {statusFilter === 'all' 
                  ? '该邮箱下没有找到任何预订记录'
                  : '当前筛选条件下没有找到预订记录'
                }
              </p>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* Filter Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>我的预订 ({filteredReservations.length})</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>邮箱: {email}</p>
          </div>
          <Space>
            <Button size="small" onClick={resetSearch}>
              换邮箱
            </Button>
            <Button size="small" onClick={handleRefresh}>
              <ReloadOutlined />
            </Button>
          </Space>
        </div>
        <Selector
          options={filterOptions}
          value={[statusFilter]}
          onChange={(value) => setStatusFilter(value[0])}
        />
      </Card>

      {/* Reservations List */}
      <div style={{ marginBottom: 16 }}>
        {filteredReservations.map((reservation: Reservation) => {
          const statusConfig = getStatusConfig(reservation.status);
          const dateTime = formatDateTime(reservation.expectedArrivalTime);
          const upcoming = isUpcoming(reservation.expectedArrivalTime);
          const StatusIcon = statusConfig.icon;

          return (
            <Card 
              key={reservation.id} 
              style={{ 
                marginBottom: 16,
                border: upcoming && reservation.status === ReservationStatus.APPROVED 
                  ? '2px solid var(--hilton-primary)' 
                  : undefined,
                opacity: reservation.status === ReservationStatus.CANCELLED ? 0.7 : 1,
                background: reservation.status === ReservationStatus.CANCELLED ? '#fafafa' : undefined
              }}
            >
              {editingId === reservation.id ? (
                // 编辑模式
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottom: '1px solid #eee'
                  }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>
                      编辑预订
                    </h4>
                    <Badge color={statusConfig.color} content={statusConfig.text} />
                  </div>

                  <Form 
                    form={editForm}
                    layout="vertical"
                    style={{ '--border-inner': '#eee' } as React.CSSProperties}
                  >
                    <Form.Item
                      name="guestName"
                      label="姓名"
                      rules={[
                        { required: true, message: '请输入姓名' },
                        { min: 2, message: '姓名至少需要2个字符' }
                      ]}
                    >
                      <Input 
                        placeholder="请输入姓名" 
                        disabled={reservation.status === ReservationStatus.APPROVED}
                      />
                    </Form.Item>

                    <Form.Item
                      name="guestPhone"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                      ]}
                    >
                      <Input 
                        placeholder="请输入手机号" 
                        type="tel" 
                        disabled={reservation.status === ReservationStatus.APPROVED}
                      />
                    </Form.Item>

                    <Form.Item
                      name="expectedArrivalTime"
                      label="预订时间"
                      rules={[{ required: true, message: '请选择预订时间' }]}
                    >
                      {reservation.status === ReservationStatus.APPROVED ? (
                        <div style={{ 
                          padding: '12px 16px', 
                          border: '1px solid #ddd', 
                          borderRadius: 8,
                          background: '#f5f5f5',
                          color: '#666'
                        }}>
                          <CalendarOutlined style={{ marginRight: 8 }} />
                          {formatDateTime(reservation.expectedArrivalTime).date} {formatDateTime(reservation.expectedArrivalTime).time}
                        </div>
                      ) : (
                        <DatePicker
                          min={new Date(Date.now() + 60 * 60 * 1000)}
                          precision="minute"
                          title="选择预订时间"
                          confirmText="确认"
                          cancelText="取消"
                          value={editData?.expectedArrivalTime}
                          onConfirm={(date) => {
                            console.log('DatePicker onConfirm:', date);
                            setEditData({...editData, expectedArrivalTime: date});
                            editForm.setFieldsValue({ expectedArrivalTime: date });
                          }}
                          onCancel={() => {
                            console.log('DatePicker onCancel');
                          }}
                        >
                          {(value: Date | null, actions: { open: () => void }) => (
                            <div 
                              style={{ 
                                padding: '12px 16px', 
                                border: '1px solid #ddd', 
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                background: '#fff',
                                color: value ? '#333' : '#999',
                                cursor: 'pointer'
                              }}
                              onClick={actions.open}
                            >
                              <CalendarOutlined style={{ marginRight: 8 }} />
                              {value ? value.toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '请选择预订时间'}
                            </div>
                          )}
                        </DatePicker>
                      )}
                    </Form.Item>

                    <Form.Item
                      name="tableSize"
                      label="用餐人数"
                      rules={[{ required: true, message: '请选择用餐人数' }]}
                    >
                      {reservation.status === ReservationStatus.APPROVED ? (
                        <div style={{ 
                          padding: '12px 16px', 
                          border: '1px solid #ddd', 
                          borderRadius: 8,
                          background: '#f5f5f5',
                          color: '#666'
                        }}>
                          <TeamOutlined style={{ marginRight: 8 }} />
                          {reservation.tableSize} 人 (已确认，无法修改)
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gap: '8px',
                          marginTop: 8
                        }}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                            <div
                              key={size}
                              style={{
                                padding: '8px',
                                textAlign: 'center',
                                border: editData?.tableSize === size ? '2px solid var(--hilton-primary)' : '1px solid #ddd',
                                borderRadius: '8px',
                                background: editData?.tableSize === size ? 'var(--hilton-primary)' : '#fff',
                                color: editData?.tableSize === size ? 'white' : '#333',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                              onClick={() => {
                                setEditData({...editData, tableSize: size});
                                editForm.setFieldsValue({ tableSize: size });
                              }}
                            >
                              {size} 人
                            </div>
                          ))}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item
                      name="notes"
                      label="特殊要求 (可选)"
                    >
                      <TextArea
                        placeholder="如有特殊饮食要求、座位偏好或其他需求，请在此说明"
                        rows={3}
                      />
                    </Form.Item>
                  </Form>

                  <Space style={{ width: '100%', marginTop: 16 }}>
                    <Button
                      color="primary"
                      loading={updateLoading}
                      onClick={handleSaveEdit}
                    >
                      <SaveOutlined /> 保存
                    </Button>
                    <Button
                      color="default"
                      onClick={handleCancelEdit}
                    >
                      <CloseOutlined /> 取消
                    </Button>
                  </Space>
                </div>
              ) : (
                // 正常显示模式
                <div>
                  {/* Card Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {/* Status Icon & Text */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: statusConfig.bgColor,
                        padding: '8px 12px',
                        borderRadius: 20,
                        marginRight: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        flexShrink: 0,
                        border: `1px solid ${statusConfig.textColor}20`
                      }}>
                        <StatusIcon style={{ 
                          fontSize: 16, 
                          color: statusConfig.textColor,
                          marginRight: 6
                        }} />
                        <span style={{
                          fontSize: 13,
                          color: statusConfig.textColor,
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {statusConfig.text}
                        </span>
                      </div>
                      
                      {/* Guest Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: 16, 
                          fontWeight: 'bold',
                          color: '#333',
                          lineHeight: 1.3
                        }}>
                          {reservation.guestName}
                        </h4>
                        <p style={{ 
                          margin: '2px 0 0 0', 
                          fontSize: 12, 
                          color: '#999',
                          lineHeight: 1.3
                        }}>
                          预订编号: {reservation.id?.slice(-8)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Upcoming Badge */}
                    {upcoming && reservation.status === ReservationStatus.APPROVED && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--hilton-primary)',
                        padding: '6px 10px',
                        borderRadius: 16,
                        flexShrink: 0,
                        marginLeft: 8
                      }}>
                        <ClockCircleOutlined style={{ 
                          fontSize: 12, 
                          color: 'white',
                          marginRight: 4
                        }} />
                        <span style={{
                          fontSize: 12,
                          color: 'white',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          即将到达
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date Time Section */}
                  <div style={{
                    background: upcoming ? 'var(--hilton-bg)' : '#f9f9f9',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    border: upcoming ? '1px solid var(--hilton-primary-light)' : '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: upcoming ? 'var(--hilton-primary)' : '#ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <CalendarOutlined style={{ 
                          color: upcoming ? 'white' : '#666', 
                          fontSize: 16
                        }} />
                      </div>
                      <span style={{ 
                        fontSize: 15, 
                        fontWeight: 600,
                        color: upcoming ? 'var(--hilton-primary)' : '#333'
                      }}>
                        {dateTime.date}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: upcoming ? 'var(--hilton-primary)' : '#ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12
                        }}>
                          <ClockCircleOutlined style={{ 
                            color: upcoming ? 'white' : '#666', 
                            fontSize: 16
                          }} />
                        </div>
                        <span style={{ 
                          fontSize: 15, 
                          fontWeight: 600,
                          color: upcoming ? 'var(--hilton-primary)' : '#333'
                        }}>
                          {dateTime.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ 
                    marginBottom: 16,
                    background: '#fafafa',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#e6f7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <TeamOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                      </div>
                      <span style={{ fontSize: 14, color: '#666', marginRight: 12, minWidth: 80 }}>用餐人数:</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{reservation.tableSize} 人</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#f6ffed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <PhoneOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                      </div>
                      <span style={{ fontSize: 14, color: '#666', marginRight: 12, minWidth: 80 }}>联系电话:</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{reservation.guestPhone}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#fff7e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <MailOutlined style={{ color: '#fa8c16', fontSize: 14 }} />
                      </div>
                      <span style={{ fontSize: 14, color: '#666', marginRight: 12, minWidth: 80 }}>邮箱地址:</span>
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#333',
                        wordBreak: 'break-all',
                        lineHeight: 1.4
                      }}>
                        {reservation.guestEmail}
                      </span>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {reservation.notes && (
                    <div style={{
                      background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)',
                      border: '1px solid #ffe58f',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#fa8c16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          flexShrink: 0,
                          marginTop: 2
                        }}>
                          <MessageOutlined style={{ color: 'white', fontSize: 16 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontSize: 14, 
                            fontWeight: 600, 
                            margin: '0 0 6px 0', 
                            color: '#fa8c16',
                            lineHeight: 1.4
                          }}>
                            特殊要求
                          </p>
                          <p style={{ 
                            fontSize: 13, 
                            margin: 0, 
                            color: '#666', 
                            lineHeight: 1.5,
                            wordBreak: 'break-word'
                          }}>
                            {reservation.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Message */}
                  <div style={{ marginBottom: 12 }}>
                    {reservation.status === ReservationStatus.REQUESTED && (
                      <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                        等待餐厅确认中，请耐心等待
                      </p>
                    )}
                    {reservation.status === ReservationStatus.APPROVED && upcoming && (
                      <p style={{ fontSize: 13, color: 'var(--hilton-success)', margin: 0, fontWeight: 500 }}>
                        预订已确认，期待您的到来！
                      </p>
                    )}
                    {reservation.status === ReservationStatus.APPROVED && !upcoming && (
                      <p style={{ fontSize: 13, color: '#666', margin: 0 }}>预订已确认</p>
                    )}
                    {reservation.status === ReservationStatus.COMPLETED && (
                      <p style={{ fontSize: 13, color: 'var(--hilton-primary)', margin: 0 }}>
                        感谢您选择希尔顿餐厅
                      </p>
                    )}
                    {reservation.status === ReservationStatus.CANCELLED && (
                      <div style={{ 
                        background: '#fff1f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 6,
                        padding: 8,
                        marginBottom: 8
                      }}>
                        <p style={{ fontSize: 13, color: '#ff4d4f', margin: 0, fontWeight: 500 }}>
                          此预订已取消
                        </p>
                        <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0 0' }}>
                          如需重新预订，请返回预订页面重新提交
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {(reservation.status === ReservationStatus.REQUESTED || reservation.status === ReservationStatus.APPROVED) && (
                    <div style={{ 
                      display: 'flex', 
                      gap: 12, 
                      marginBottom: 12,
                      flexWrap: 'wrap'
                    }}>
                      {reservation.status === ReservationStatus.REQUESTED && (
                        <Button
                          color="primary"
                          fill="outline"
                          style={{
                            flex: 1,
                            minWidth: 120,
                            height: 40,
                            borderRadius: 8,
                            fontWeight: 500
                          }}
                          onClick={() => {
                            console.log('Edit button clicked for REQUESTED reservation:', reservation.id, reservation.status);
                            handleEdit(reservation);
                          }}
                        >
                          <EditOutlined /> 修改预订
                        </Button>
                      )}
                      {reservation.status === ReservationStatus.APPROVED && (
                        <Button
                          color="primary"
                          fill="outline"
                          style={{
                            flex: 1,
                            minWidth: 120,
                            height: 40,
                            borderRadius: 8,
                            fontWeight: 500
                          }}
                          onClick={() => {
                            console.log('Edit button clicked for APPROVED reservation:', reservation.id, reservation.status);
                            handleEdit(reservation);
                          }}
                        >
                          <EditOutlined /> 编辑备注
                        </Button>
                      )}
                      <Button
                        color="danger"
                        fill="outline"
                        loading={cancelLoading}
                        style={{
                          flex: 1,
                          minWidth: 120,
                          height: 40,
                          borderRadius: 8,
                          fontWeight: 500
                        }}
                        onClick={() => handleDelete(reservation.id!, reservation.guestName)}
                      >
                        <DeleteOutlined /> 取消预订
                      </Button>
                    </div>
                  )}

                  {reservation.status === ReservationStatus.APPROVED && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)',
                      borderRadius: 8,
                      padding: 12,
                      textAlign: 'center',
                      marginTop: 8,
                      border: '1px solid #d6e4ff'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        <PhoneOutlined style={{ color: 'var(--hilton-primary)', fontSize: 14, marginRight: 6 }} />
                        <span style={{ fontSize: 12, color: 'var(--hilton-primary)', fontWeight: 600 }}>
                          如需修改请致电
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--hilton-primary)', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
                        +86 21 1234-5678
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Contact Info Footer */}
      <Card style={{ 
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)',
        marginBottom: 16
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 12px 0', color: 'var(--hilton-text)' }}>
          需要帮助？
        </h4>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PhoneOutlined style={{ color: 'var(--hilton-primary)', marginRight: 8 }} />
            <span style={{ fontSize: 14, color: 'var(--hilton-text)' }}>
              预订热线: +86 21 1234-5678
            </span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MailOutlined style={{ color: 'var(--hilton-primary)', marginRight: 8 }} />
            <span style={{ fontSize: 14, color: 'var(--hilton-text)' }}>
              客服邮箱: service@hilton.com
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
} 