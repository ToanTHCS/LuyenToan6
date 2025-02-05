// api/get-api-keys.js (Sử dụng ESM)
// /pages/api/get-api-keys.js

export default function handler(req, res) {
    if (req.method === 'GET') {
        const apiKey = process.env.API_GPT;  // Lấy API key từ biến môi trường
        if (apiKey) {
            res.status(200).json({ apiKey });  // Trả về API key dưới dạng JSON
        } else {
            res.status(400).json({ error: 'API Key not found' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });  // Chỉ hỗ trợ phương thức GET
    }
}
