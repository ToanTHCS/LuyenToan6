import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const apiKey = process.env.OPENAI_API_KEY;  // Lấy API key từ biến môi trường
        const { model, messages } = req.body;

        // Kiểm tra nếu không có messages
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Missing required parameter: messages' });
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model, messages })
            });

            const result = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({ error: result.error.message });
            }

            res.status(200).json(result);  // Trả về kết quả từ OpenAI API
        } catch (error) {
            console.error('Lỗi khi gọi API GPT:', error);
            res.status(500).json({ error: 'Đã xảy ra lỗi khi gọi API GPT' });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
}
