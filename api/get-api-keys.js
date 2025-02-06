export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET method is allowed" });
    }

    try {
        // Lấy danh sách API Keys từ biến môi trường
        const apiKeys = [
            process.env.API_K1, process.env.API_K2, process.env.API_K3,
            process.env.API_K4, process.env.API_K5, process.env.API_K6,
            process.env.API_K7, process.env.API_K8, process.env.API_K9,
            process.env.API_K10
        ].filter(key => key); // Lọc bỏ các giá trị `null` hoặc `undefined`

        // Nếu không có API Key nào hợp lệ
        if (apiKeys.length === 0) {
            console.error("❌ Không tìm thấy API Keys trong .env");
            return res.status(500).json({ error: "No API keys available" });
        }

        console.log(`✅ API Keys lấy thành công: ${apiKeys.length} keys`);
        return res.status(200).json({ apiKeys });

    } catch (error) {
        console.error("❌ Lỗi khi lấy API Keys:", error);
        return res.status(500).json({ error: "Failed to retrieve API keys" });
    }
}
