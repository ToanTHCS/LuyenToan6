// api/get-problems.js (Sử dụng ESM)
export default async function handler(req, res) {
    try {
        // Giả sử bạn có một file problems.json trong thư mục data trên GitHub hoặc trong thư mục public
        const response = await fetch('https://raw.githubusercontent.com/OnToanAnhDuong/LuyenToan6/main/data/problems.json');
        const problems = await response.json();

        res.status(200).json(problems); // Trả lại dữ liệu JSON
    } catch (error) {
        console.error("Lỗi khi lấy bài tập:", error);
        res.status(500).json({ message: 'Lỗi khi lấy bài tập' });
    }
}
