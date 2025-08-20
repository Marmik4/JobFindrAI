import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import JobSearch from "@/pages/job-search";
import ResumeManager from "@/pages/resume-manager";
import CoverLetters from "@/pages/cover-letters";
import Applications from "@/pages/applications";
import Automation from "@/pages/automation";
import Analytics from "@/pages/analytics";
import Configuration from "@/pages/configuration";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/job-search" component={JobSearch} />
      <Route path="/resume-manager" component={ResumeManager} />
      <Route path="/cover-letters" component={CoverLetters} />
      <Route path="/applications" component={Applications} />
      <Route path="/automation" component={Automation} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/configuration" component={Configuration} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
