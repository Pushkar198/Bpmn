import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Download,
  FileImage,
  Image,
  Edit,
  WandSparkles,
  Eraser,
  ChartLine,
  ProjectorIcon as Diagram,
  Shield,
  Code,
  Lightbulb,
  Play,
  Cog,
  Check,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo
} from "lucide-react";

// Import bpmn-js
declare global {
  interface Window {
    BpmnJS: any;
  }
}

const examples = {
  leave: `Employee Leave Request Process:

1. Employee submits leave request form with dates, duration, and reason
2. System validates if employee has sufficient leave balance
3. Request is automatically routed to direct manager for approval
4. Manager reviews request and either approves or rejects with comments
5. If approved, request goes to HR for final processing
6. HR updates leave management system and employee records
7. Employee receives notification of final decision
8. If approved, calendar entries are created and team is notified`,

  invoice: `Invoice Approval Workflow:

1. Vendor submits invoice through supplier portal
2. System performs automated validation (PO matching, vendor verification)
3. Invoice is routed to appropriate approver based on amount and department
4. Approver reviews invoice details and supporting documentation
5. If amount exceeds threshold, additional senior approval required
6. Approved invoices are sent to Finance for payment processing
7. Payment is scheduled based on terms and cash flow
8. Vendor receives payment confirmation and remittance advice`,

  onboarding: `Employee Onboarding Process:

1. HR receives signed offer letter and starts onboarding checklist
2. IT provisions accounts, equipment, and system access
3. Security creates building access cards and completes background check
4. Manager prepares workspace and assigns onboarding buddy
5. New employee completes day-one orientation and documentation
6. HR conducts benefits enrollment and policy review
7. Department provides role-specific training and introductions
8. 30-day check-in scheduled with manager and HR
9. Probationary review scheduled for 90 days`
};

