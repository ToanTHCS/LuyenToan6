// /pages/api/get-api-keys.js (Sử dụng ESM)

export default function handler(req, res) {
    if (req.method === 'GET') {
        const apiKey = process.env.API_GPT;  // Lấy API key từ biến môi trường

        if (apiKey) {
            res.status(200).json({ apiKey });  // Trả về API key dưới dạng JSON
        } else {
            // Nếu API key không tồn tại trong biến môi trường
            res.status(400).json({ error: 'API Key không tồn tại trong biến môi trường' });
        }
    } else {
        // Nếu phương thức không phải GET
        res.status(405).json({ error: 'Phương thức yêu cầu không được phép' });
    }
}
