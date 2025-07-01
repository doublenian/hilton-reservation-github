import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  DatePicker, 
  TextArea,
  Image,
  Space,
  Steps
} from 'antd-mobile';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import { CREATE_RESERVATION } from '../graphql/queries';
import type { Reservation } from '../types';

interface ReservationFormProps {
  onSuccess?: (reservation: Reservation) => void;
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

export function ReservationForm({ onSuccess }: ReservationFormProps) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTableSize, setSelectedTableSize] = useState<number | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [createReservation, { loading }] = useMutation(CREATE_RESERVATION);
  
  // 保存各步骤的数据
  const [step1Data, setStep1Data] = useState<{
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }>({});
  
  const [step2Data, setStep2Data] = useState<{
    expectedArrivalTime?: Date;
    tableSize?: number;
    specialRequests?: string;
  }>({});

  const tableSizeOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1} 人`,
    value: i + 1,
  }));

  // 当步骤改变时恢复对应的数据
  useEffect(() => {
    if (currentStep === 0) {
      // 恢复第一步数据
      form.setFieldsValue(step1Data);
    } else if (currentStep === 1) {
      // 恢复第二步数据
      form.setFieldsValue(step2Data);
      if (step2Data.expectedArrivalTime) {
        setSelectedDateTime(step2Data.expectedArrivalTime);
      }
      if (step2Data.tableSize) {
        setSelectedTableSize(step2Data.tableSize);
      }
    }
  }, [currentStep, form, step1Data, step2Data]);

  const onFinish = async (values: any) => {
    try {
      // 合并所有步骤的数据
      const allData = {
        ...step1Data,
        ...step2Data,
        ...values
      };
      
      console.log('=======allValues======')
      console.log(allData);
      
      // 检查必需字段是否存在
      if (!allData.guestName || !allData.guestEmail || !allData.guestPhone) {
        showToast('请完善个人信息', 'error');
        setCurrentStep(0); // 返回第一步
        return;
      }
      
      if (!allData.expectedArrivalTime || (!selectedTableSize && !allData.tableSize)) {
        showToast('请完善预订信息', 'error');
        return;
      }
      
      const { data: result } = await createReservation({
        variables: {
          input: {
            guestName: allData.guestName,
            guestEmail: allData.guestEmail,
            guestPhone: allData.guestPhone,
            expectedArrivalTime: allData.expectedArrivalTime.toISOString(),
            tableSize: selectedTableSize || allData.tableSize,
            notes: allData.specialRequests || '',
          },
        },
      });

      if (result?.createReservation) {
        // 保存邮箱到localStorage，用于后续查看预订
        localStorage.setItem('hilton-guest-email', allData.guestEmail);
        
        showToast('预订成功！我们会尽快确认您的预订。', 'success');
        form.resetFields();
        setCurrentStep(0);
        setSelectedTableSize(null);
        setSelectedDateTime(null);
        setStep1Data({});
        setStep2Data({});
        onSuccess?.(result.createReservation);
      }
    } catch (error) {
      console.error('预定失败:', error);
      showToast('预订失败，请检查信息后重试', 'error');
    }
  };

  const nextStep = () => {
    // 验证第一步的必填字段
    form.validateFields(['guestName', 'guestPhone', 'guestEmail']).then(() => {
      // 保存第一步的数据
      const currentData = form.getFieldsValue(['guestName', 'guestPhone', 'guestEmail']);
      setStep1Data(currentData);
      console.log('保存第一步数据:', currentData);
      setCurrentStep(1);
    }).catch(() => {
      showToast('请完善必填信息', 'error');
    });
  };

  const handleSubmit = () => {
    // 验证第二步的必填字段
    form.validateFields(['expectedArrivalTime', 'tableSize']).then(() => {
      // 保存第二步的数据
      const currentData = form.getFieldsValue(['expectedArrivalTime', 'tableSize', 'specialRequests']);
      setStep2Data({
        ...currentData,
        expectedArrivalTime: selectedDateTime || currentData.expectedArrivalTime,
        tableSize: selectedTableSize || currentData.tableSize
      });
      form.submit(); // 这将触发onFinish
    }).catch(() => {
      showToast('请完善预订信息', 'error');
    });
  };

  const prevStep = () => {
    // 保存第二步的数据
    const currentData = form.getFieldsValue(['expectedArrivalTime', 'tableSize', 'specialRequests']);
    setStep2Data({
      ...currentData,
      expectedArrivalTime: selectedDateTime || currentData.expectedArrivalTime,
      tableSize: selectedTableSize || currentData.tableSize
    });
    
    // 恢复第一步的数据
    form.setFieldsValue(step1Data);
    setCurrentStep(0);
  };

  const steps = [
    {
      title: '个人信息',
      description: '请填写您的联系方式',
    },
    {
      title: '预订详情',
      description: '选择用餐时间和人数',
    },
  ];

  const minDate = new Date(Date.now() + 60 * 60 * 1000);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header Image */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Image
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
          alt="餐厅环境"
          style={{ height: 160, borderRadius: 8 }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(0,102,204,0.7) 0%, rgba(26,115,232,0.5) 100%)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>预订专属餐桌</h2>
          <p style={{ fontSize: 14, opacity: 0.9, margin: '4px 0 0 0' }}>享受希尔顿品质美食体验</p>
        </div>
      </div>

      {/* Steps */}
      <Card style={{ marginBottom: 16 }}>
        <Steps current={currentStep} style={{ padding: '8px 0' }}>
          {steps.map((step, index) => (
            <Steps.Step
              key={index}
              title={step.title}
              description={step.description}
            />
          ))}
        </Steps>
      </Card>

      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        style={{ '--border-inner': '#eee' } as React.CSSProperties}
      >
        {currentStep === 0 && (
          <Card title="个人信息" style={{ marginBottom: 16 }}>
            <Form.Item
              name="guestName"
              label="姓名"
              rules={[
                { required: true, message: '请输入姓名' },
                { min: 2, message: '姓名至少需要2个字符' },
                { max: 50, message: '姓名不能超过50个字符' }
              ]}
            >
              <div style={{ position: 'relative' }}>
                <UserOutlined style={{ 
                  position: 'absolute', 
                  left: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--hilton-primary)', 
                  zIndex: 1 
                }} />
                <Input
                  placeholder="请输入您的姓名"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </Form.Item>

            <Form.Item
              name="guestPhone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <div style={{ position: 'relative' }}>
                <PhoneOutlined style={{ 
                  position: 'absolute', 
                  left: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--hilton-primary)', 
                  zIndex: 1 
                }} />
                <Input
                  placeholder="请输入手机号"
                  type="tel"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </Form.Item>

            <Form.Item
              name="guestEmail"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <div style={{ position: 'relative' }}>
                <MailOutlined style={{ 
                  position: 'absolute', 
                  left: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--hilton-primary)', 
                  zIndex: 1 
                }} />
                <Input
                  placeholder="请输入邮箱地址"
                  type="email"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </Form.Item>

            <Button
              block
              type="submit"
              color="primary"
              size="large"
              className="hilton-btn-primary"
              onClick={nextStep}
              style={{ marginTop: 16 }}
            >
              下一步
            </Button>
          </Card>
        )}

        {currentStep === 1 && (
          <>
            <Card title="预订详情" style={{ marginBottom: 16 }}>
              <Form.Item
                name="expectedArrivalTime"
                label="预订时间"
                rules={[{ required: true, message: '请选择预订时间' }]}
              >
                <DatePicker
                  min={minDate}
                  precision="minute"
                  title="选择预订时间"
                  confirmText="确认"
                  cancelText="取消"
                  onConfirm={(date) => {
                    setSelectedDateTime(date);
                    form.setFieldsValue({ expectedArrivalTime: date });
                  }}
                  onCancel={() => {
                    console.log('DatePicker 取消');
                  }}
                >
                  {(value: Date | null, actions: { open: () => void }) => {
                    return (
                      <div 
                        className="date-picker-trigger"
                        style={{ 
                          padding: '12px 16px', 
                          border: '1px solid #ddd', 
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          background: '#fff',
                          color: value ? '#333' : '#999',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={actions.open}
                      >
                        <CalendarOutlined style={{ color: 'var(--hilton-primary)', marginRight: 8 }} />
                        {value ? value.toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '请选择预订时间'}
                      </div>
                    );
                  }}
                </DatePicker>
              </Form.Item>

              <Form.Item
                name="tableSize"
                label="用餐人数"
                rules={[{ required: true, message: '请选择用餐人数' }]}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px',
                  marginTop: 8
                }}>
                  {tableSizeOptions.map((option) => {
                    const isSelected = selectedTableSize === option.value;
                    return (
                      <div
                        key={option.value}
                        className={`table-size-card ${isSelected ? 'selected' : ''}`}
                        style={{
                          padding: '14px 8px',
                          textAlign: 'center',
                          border: isSelected ? '2px solid var(--hilton-primary)' : '2px solid #e6f3ff',
                          borderRadius: '12px',
                          background: isSelected 
                            ? 'linear-gradient(135deg, var(--hilton-primary) 0%, var(--hilton-secondary) 100%)'
                            : 'linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%)',
                          color: isSelected ? 'white' : 'var(--hilton-primary)',
                          fontWeight: '600',
                          fontSize: '15px',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isSelected ? '0 4px 12px rgba(0,102,204,0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => {
                          setSelectedTableSize(option.value);
                          form.setFieldsValue({ tableSize: option.value });
                        }}
                      >
                        <TeamOutlined style={{ marginRight: 6, fontSize: '16px' }} />
                        {option.label}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Form.Item>

              <Form.Item
                name="specialRequests"
                label="特殊要求 (可选)"
              >
                <TextArea
                  placeholder="如有特殊饮食要求、座位偏好或其他需求，请在此说明"
                  rows={3}
                  style={{ '--color': '#333' } as React.CSSProperties}
                />
              </Form.Item>
            </Card>

            {/* Service Promise */}
            <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)' }}>
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--hilton-success)', marginBottom: 8 }} />
                <h4 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--hilton-text)' }}>
                  希尔顿服务承诺
                </h4>
                <Space direction="vertical" style={{ '--gap': '4px' } as React.CSSProperties}>
                  <div style={{ fontSize: 13, color: 'var(--hilton-text-light)' }}>✓ 即时确认预订</div>
                  <div style={{ fontSize: 13, color: 'var(--hilton-text-light)' }}>✓ 专业服务团队</div>
                  <div style={{ fontSize: 13, color: 'var(--hilton-text-light)' }}>✓ 灵活取消政策</div>
                </Space>
              </div>
            </Card>

            <Space direction="vertical" style={{ width: '100%', '--gap': '12px' } as React.CSSProperties}>
              <Button
                block
                color="primary"
                size="large"
                loading={loading}
                className="hilton-btn-primary"
                onClick={handleSubmit}
              >
                {loading ? '预订中...' : '确认预订'}
              </Button>

              <Button
                block
                color="default"
                size="large"
                onClick={prevStep}
                style={{ 
                  background: 'white',
                  border: '1px solid #ddd',
                  color: '#666'
                }}
              >
                上一步
              </Button>
            </Space>
          </>
        )}
      </Form>
    </div>
  );
} 