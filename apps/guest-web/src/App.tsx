import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { TabBar, Image } from 'antd-mobile';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  UnorderedListOutlined,
  PhoneOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { apolloClient } from './lib/apollo-client';
import { ReservationForm } from './components/reservation-form';
import { ReservationList } from './components/reservation-list';

type TabType = 'home' | 'booking' | 'reservations';

const tabs = [
  {
    key: 'home',
    title: '首页',
    icon: <HomeOutlined />,
  },
  {
    key: 'booking',
    title: '预订',
    icon: <CalendarOutlined />,
  },
  {
    key: 'reservations',
    title: '我的预订',
    icon: <UnorderedListOutlined />,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const renderHome = () => (
    <div className="scroll-container pb-tab" style={{ flex: 1 }}>
      {/* 精简的Hero Section */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Image
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
          alt="希尔顿餐厅"
          style={{ height: 180, borderRadius: '0 0 16px 16px' }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(0,102,204,0.8) 0%, rgba(26,115,232,0.6) 100%)',
          borderRadius: '0 0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          padding: 20
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 6 }}>希尔顿餐厅</h1>
          <p style={{ fontSize: 14, opacity: 0.9 }}>品质美食，即刻预订</p>
        </div>
      </div>

      {/* 快捷操作 */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            className="hilton-btn-primary touch-feedback"
            style={{
              padding: '20px 16px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => setActiveTab('booking')}
          >
            <CalendarOutlined style={{ fontSize: 24 }} />
            立即预订
          </button>
          <button
            style={{
              padding: '20px 16px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              background: 'white',
              border: '2px solid var(--hilton-primary)',
              color: 'var(--hilton-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
            className="touch-feedback"
            onClick={() => setActiveTab('reservations')}
          >
            <UnorderedListOutlined style={{ fontSize: 24 }} />
            我的预订
          </button>
        </div>
      </div>

      {/* 联系信息卡片 */}
      <div style={{ padding: '0 16px' }}>
        <div className="hilton-card">
          <div className="hilton-card-body" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              联系我们
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ marginBottom: 8 }}>
                  <PhoneOutlined style={{ color: 'var(--hilton-primary)', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--hilton-text-light)' }}>预订热线</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>1234-5678</div>
              </div>
              <div>
                <div style={{ marginBottom: 8 }}>
                  <ClockCircleOutlined style={{ color: 'var(--hilton-primary)', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--hilton-text-light)' }}>营业时间</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                  11:30-22:00
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBooking = () => (
    <div className="scroll-container pb-tab" style={{ flex: 1, padding: 16 }}>
      <ReservationForm onSuccess={() => setActiveTab('reservations')} />
    </div>
  );

  const renderReservations = () => (
    <div className="scroll-container pb-tab" style={{ flex: 1, padding: 16 }}>
      <ReservationList />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'booking':
        return renderBooking();
      case 'reservations':
        return renderReservations();
      default:
        return renderHome();
    }
  };

  return (
    <ApolloProvider client={apolloClient}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        {renderContent()}
        <TabBar
          className="tab-bar-fixed safe-area-bottom"
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabType)}
        >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </ApolloProvider>
  );
}

export default App;
