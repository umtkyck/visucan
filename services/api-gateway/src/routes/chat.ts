// ============================================================
// AI CHAT ROUTES (CLAUDE INTEGRATION)
// ============================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createSuccessResponse, getSubscriptionLimits, checkLimit } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { db } from '@visucan/database/client';
import { config } from '../config';

// System prompt for Claude
const SYSTEM_PROMPT = `You are VisuCAN's PCB Design Assistant. You help users design circuits and PCBs through natural conversation.

Current capabilities:
- Maximum 4-layer PCB designs
- DigiKey component sourcing only
- PCBWAY manufacturing (quote & order)
- Draftsman report generation

Always:
- Suggest DigiKey part numbers when recommending components
- Consider PCBWAY manufacturing capabilities (min 0.127mm trace/space)
- Explain technical concepts in beginner-friendly terms
- Offer to help place user's logo on the board (Pro/Enterprise only)
- Remind users to confirm their design before quoting

Be helpful, concise, and guide users through PCB design step by step.`;

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Send message to AI
  fastify.post('/projects/:projectId/chat', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };
    const { message } = z.object({ message: z.string().min(1) }).parse(request.body);

    const user = request.user!;

    // Check project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: {
        blockDiagram: true,
        pcbLayout: true,
        bomItems: { include: { component: true } },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check AI message limit
    const limits = getSubscriptionLimits(user.subscription);
    // TODO: Implement actual usage tracking
    // const monthlyUsage = await getMonthlyAIUsage(user.id);
    // if (!checkLimit(monthlyUsage, limits.aiMessagesPerMonth)) {
    //   throw ApiError.forbidden('Monthly AI message limit reached');
    // }

    // Get or create chat session
    let session = await db.chatSession.findFirst({
      where: { projectId, userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });

    if (!session) {
      session = await db.chatSession.create({
        data: { projectId, userId: user.id },
        include: { messages: true },
      });
    }

    // Save user message
    const userMessage = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'USER',
        content: message,
      },
    });

    // Build context for Claude
    const projectContext = `
Current project: ${project.name}
Board size: ${project.boardWidth}mm x ${project.boardHeight}mm
Layers: ${project.layerCount}
Status: ${project.status}
Components in BOM: ${project.bomItems.length}
`;

    // Prepare messages for Claude API
    const conversationMessages = session.messages.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));

    conversationMessages.push({ role: 'user', content: message });

    // TODO: Call Claude API
    // For now, return a mock response
    let assistantContent: string;

    if (!config.anthropicApiKey) {
      // Mock response when no API key
      assistantContent = getMockResponse(message, project);
    } else {
      // Real Claude API call
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.anthropicApiKey,
            'anthropic-version': '2024-01-01',
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            system: SYSTEM_PROMPT + '\n\n' + projectContext,
            messages: conversationMessages,
          }),
        });

        if (!response.ok) {
          throw new Error('Claude API error');
        }

        const data = await response.json();
        assistantContent = data.content[0].text;
      } catch (error) {
        assistantContent = "I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment.";
      }
    }

    // Save assistant message
    const assistantMessage = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'ASSISTANT',
        content: assistantContent,
      },
    });

    return createSuccessResponse({
      userMessage: {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
    });
  });

  // Get chat history
  fastify.get('/projects/:projectId/chat', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };

    const session = await db.chatSession.findFirst({
      where: { projectId, userId: request.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) {
      return createSuccessResponse({ messages: [] });
    }

    return createSuccessResponse({
      sessionId: session.id,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  });

  // Clear chat history
  fastify.delete('/projects/:projectId/chat', async (request: FastifyRequest) => {
    const { projectId } = request.params as { projectId: string };

    await db.chatSession.deleteMany({
      where: { projectId, userId: request.user!.id },
    });

    return createSuccessResponse({ message: 'Chat history cleared' });
  });
}

// Mock responses for development
function getMockResponse(message: string, project: any): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('help') || lowerMessage.includes('start')) {
    return `I'm here to help you design your PCB! Here's what I can assist with:

1. **Block Diagram** - Describe your system and I'll help create a block diagram
2. **Component Selection** - Tell me your requirements and I'll suggest components from DigiKey
3. **Schematic Review** - I can explain circuit connections and suggest improvements
4. **PCB Layout** - I'll help with placement and routing strategies
5. **DRC Issues** - If you have design rule violations, I can explain them
6. **Manufacturing** - I can help you get quotes from PCBWAY

What would you like to work on for "${project.name}"?`;
  }

  if (lowerMessage.includes('component') || lowerMessage.includes('part') || lowerMessage.includes('chip')) {
    return `I'd be happy to help you find components! To give you the best suggestions, please tell me:

1. What type of component do you need? (MCU, sensor, voltage regulator, etc.)
2. What are your key requirements? (voltage, current, package size, features)
3. Any budget constraints?

For example, if you need an MCU for a temperature sensor project, you might consider:
- **ESP32-WROOM-32E** (DigiKey: ESP32-WROOM-32E-N16) - WiFi/BLE, ~$3.15
- **STM32F411CEU6** (DigiKey: STM32F411CEU6) - ARM Cortex-M4, ~$5.89

What specific component are you looking for?`;
  }

  if (lowerMessage.includes('quote') || lowerMessage.includes('order') || lowerMessage.includes('manufacture')) {
    return `To get a quote from PCBWAY, let me walk you through the process:

1. First, make sure your design passes DRC (Design Rule Check)
2. Click "Get Quote" and you'll see a 3D preview of your board
3. Confirm the preview looks correct
4. Select your quantity (5, 10, 20, 50, or 100)
5. Review the quote and place your order

Your current board specs:
- Size: ${project.boardWidth}mm × ${project.boardHeight}mm
- Layers: ${project.layerCount}

Would you like me to run a DRC check before you get a quote?`;
  }

  if (lowerMessage.includes('logo')) {
    return `Adding your logo to the PCB is a great way to brand your design!

Here's how it works:
1. Upload your logo (PNG, SVG, or DXF format)
2. Choose the layer (silkscreen is most common)
3. Position and size it on your board
4. The logo will be included in your manufacturing files

**Note:** Logo placement is available for Pro and Enterprise subscribers.

Would you like me to help you add a logo to "${project.name}"?`;
  }

  return `I understand you're working on "${project.name}". Could you tell me more about what you'd like help with? I can assist with:

- Component selection and sourcing
- Schematic design
- PCB layout and routing
- Design rule checks
- Manufacturing quotes
- Documentation

Just describe what you're trying to achieve!`;
}
