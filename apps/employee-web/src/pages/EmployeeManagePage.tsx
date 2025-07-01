import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Table, Space, Modal, Select } from 'antd';
import { useMutation, useQuery, gql } from '@apollo/client';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Employee, UserRole } from '../types';

// 注册员工的GraphQL mutation
const REGISTER_EMPLOYEE = gql`
  mutation RegisterEmployee($input: CreateEmployeeInput!) {
    registerEmployee(input: $input) {
      id
      username
      email
      role
      createdAt
      updatedAt
    }
  }
`;

const { Option } = Select;

export function EmployeeManagePage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 注册员工的mutation
  const [registerEmployee] = useMutation(REGISTER_EMPLOYEE, {
    onCompleted: (data) => {
      if (data.registerEmployee) {
        message.success('员工账号创建成功');
        form.resetFields();
        setIsModalVisible(false);
        // refetch(); // 刷新员工列表
      }
    },
    onError: (error) => {
      message.error('创建员工账号失败：' + error.message);
    }
  });

  const handleCreateEmployee = async (values: any) => {
    setLoading(true);
    try {
      await registerEmployee({
        variables: {
          input: {
            username: values.username,
            email: values.email,
            password: values.password,
            role: values.role || UserRole.EMPLOYEE
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => role === UserRole.EMPLOYEE ? '员工' : '客人',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Employee) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="员工管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            创建员工账号
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={[]} // 这里应该是从GraphQL查询获取的员工列表
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="创建员工账号"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateEmployee}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            initialValue={UserRole.EMPLOYEE}
          >
            <Select>
              <Option value={UserRole.EMPLOYEE}>员工</Option>
              <Option value={UserRole.GUEST}>客人</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
              >
                创建账号
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 