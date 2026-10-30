import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden relative z-1 bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-[#F8FAFC]">
        <Header />
        <div className="flex-1 relative overflow-hidden min-h-0 bg-[#F8FAFC]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
