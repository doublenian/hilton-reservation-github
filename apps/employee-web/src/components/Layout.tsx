import React, { ReactNode } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function Layout({ children, currentPath = '/' }: LayoutProps) {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/reservations',
      icon: <CalendarOutlined />,
      label: '预订管理',
      onClick: () => navigate('/reservations'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)',
          margin: 16,
          borderRadius: 8,
          marginBottom: 24
        }}>
          <Text style={{ 
            color: 'white', 
            fontSize: collapsed ? 16 : 18, 
            fontWeight: 'bold' 
          }}>
            {collapsed ? 'H' : '希尔顿'}
          </Text>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          style={{ border: 'none' }}
        />
      </Sider>

      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: '16px' }}
            />

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'background-color 0.3s'
              }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#667eea' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 14, fontWeight: 500 }}>
                    {employee?.username || '员工'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {employee?.role || 'staff'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{
          margin: 24,
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
} 