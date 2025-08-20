import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Download, Settings, Zap } from "lucide-react";

interface LLMStatus {
  openai: boolean;
  ollama: boolean; 
  huggingface: boolean;
  activeProvider: string;
  recommendations: string[];
}

interface SetupGuide {
  [key: string]: {
    title: string;
    steps: string[];
    difficulty: string;
    cost: string;
    privacy: string;
  };
}

export default function LLMSetup() {
  const { data: status, isLoading: statusLoading } = useQuery<LLMStatus>({
    queryKey: ['/api/llm/status'],
    refetchInterval: 10000 // Check every 10 seconds
  });

  const { data: setupGuide } = useQuery<SetupGuide>({
    queryKey: ['/api/llm/setup-guide']
  });

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-gray-400" />
    );
  };

  const getProviderBadge = (provider: string, isActive: boolean) => {
    if (!isActive) return <Badge variant="outline">Not Available</Badge>;
    
    switch (provider) {
      case 'openai':
        return <Badge className="bg-green-500">Best Quality</Badge>;
      case 'ollama':
        return <Badge className="bg-blue-500">Free & Private</Badge>;
      case 'huggingface':
        return <Badge className="bg-orange-500">Free with Limits</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">AI Setup Guide</h1>
          <p className="text-gray-600">
            Configure your AI provider for resume analysis, optimization, and cover letter generation
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Current AI Status
            </CardTitle>
            <CardDescription>
              Active Provider: <Badge variant={status?.activeProvider === 'fallback' ? 'destructive' : 'default'}>
                {status?.activeProvider || 'None'}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Status Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status?.openai || false)}
                  <span className="font-medium">OpenAI</span>
                </div>
                {getProviderBadge('openai', status?.openai || false)}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status?.ollama || false)}
                  <span className="font-medium">Ollama (Local)</span>
                </div>
                {getProviderBadge('ollama', status?.ollama || false)}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status?.huggingface || false)}
                  <span className="font-medium">Hugging Face</span>
                </div>
                {getProviderBadge('huggingface', status?.huggingface || false)}
              </div>
            </div>

            {/* Recommendations */}
            {status?.recommendations && status.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Recommendations:</h4>
                {status.recommendations.map((rec, index) => (
                  <Alert key={index} className={rec.includes('✅') ? 'border-green-200 bg-green-50' : ''}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Tabs defaultValue="ollama" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ollama" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Ollama (Free)
            </TabsTrigger>
            <TabsTrigger value="huggingface" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Hugging Face
            </TabsTrigger>
            <TabsTrigger value="openai" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              OpenAI (Premium)
            </TabsTrigger>
          </TabsList>

          {setupGuide && Object.entries(setupGuide).map(([key, guide]) => (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle>{guide.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">Difficulty: {guide.difficulty}</Badge>
                    <Badge variant="outline">Cost: {guide.cost}</Badge>
                    <Badge variant="outline">Privacy: {guide.privacy}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                  
                  {key === 'ollama' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommended for most users:</strong> Ollama runs AI models locally on your computer, 
                        keeping your resume data completely private. After installation, JobBot will automatically detect and use it.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {key === 'huggingface' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Good for testing:</strong> Hugging Face provides free AI access with monthly limits. 
                        Perfect for trying out JobBot's AI features without any cost.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {key === 'openai' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Best results:</strong> OpenAI provides the highest quality AI analysis and cover letter generation. 
                        Costs approximately $0.01-0.05 per resume analysis.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links & Resources</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Download & Install:</h4>
              <div className="space-y-1">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://ollama.ai/download" target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Ollama
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Sign up for Hugging Face
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Sign up for OpenAI
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Documentation:</h4>
              <div className="space-y-1">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/jmorganca/ollama#quickstart" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ollama Documentation
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://huggingface.co/docs/api-inference/index" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Hugging Face API Docs
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refresh Status */}
        <div className="text-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Refresh Status
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Status updates automatically every 10 seconds
          </p>
        </div>
      </div>
    </div>
  );
}