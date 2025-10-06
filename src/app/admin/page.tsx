import { AdminDashboard } from '@/components/AdminDashboard';
import { Header } from '@/components/Header';

export default function AdminPage() {
  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <Header />
      <main className="flex-1 pt-20">
        <AdminDashboard />
      </main>
    </div>
  );
}
