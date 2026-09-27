export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
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
    const timeout = setTimeout(() => controller.abort(), 25000);

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

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
}
