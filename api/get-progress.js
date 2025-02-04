// api/get-progress.js (Sử dụng ESM)
export default async function handler(req, res) {
    const { studentId } = req.query;

    if (!studentId) {
        return res.status(400).json({ message: "❌ Thiếu `studentId` trong yêu cầu!" });
    }

    const GITHUB_PROGRESS_URL = "https://raw.githubusercontent.com/OnToanAnhDuong/LuyenToan6/main/data/progress.json";

    try {
        console.log(`📥 Đang lấy tiến trình của học sinh ${studentId} từ GitHub...`);

        // Lấy dữ liệu tiến trình từ GitHub
        const response = await fetch(GITHUB_PROGRESS_URL);
        if (!response.ok) {
            throw new Error(`❌ Lỗi khi lấy dữ liệu từ GitHub: ${response.statusText}`);
        }

        const data = await response.json();

        // Kiểm tra nếu không có dữ liệu cho studentId trong progress.json
        if (!data[studentId]) {
            return res.status(404).json({ message: `❌ Không tìm thấy tiến trình cho học sinh ${studentId}.` });
        }

        console.log(`✅ Tiến trình của học sinh ${studentId}:`, data[studentId]);
        return res.status(200).json(data[studentId]);

    } catch (error) {
        console.error("❌ Lỗi khi lấy tiến trình:", error);
        return res.status(500).json({ message: "❌ Lỗi hệ thống khi lấy tiến trình học sinh." });
    }
}
