// api/get-api-keys.js (Sử dụng ESM)
export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET method is allowed" });
    }

    try {
        const apiKey = process.env.API_K1; // Chỉ sử dụng API_K1

        if (!apiKey) {
            return res.status(500).json({ error: "API Key is missing" });
        }

        return res.status(200).json({ apiKey });
    } catch (error) {
        console.error("❌ Error retrieving API key:", error);
        return res.status(500).json({ error: "Failed to retrieve API key" });
    }
}
