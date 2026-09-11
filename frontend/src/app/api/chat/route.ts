import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const DEVOPS_SYSTEM_PROMPT = `You are an Advanced DevOps AI Assistant powered by Google Gemini. You are an expert in:

- Kubernetes (K8s): pods, deployments, services, ingress, HPA, PDB, namespaces, RBAC, ConfigMaps, Secrets, StatefulSets, DaemonSets
- AWS Cloud: EKS, EC2, ECS, RDS, S3, IAM, VPC, Route53, CloudWatch, ALB, NLB, ECR, ACM
- Amazon EKS: managed node groups, Fargate, IRSA, aws-load-balancer-controller, cluster autoscaler, Karpenter
- Docker: Dockerfile best practices, multi-stage builds, image optimisation, vulnerability scanning
- Terraform: IaC modules, state management, workspaces, remote backends, AWS provider
- Helm: chart development, values overrides, templating, Argo CD integration
- Linux: systemd, networking, file systems, shell scripting, performance tuning
- GitHub Actions: CI/CD pipelines, OIDC federation, matrix builds, caching, secrets management
- CI/CD: GitOps, Argo CD, FluxCD, Jenkins, pipeline design patterns
- Networking: VPC design, subnets, security groups, NACLs, DNS, TLS/SSL
- Monitoring & Observability: Prometheus, Grafana, CloudWatch, ELK stack, distributed tracing
- Security: DevSecOps, Trivy scanning, OPA/Gatekeeper, network policies, pod security standards
- Troubleshooting: systematic root-cause analysis using real commands and evidence

When troubleshooting an issue, always follow this structured approach:
1. **Likely Cause** — Explain what is probably causing the problem based on the symptoms.
2. **Verify** — Provide exact commands to confirm the root cause and their expected output.
3. **Safest Fix** — Give step-by-step remediation commands, ordered safest-first.
4. **Verification** — Provide commands to confirm the fix was applied successfully.

IMPORTANT RULES:
- Never claim a command was executed unless the application actually ran it.
- Never invent AWS or Kubernetes resource status — always show commands the user should run.
- Be precise, concise, and production-safe.
- Prefer YAML/HCL/shell code blocks with correct syntax highlighting.
- When referencing Kubernetes manifests, always include apiVersion, kind, metadata, spec.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        {
          error:
            'Authentication failed: GEMINI_API_KEY is not configured on the server. Please set a valid Google AI Studio key in frontend/.env.'
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      prompt,
      history = [],
      model: requestedModel,
      imageBase64,
      imageMimeType
    } = body;

    const defaultModel = process.env.DEFAULT_MODEL || 'gemini-3.6-flash';
    let selectedModel =
      requestedModel && requestedModel.trim() !== '' && requestedModel.startsWith('gemini-')
        ? requestedModel
        : defaultModel;

    if (selectedModel === 'gemini-2.5-flash') {
      selectedModel = 'gemini-3.6-flash';
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    // Initialize Google Gen AI client
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    // Build contents array for Gemini SDK
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      // Keep last 10 messages for context
      const historySlice = history.slice(-10);
      for (const msg of historySlice) {
        if (msg.role && msg.content && typeof msg.content === 'string') {
          contents.push({
            role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    // Build current user message parts
    const currentParts: any[] = [];
    if (imageBase64 && imageMimeType) {
      currentParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64
        }
      });
    }
    currentParts.push({ text: prompt.trim() });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // Request stream from Google Gemini
    let responseStream: any;
    try {
      responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: DEVOPS_SYSTEM_PROMPT
        }
      });
    } catch (apiErr: any) {
      console.error('[Gemini API Error]', apiErr);
      const rawMsg = apiErr?.message || 'Failed to communicate with Google Gemini API';
      const statusCode = apiErr?.status || (rawMsg.includes('API key') || rawMsg.includes('unauthorized') ? 401 : 500);
      return NextResponse.json({ error: rawMsg }, { status: statusCode });
    }

    // Stream SSE to client
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamErr: any) {
          console.error('[Gemini Stream Error]', streamErr);
          const errMsg = `\n\n*Stream Error: ${streamErr?.message || 'Stream interrupted'}*`;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: errMsg })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error: any) {
    console.error('[API Handler Error]', error);
    const rawMsg =
      typeof error?.message === 'string' ? error.message : 'Failed to process chat request';
    return NextResponse.json({ error: rawMsg }, { status: 500 });
  }
}