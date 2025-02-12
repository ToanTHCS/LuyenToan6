export default async function handler(req, res) {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({ error: "Thiếu studentId" });
        }

        const githubUrl = "https://raw.githubusercontent.com/OnToanAnhDuong/LuyenToan6/main/data/progress.json";

        console.log(`🔄 Đang tải tiến trình từ GitHub JSON cho học sinh: ${studentId}...`);

        // ✅ Bổ sung timestamp để chặn cache
        const timestamp = new Date().getTime();
        const response = await fetch(`${githubUrl}?t=${timestamp}`, {
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
        });

        if (!response.ok) {
            throw new Error(`Không thể tải JSON từ GitHub (Mã lỗi: ${response.status})`);
        }

        const allProgress = await response.json();
        const studentProgress = allProgress[studentId] || {};

        if (!Object.keys(studentProgress).length) {
            throw new Error(`❌ Không tìm thấy tiến trình của học sinh ${studentId}.`);
        }

        console.log(`✅ Tiến trình của học sinh ${studentId}:`, studentProgress);

        // ⚠ Đảm bảo Vercel không cache response
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Expires", "0");
        res.setHeader("Pragma", "no-cache");

        res.status(200).json(studentProgress);
    } catch (error) {
        console.error("❌ Lỗi khi lấy tiến trình:", error);
        res.status(500).json({ error: error.message });
    }
}
