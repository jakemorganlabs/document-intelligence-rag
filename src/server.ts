/**
 * Query endpoint — minimal HTTP server (§5.5, FR-ER-3, NFR-SE-1).
 *
 * POST /query
 * Headers: X-Timestamp, X-Signature
 * Body: { "question": "string" }
 * Returns: { status, answer, citations, audit_id }
 *
 * Authentication: HMAC-SHA256 over (timestamp || body).
 * No open inbound ports in production; exposed via encrypted tunnel (§19).
 */
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { queryDocument } from "./query.js";
import { verifyHmac } from "./auth.js";

const PORT = Number(process.env.PORT) || 3000;

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export function buildServer() {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "POST" || req.url !== "/query") {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    /* ---------- Auth gate (S05) ---------- */
    const secret = process.env.QUERY_SECRET ?? "";
    if (secret) {
      const timestamp = getHeader(req, "X-Timestamp");
      const signature = getHeader(req, "X-Signature");

      const auth = verifyHmac({
        timestamp: timestamp ?? "",
        signature: signature ?? "",
        body,
        secret,
      });

      if (!auth.valid) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "Unauthorized", reason: auth.reason }));
        return;
      }
    }

    let question: string;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.question !== "string" || parsed.question.trim().length === 0) {
        throw new Error("missing question");
      }
      question = parsed.question.trim();
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid JSON body. Expected { question: string }" }));
      return;
    }

    try {
      const result = await queryDocument({ question });
      res.writeHead(200);
      res.end(
        JSON.stringify({
          status: result.answer.status,
          answer: result.answer.answer,
          citations: result.answer.citations,
          audit_id: result.audit.audit_id,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Query error:", message);
      res.writeHead(503);
      res.end(JSON.stringify({ error: "Service temporarily unavailable", detail: message }));
    }
  });
}

export function startServer(port = PORT) {
  const server = buildServer();
  server.listen(port, () => {
    console.log(`Query endpoint listening on http://localhost:${port}/query`);
  });
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
