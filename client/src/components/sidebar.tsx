import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "dashboard" },
  { name: "Job Search", href: "/job-search", icon: "work" },
  { name: "Resume Manager", href: "/resume-manager", icon: "description" },
  { name: "Cover Letters", href: "/cover-letters", icon: "mail" },
  { name: "Applications", href: "/applications", icon: "track_changes" },
  { name: "Automation", href: "/automation", icon: "smart_button" },
  { name: "Analytics", href: "/analytics", icon: "analytics" },
];

const settings = [
  { name: "Configuration", href: "/configuration", icon: "settings" },
  { name: "API Keys", href: "/configuration#api-keys", icon: "security" },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn("w-64 bg-white shadow-material flex-shrink-0", className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-material-blue rounded-lg flex items-center justify-center">
            <span className="material-icon text-white text-xl" data-testid="logo-icon">smart_toy</span>
          </div>
          <div>
            <h1 className="text-xl font-medium text-gray-900">JobBot AI</h1>
            <p className="text-sm text-material-gray">Automation Assistant</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors",
                    isActive
                      ? "text-white bg-material-blue"
                      : "text-material-gray hover:text-gray-900 hover:bg-gray-100"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="material-icon mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </a>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 px-3">
          <h3 className="px-3 text-xs font-semibold text-material-gray uppercase tracking-wider">Settings</h3>
          <div className="mt-2">
            {settings.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href.split('#')[0]);
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors",
                      isActive
                        ? "text-white bg-material-blue"
                        : "text-material-gray hover:text-gray-900 hover:bg-gray-100"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="material-icon mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-material-green rounded-full flex items-center justify-center">
            <span className="material-icon text-white text-sm">check</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900" data-testid="status-text">Active</p>
            <p className="text-xs text-material-gray" data-testid="last-run-text">Last run: 2 min ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
