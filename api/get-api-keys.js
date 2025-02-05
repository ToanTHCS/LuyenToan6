export default function handler(req, res) {
    if (req.method === 'GET') {
        const apiKey = process.env.API_GPT;  // Lấy API key từ biến môi trường
        if (apiKey) {
            return res.status(200).json({ apiKey });
        } else {
            return res.status(400).json({ error: 'API Key không tồn tại trong biến môi trường' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });  // Chỉ hỗ trợ phương thức GET
    }
}
