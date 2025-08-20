import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, TrendingUp, Lightbulb, Zap, BarChart3 } from "lucide-react";

interface JobMatch {
  jobId: string;
  score: number;
  matchReasons: string[];
  skillsMatch: string[];
  missingSkills: string[];
  salaryMatch: boolean;
  locationMatch: boolean;
  recommendations: string[];
}

interface LearningInsight {
  category: string;
  insight: string;
  actionable: string;
  confidence: number;
}

interface ApplicationPattern {
  successRate: number;
  commonSuccessFactors: string[];
  rejectionReasons: string[];
  recommendedImprovements: string[];
}

export default function AIInsights() {
  const { data: jobMatches, isLoading: matchesLoading } = useQuery<JobMatch[]>({
    queryKey: ["/api/ai/job-matches"],
    queryFn: async () => {
      const res = await fetch("/api/ai/job-matches?limit=10");
      if (!res.ok) throw new Error("Failed to fetch job matches");
      return res.json();
    },
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<LearningInsight[]>({
    queryKey: ["/api/ai/learning-insights"],
    queryFn: async () => {
      const res = await fetch("/api/ai/learning-insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery<ApplicationPattern>({
    queryKey: ["/api/ai/application-patterns"],
    queryFn: async () => {
      const res = await fetch("/api/ai/application-patterns");
      if (!res.ok) throw new Error("Failed to fetch patterns");
      return res.json();
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Insights Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced analytics and intelligent recommendations for your job search
          </p>
        </div>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Job Matches</span>
            <span className="sm:hidden">Matches</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Learning Insights</span>
            <span className="sm:hidden">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Success Patterns</span>
            <span className="sm:hidden">Patterns</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI-Powered Job Matches
              </CardTitle>
              <CardDescription>
                Jobs ranked by compatibility with your skills and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : jobMatches && jobMatches.length > 0 ? (
                <div className="space-y-4">
                  {jobMatches.slice(0, 5).map((match, index) => (
                    <div key={match.jobId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          <Badge variant={getScoreBadgeVariant(match.score)} className="text-xs">
                            {match.score}% Match
                          </Badge>
                        </div>
                        <Progress value={match.score} className="w-full sm:w-32" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {match.skillsMatch.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.skillsMatch.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.skillsMatch.length - 4} more
                            </Badge>
                          )}
                        </div>
                        
                        {match.matchReasons.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {match.matchReasons[0]}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button size="sm" variant="default" className="flex-1">
                          <Zap className="h-4 w-4 mr-2" />
                          Auto Apply
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No job matches available. Upload a resume and enable job searching to see AI-powered recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Learning Insights
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your application data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  ))}
                </div>
              ) : insights && insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {insight.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {Math.round(insight.confidence * 100)}% confident
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{insight.insight}</p>
                        <p className="text-sm text-muted-foreground">{insight.actionable}</p>
                      </div>
                      
                      <Progress value={insight.confidence * 100} className="w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Not enough data yet. Apply to more jobs to receive personalized insights.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Application Success Patterns
              </CardTitle>
              <CardDescription>
                Analysis of your application performance and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patternsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ) : patterns ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold mb-2">
                      {patterns.successRate.toFixed(1)}%
                    </div>
                    <p className="text-muted-foreground">Overall Success Rate</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-green-600 dark:text-green-400">
                          Success Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patterns.commonSuccessFactors.length > 0 ? (
                          patterns.commonSuccessFactors.map((factor, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                              <span className="text-sm">{factor}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No success patterns identified yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-red-600 dark:text-red-400">
                          Common Challenges
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patterns.rejectionReasons.length > 0 ? (
                          patterns.rejectionReasons.map((reason, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-red-500 rounded-full" />
                              <span className="text-sm">{reason}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No rejection patterns identified yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {patterns.recommendedImprovements.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recommended Improvements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {patterns.recommendedImprovements.map((improvement, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Apply to more jobs to see detailed success patterns and recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}