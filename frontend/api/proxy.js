export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
  maxDuration: 120,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const path = req.query.path || "";
  const backendUrl = `https://codeguard-22e4.onrender.com${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110000);

    const fetchOpts = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    };

    if (req.method !== "GET" && req.body) {
      fetchOpts.body = typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);
    }

    const response = await fetch(backendUrl, fetchOpts);
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
}
