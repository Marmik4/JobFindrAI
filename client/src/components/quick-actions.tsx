import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface QuickAction {
  title: string;
  icon: string;
  href: string;
  color: string;
  testId: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Upload Resume",
    icon: "upload_file",
    href: "/resume-manager",
    color: "material-blue",
    testId: "upload-resume"
  },
  {
    title: "Generate Cover Letter",
    icon: "auto_awesome",
    href: "/cover-letters",
    color: "material-green",
    testId: "generate-cover-letter"
  },
  {
    title: "Configure Keywords",
    icon: "tune",
    href: "/job-search",
    color: "material-orange",
    testId: "configure-keywords"
  },
  {
    title: "Review Applications",
    icon: "rate_review",
    href: "/applications",
    color: "purple-500",
    testId: "review-applications"
  },
];

export default function QuickActions() {
  const { toast } = useToast();

  const handleQuickAction = (action: QuickAction) => {
    toast({
      title: `Navigating to ${action.title}`,
      description: `Opening ${action.title.toLowerCase()} page...`,
    });
  };

  return (
    <Card className="shadow-material">
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg h-auto"
              onClick={() => handleQuickAction(action)}
              data-testid={`quick-action-${action.testId}`}
            >
              <div className="flex items-center space-x-3">
                <span className={`material-icon text-${action.color}`}>
                  {action.icon}
                </span>
                <span className="text-sm font-medium text-gray-900">{action.title}</span>
              </div>
              <span className="material-icon text-material-gray">chevron_right</span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
