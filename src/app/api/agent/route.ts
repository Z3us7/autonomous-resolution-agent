import { NextRequest } from "next/server";
import { AgentController } from "../../../agent/agent-controller";
import { ActionType } from "../../../types/models/action";

// In-memory rate limiter for hackathon demo (prevents abuse/spam)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  try {
    // 1. Safety Feature: Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - userLimit.lastReset > RATE_LIMIT_WINDOW_MS) {
      userLimit.count = 0;
      userLimit.lastReset = now;
    }

    if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute." }), { 
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    userLimit.count++;
    rateLimitMap.set(ip, userLimit);

    // 2. Parse Request
    const body = await req.json();
    const { userInput } = body;

    if (!userInput) {
      return new Response("Missing required fields", { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const agent = new AgentController();
        
        agent.onLog = (log) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
        };

        try {
          await agent.resolveIssue(userInput);
        } catch (error) {
          agent.onLog({
            timestamp: new Date(),
            state: "ESCALATED",
            message: `Internal error: ${error instanceof Error ? error.message : "Unknown"}`
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response("Invalid request", { status: 400 });
  }
}
