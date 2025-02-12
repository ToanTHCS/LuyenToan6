export default async function handler(req, res) {
    try {
        const studentId = req.query.studentId;
        if (!studentId) {
            return res.status(400).json({ error: "Thiếu studentId" });
        }

        // Gọi API GitHub để lấy dữ liệu mới nhất
        const githubResponse = await fetch(GITHUB_JSON_URL, {
            headers: { "Cache-Control": "no-cache" }
        });

        if (!githubResponse.ok) {
            throw new Error("Không thể lấy dữ liệu từ GitHub.");
        }

        const progressData = await githubResponse.json();

        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Expires", "0");
        res.setHeader("Pragma", "no-cache");

        res.status(200).json(progressData[studentId] || {});
    } catch (error) {
        console.error("❌ Lỗi khi tải tiến trình:", error);
        res.status(500).json({ error: "Lỗi khi tải tiến trình" });
    }
}
