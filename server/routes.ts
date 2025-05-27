import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";

const generateBpmnSchema = z.object({
  text: z.string().min(1, "Process description is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // BPMN generation endpoint
  app.post("/api/generate-bpmn", async (req, res) => {
    try {
      const { text } = generateBpmnSchema.parse(req.body);
      
      // Generate a basic BPMN XML structure based on the input text
      const bpmnXml = generateBasicBpmn(text);
      
      res.set('Content-Type', 'application/xml');
      res.send(bpmnXml);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid request", 
          errors: error.errors 
        });
      } else {
        console.error("BPMN generation error:", error);
        res.status(500).json({ 
          message: "Failed to generate BPMN diagram" 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateBasicBpmn(processDescription: string): string {
  // Extract key information from the process description
  const steps = extractSteps(processDescription);
  const processName = extractProcessName(processDescription);
  
  // Generate BPMN elements
  let bpmnElements = '';
  let flowElements = '';
  
  const startEventId = 'StartEvent_1';
  const endEventId = 'EndEvent_1';
  
  // Start Event
  bpmnElements += `    <bpmn:startEvent id="${startEventId}" name="Start">
      <bpmn:outgoing>Flow_start</bpmn:outgoing>
    </bpmn:startEvent>
`;

  let previousId = startEventId;
  let previousOutgoing = 'Flow_start';
  
  // Generate tasks for each step
  steps.forEach((step, index) => {
    const taskId = `Task_${index + 1}`;
    const outgoingFlow = index === steps.length - 1 ? 'Flow_end' : `Flow_${index + 1}`;
    
    // Determine if it's a decision point
    const isDecision = step.toLowerCase().includes('decision') || 
                      step.toLowerCase().includes('approve') || 
                      step.toLowerCase().includes('reject') ||
                      step.toLowerCase().includes('review');
    
    if (isDecision) {
      bpmnElements += `    <bpmn:exclusiveGateway id="${taskId}" name="${step}">
      <bpmn:incoming>${previousOutgoing}</bpmn:incoming>
      <bpmn:outgoing>${outgoingFlow}</bpmn:outgoing>
    </bpmn:exclusiveGateway>
`;
    } else {
      bpmnElements += `    <bpmn:task id="${taskId}" name="${step}">
      <bpmn:incoming>${previousOutgoing}</bpmn:incoming>
      <bpmn:outgoing>${outgoingFlow}</bpmn:outgoing>
    </bpmn:task>
`;
    }
    
    // Add sequence flow
    flowElements += `    <bpmn:sequenceFlow id="${previousOutgoing}" sourceRef="${previousId}" targetRef="${taskId}" />
`;
    
    previousId = taskId;
    previousOutgoing = outgoingFlow;
  });
  
  // End Event
  bpmnElements += `    <bpmn:endEvent id="${endEventId}" name="End">
      <bpmn:incoming>${previousOutgoing}</bpmn:incoming>
    </bpmn:endEvent>
`;
  
  // Final flow to end
  flowElements += `    <bpmn:sequenceFlow id="${previousOutgoing}" sourceRef="${previousId}" targetRef="${endEventId}" />
`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn" 
                  exporter="PwC BPMN Generator" 
                  exporterVersion="1.0">
  <bpmn:process id="Process_1" name="${processName}" isExecutable="true">
${bpmnElements}${flowElements}  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${generateDiagramElements(steps)}    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function extractSteps(description: string): string[] {
  // Simple step extraction - look for numbered lists or sentences
  const lines = description.split('\n').filter(line => line.trim());
  const steps: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and headers
    if (!trimmed || trimmed.endsWith(':')) continue;
    
    // Remove numbering and clean up
    const cleaned = trimmed
      .replace(/^\d+\.\s*/, '') // Remove "1. "
      .replace(/^[-*]\s*/, '')  // Remove "- " or "* "
      .trim();
    
    if (cleaned && cleaned.length > 5) {
      steps.push(cleaned);
    }
  }
  
  // If no clear steps found, create basic steps
  if (steps.length === 0) {
    return [
      "Initialize Process",
      "Process Request", 
      "Review and Approve",
      "Complete Process"
    ];
  }
  
  return steps.slice(0, 10); // Limit to 10 steps for readability
}

function extractProcessName(description: string): string {
  const firstLine = description.split('\n')[0].trim();
  if (firstLine.endsWith(':')) {
    return firstLine.replace(':', '');
  }
  
  // Look for common process indicators
  const processKeywords = ['process', 'workflow', 'procedure'];
  for (const keyword of processKeywords) {
    const regex = new RegExp(`([^.]*${keyword}[^.]*)`, 'i');
    const match = description.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  return "Business Process";
}

function generateDiagramElements(steps: string[]): string {
  let elements = '';
  const stepWidth = 100;
  const stepHeight = 80;
  const startX = 50;
  const startY = 100;
  const spacing = 150;
  
  // Start event
  elements += `      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="${startX}" y="${startY}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="58" y="143" width="25" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
`;
  
  // Tasks
  steps.forEach((step, index) => {
    const x = startX + 100 + (index * spacing);
    const y = startY - 20;
    const taskId = `Task_${index + 1}`;
    
    elements += `      <bpmndi:BPMNShape id="${taskId}_di" bpmnElement="${taskId}">
        <dc:Bounds x="${x}" y="${y}" width="${stepWidth}" height="${stepHeight}" />
      </bpmndi:BPMNShape>
`;
  });
  
  // End event
  const endX = startX + 100 + (steps.length * spacing);
  elements += `      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${endX}" y="${startY}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${ endX + 8}" y="143" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
`;
  
  // Sequence flows
  let prevX = startX + 36;
  elements += `      <bpmndi:BPMNEdge id="Flow_start_di" bpmnElement="Flow_start">
        <di:waypoint x="${prevX}" y="${startY + 18}" />
        <di:waypoint x="${startX + 100}" y="${startY + 20}" />
      </bpmndi:BPMNEdge>
`;
  
  steps.forEach((step, index) => {
    const fromX = startX + 100 + (index * spacing) + stepWidth;
    const toX = index === steps.length - 1 ? endX : startX + 100 + ((index + 1) * spacing);
    const flowId = index === steps.length - 1 ? 'Flow_end' : `Flow_${index + 1}`;
    
    elements += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${fromX}" y="${startY + 20}" />
        <di:waypoint x="${toX}" y="${startY + 18}" />
      </bpmndi:BPMNEdge>
`;
  });
  
  return elements;
}
