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
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content with responsive padding */}
      <div className="md:ml-80 min-h-screen">
        <div className="pt-16 md:pt-6 px-4 md:px-6 pb-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your automated job applications</p>
          </div>
          
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <RecentApplications />
            </div>
            
            <div className="space-y-6">
              <QuickActions />
              <SystemStatus />
            </div>
          </div>
          
          <div className="mt-6">
            <RecentActivity />
          </div>
        </div>
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