export default function BpmnGenerator() {
  const [processText, setProcessText] = useState("");
  const [currentBpmn, setCurrentBpmn] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bpmnViewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const { toast } = useToast();

  // Load bpmn-js dynamically
  useEffect(() => {
    const loadBpmnJS = async () => {
      if (!window.BpmnJS) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/bpmn-js@17.6.0/dist/bpmn-viewer.production.min.js';
        script.onload = () => {
          console.log('bpmn-js loaded');
        };
        document.head.appendChild(script);
      }
    };
    loadBpmnJS();
  }, []);

  const generateBpmn = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/generate-bpmn', { text });
      return await response.text();
    },
    onMutate: () => {
      setStatus('loading');
      setErrorMessage(null);
    },
    onSuccess: (bpmnXml: string) => {
      setCurrentBpmn(bpmnXml);
      setStatus('success');
      renderBpmn(bpmnXml);
      toast({
        title: "BPMN Generated Successfully!",
        description: "Your process diagram is ready for review and download.",
      });
    },
    onError: (error: Error) => {
      setStatus('error');
      setErrorMessage(error.message);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renderBpmn = async (bpmnXml: string) => {
    if (!bpmnViewerRef.current || !window.BpmnJS) return;

    try {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
      }

      const viewer = new window.BpmnJS({
        container: bpmnViewerRef.current,
        width: '100%',
        height: '500px'
      });

      viewerInstanceRef.current = viewer;
      await viewer.importXML(bpmnXml);
      viewer.get('canvas').zoom('fit-viewport');
    } catch (error) {
      console.error('Error rendering BPMN:', error);
      toast({
        title: "Rendering Error",
        description: "Failed to render BPMN diagram",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    const text = processText.trim();
    if (!text) {
      toast({
        title: "Input Required",
        description: "Please enter a process description before generating BPMN.",
        variant: "destructive",
      });
      return;
    }
    generateBpmn.mutate(text);
  };

  const handleClear = () => {
    setProcessText("");
    setCurrentBpmn(null);
    setStatus('idle');
    setErrorMessage(null);
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.clear();
    }
  };

  const loadExample = (exampleKey: keyof typeof examples) => {
    setProcessText(examples[exampleKey]);
  };

  const downloadBpmn = () => {
    if (!currentBpmn) {
      toast({
        title: "No BPMN Available",
        description: "No BPMN diagram available for download.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([currentBpmn], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'process-diagram.bpmn';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSvg = async () => {
    if (!viewerInstanceRef.current) return;
    try {
      const { svg } = await viewerInstanceRef.current.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'process-diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export SVG",
        variant: "destructive",
      });
    }
  };

  const resetZoom = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.get('canvas').zoom('fit-viewport');
    }
  };

  const zoomIn = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.get('zoomScroll').stepZoom(1);
    }
  };

  const zoomOut = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.get('zoomScroll').stepZoom(-1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pwc-orange rounded-lg flex items-center justify-center">
                <Diagram className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-700">PwC BPMN Generator</h1>
                <p className="text-sm text-neutral-600">Transform process descriptions into BPMN diagrams</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-neutral-600">
                <Shield className="text-trust-blue" />
                <span>Enterprise Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input and Status Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-700 flex items-center">
                    <Edit className="text-pwc-orange mr-2" />
                    Process Description
                  </h2>
                  <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">Step 1</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="processText" className="block text-sm font-medium text-neutral-700 mb-2">
                      Describe your business process
                    </label>
                    <Textarea
                      id="processText"
                      value={processText}
                      onChange={(e) => setProcessText(e.target.value)}
                      rows={8}
                      className="resize-none"
                      placeholder="Example: User wants to apply for leave. First, they fill out a leave request form. Then, the manager reviews and either approves or rejects the request. If approved, HR processes the leave and updates the system..."
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Lightbulb className="text-trust-blue" />
                      <span>Describe process steps, decisions, and participants</span>
                    </div>
                    <span className="text-sm text-neutral-600">{processText.length} characters</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleGenerate}
                disabled={status === 'loading'}
                className="flex-1 bg-pwc-orange hover:bg-red-600 text-white"
              >
                {status === 'loading' ? (
                  <>
                    <Cog className="mr-2 h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-4 w-4" />
                    <span>Generate BPMN</span>
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleClear}
                variant="outline"
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                <Eraser className="mr-2 h-4 w-4" />
                <span>Clear</span>
              </Button>
            </div>

            {/* Example Prompts */}
            <Card className="bg-neutral-50 border-neutral-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
                  <Lightbulb className="text-yellow-500 mr-2" />
                  Example Processes
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => loadExample('leave')}
                    className="text-sm text-trust-blue hover:text-blue-700 block text-left transition-colors"
                  >
                    Employee Leave Request Process
                  </button>
                  <button 
                    onClick={() => loadExample('invoice')}
                    className="text-sm text-trust-blue hover:text-blue-700 block text-left transition-colors"
                  >
                    Invoice Approval Workflow
                  </button>
                  <button 
                    onClick={() => loadExample('onboarding')}
                    className="text-sm text-trust-blue hover:text-blue-700 block text-left transition-colors"
                  >
                    Employee Onboarding Process
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-700 flex items-center">
                    <ChartLine className="text-pwc-green mr-2" />
                    Generation Status
                  </h2>
                  <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">Step 2</span>
                </div>

                {/* Status Display */}
                {status === 'idle' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="text-neutral-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">Ready to Generate</h3>
                    <p className="text-neutral-600">Enter your process description and click "Generate BPMN" to begin.</p>
                  </div>
                )}

                {status === 'loading' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-pwc-orange rounded-full flex items-center justify-center mx-auto mb-4">
                      <Cog className="text-white text-xl animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">Generating BPMN...</h3>
                    <p className="text-neutral-600 mb-4">Analyzing your process description and creating the diagram.</p>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div className="bg-pwc-orange h-2 rounded-full animate-pulse" style={{width: '45%'}}></div>
                    </div>
                  </div>
                )}

                {status === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="text-white text-xl" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">BPMN Generated Successfully!</h3>
                    <p className="text-neutral-600 mb-4">Your process diagram is ready for review and download.</p>
                    <div className="flex justify-center space-x-3">
                      <Button 
                        onClick={downloadBpmn}
                        className="bg-pwc-green hover:bg-green-700 text-white text-sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download BPMN
                      </Button>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="text-white text-xl" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">Generation Failed</h3>
                    <p className="text-red-600 text-sm mb-4">{errorMessage || "Unable to connect to the server. Please try again."}</p>
                    <Button 
                      onClick={handleGenerate}
                      className="bg-pwc-orange hover:bg-red-600 text-white text-sm"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Information */}
            <Card className="bg-neutral-50 border-neutral-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
                  <Code className="text-trust-blue mr-2" />
                  API Endpoint
                </h3>
                <div className="bg-white rounded border p-3">
                  <code className="text-sm text-neutral-600">POST /api/generate-bpmn</code>
                  <div className="mt-2 text-xs text-neutral-500">
                    Accepts: {`{ "text": "process description" }`}<br />
                    Returns: BPMN XML string
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BPMN Viewer */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-700 flex items-center">
                <Diagram className="text-pwc-green mr-2" />
                BPMN Diagram Viewer
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">Step 3</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={zoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={zoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetZoom}
                    title="Fit to Screen"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* BPMN Viewer Container */}
            <div className={`min-h-[500px] rounded-lg transition-all duration-300 ${currentBpmn ? 'border border-neutral-200' : 'border-2 border-dashed border-neutral-200'}`}>
              {!currentBpmn ? (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Diagram className="text-neutral-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-600 mb-2">No BPMN Diagram Yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      Generate a BPMN diagram from your process description to see it visualized here. 
                      The interactive viewer will allow you to explore and download your diagram.
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  ref={bpmnViewerRef} 
                  className="w-full h-full min-h-[500px] bg-white rounded-lg"
                />
              )}
            </div>

            {/* BPMN Actions */}
            <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t border-neutral-100">
              <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                <span className="text-sm text-neutral-600">Diagram Actions:</span>
                <button 
                  onClick={exportSvg}
                  className="text-sm text-trust-blue hover:text-blue-700 transition-colors"
                  disabled={!currentBpmn}
                >
                  <Image className="inline mr-1 h-3 w-3" />
                  Export as SVG
                </button>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetZoom}
                  disabled={!currentBpmn}
                >
                  <Undo className="mr-2 h-4 w-4" />
                  Reset View
                </Button>
                <Button 
                  onClick={downloadBpmn}
                  disabled={!currentBpmn}
                  className="bg-pwc-green hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download BPMN
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center shadow-sm">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-pwc-orange rounded-lg flex items-center justify-center mx-auto mb-4">
                <Edit className="text-white text-lg" />
              </div>
              <h3 className="font-semibold text-neutral-700 mb-2">1. Describe Process</h3>
              <p className="text-sm text-neutral-600">Enter a detailed description of your business process, including steps, decisions, and participants.</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-sm">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-pwc-green rounded-lg flex items-center justify-center mx-auto mb-4">
                <WandSparkles className="text-white text-lg" />
              </div>
              <h3 className="font-semibold text-neutral-700 mb-2">2. Generate Diagram</h3>
              <p className="text-sm text-neutral-600">Our AI analyzes your description and automatically generates a professional BPMN diagram.</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-sm">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-trust-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="text-white text-lg" />
              </div>
              <h3 className="font-semibold text-neutral-700 mb-2">3. Export & Use</h3>
              <p className="text-sm text-neutral-600">Download your BPMN file for use in other tools or export as images for documentation.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-pwc-orange rounded-lg flex items-center justify-center">
                <Diagram className="text-white text-sm" />
              </div>
              <span className="text-neutral-700 font-medium">PwC BPMN Generator</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-neutral-600">
              <span>Powered by bpmn-js</span>
              <span>•</span>
              <span>Enterprise Ready</span>
              <span>•</span>
              <span className="flex items-center">
                <Shield className="text-trust-blue mr-1 h-3 w-3" />
                Secure
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
