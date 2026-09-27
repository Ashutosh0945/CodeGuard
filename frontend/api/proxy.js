export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const path = req.query.path || "";
  const backendUrl = `https://codeguard-22e4.onrender.com${path}`;

  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}
