import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  BarChart3, 
  BrainCircuit, 
  FileText, 
  Home, 
  Mail, 
  Menu, 
  Search, 
  Settings, 
  Target, 
  Upload,
  Bot,
  TrendingUp,
  Brain
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and statistics"
  },
  {
    title: "Job Search",
    href: "/job-search",
    icon: Search,
    description: "Find and browse jobs"
  },
  {
    title: "AI Insights",
    href: "/ai-insights",
    icon: Brain,
    description: "AI-powered recommendations",
    badge: "New"
  },
  {
    title: "Applications",
    href: "/applications",
    icon: Target,
    description: "Track your applications"
  },
  {
    title: "Resume Manager",
    href: "/resume-manager",
    icon: Upload,
    description: "Manage your resumes"
  },
  {
    title: "Cover Letters",
    href: "/cover-letters",
    icon: Mail,
    description: "Generate cover letters"
  },
  {
    title: "Automation",
    href: "/automation",
    icon: Bot,
    description: "Automation controls"
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    description: "Performance analytics"
  },
  {
    title: "Configuration",
    href: "/configuration",
    icon: Settings,
    description: "System settings"
  }
];

function SidebarContent({ className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-6">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">JobBot AI</h2>
              <p className="text-xs text-muted-foreground">Automated Job Search</p>
            </div>
          </div>
          <div className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link key={index} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-auto p-3",
                      isActive && "bg-secondary"
                    )}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.title}</span>
                        {item.badge && (
                          <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden fixed top-4 left-4 z-50"
            data-testid="mobile-menu-toggle"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <ScrollArea className="h-full">
            <SidebarContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="fixed inset-y-0 left-0 z-50 w-80 border-r bg-background">
          <ScrollArea className="h-full">
            <SidebarContent />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}