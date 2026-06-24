import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from '../dashboard/ToastContainer';
import ChatBot from '../chat/ChatBot';
import Background3D from './Background3D';

export default function Layout({ children, data, connected, toasts }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <Background3D />
      <Sidebar data={data} style={{ zIndex: 10 }} />
      <div className="layout-content" style={{ zIndex: 1, position: 'relative' }}>
        <Topbar connected={connected} data={data} />
        <main className="page-content">
          {children}
        </main>
      </div>
      <ToastContainer toasts={toasts} />
      <ChatBot data={data} />
    </div>
  );
}
