import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types';

const { Title, Text } = Typography;

export function LoginPage() {
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth();

  const handleSubmit = async (values: LoginCredentials) => {
    setError(null);
    
    const result = await login(values);
    if (!result.success) {
      setError(result.error || '登录失败，请重试');
    }
    // 登录成功会自动重定向，无需手动处理
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
            color: 'white'
          }}>
            <LoginOutlined />
          </div>
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
            希尔顿餐厅
          </Title>
          <Text type="secondary">员工管理系统</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Spin spinning={loading}>
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                size="large"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          padding: 16,
          background: '#f8f9fa',
          borderRadius: 8,
          fontSize: 12
        }}>
          <Text type="secondary">
            测试账号 - admin:admin123, manager:manager123
          </Text>
          <br />
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            注意：请确保后端服务器已启动
          </Text>
        </div>
      </Card>
    </div>
  );
} 