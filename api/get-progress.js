export default async function handler(req, res) {
    const { studentId } = req.query;
    
    if (!studentId) {
        return res.status(400).json({ error: "Thiếu studentId" });
    }

    try {
        const githubUrl = `https://raw.githubusercontent.com/OnToanAnhDuong/LuyenToan6/main/data/progress.json`;
        
        // ⚠ Tắt cache của trình duyệt và Vercel
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        console.log("📡 Đang tải dữ liệu từ GitHub JSON...");
        
        const response = await fetch(githubUrl, { cache: "no-store" }); // 🚀 Tắt cache!
        if (!response.ok) throw new Error("Không thể tải JSON từ GitHub.");

        const allProgress = await response.json();
        const studentProgress = allProgress[studentId] || { completedExercises: 0, totalScore: 0, averageScore: 0, problemsDone: [] };

        console.log(`✅ Tiến trình mới nhất của ${studentId}:`, studentProgress);
        res.status(200).json(studentProgress);
    } catch (error) {
        console.error("❌ Lỗi khi lấy tiến trình:", error);
        res.status(500).json({ error: error.message });
    }
}
