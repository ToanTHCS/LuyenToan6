// api/get-api-keys.js (Sử dụng ESM)
export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET method is allowed" });
    }

    try {
        const apiKeys = [
            process.env.API_K1, process.env.API_K2, process.env.API_K3,
            process.env.API_K4, process.env.API_K5, process.env.API_K6,
            process.env.API_K7, process.env.API_K8, process.env.API_K9,
            process.env.API_K10
        ].filter(key => key); // Lọc ra các API Key hợp lệ

        if (apiKeys.length === 0) {
            return res.status(500).json({ error: "No API keys available" });
        }

        return res.status(200).json({ apiKeys });
    } catch (error) {
        console.error("❌ Error retrieving API keys:", error);
        return res.status(500).json({ error: "Failed to retrieve API keys" });
    }
}
