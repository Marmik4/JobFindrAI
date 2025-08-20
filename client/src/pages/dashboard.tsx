import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import StatsCards from "@/components/stats-cards";
import RecentApplications from "@/components/recent-applications";
import QuickActions from "@/components/quick-actions";
import SystemStatus from "@/components/system-status";
import RecentActivity from "@/components/recent-activity";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();

  const handleQuickStart = () => {
    toast({
      title: "Quick Start",
      description: "Opening automation setup wizard...",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Dashboard"
          subtitle="Monitor your automated job applications"
          showManualScan={true}
          showAutomationToggle={true}
        />
        
        <main className="p-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentApplications />
            
            <div className="space-y-6">
              <QuickActions />
              <SystemStatus />
            </div>
          </div>
          
          <RecentActivity />
        </main>
      </div>
      
      {/* Floating Action Button */}
      <Button
        onClick={handleQuickStart}
        className="fixed bottom-6 right-6 w-14 h-14 bg-material-blue hover:bg-blue-700 text-white rounded-full shadow-material-lg transition-all duration-200 hover:scale-105 p-0"
        data-testid="quick-start-fab"
      >
        <span className="material-icon text-xl">play_arrow</span>
      </Button>
    </div>
  );
}
