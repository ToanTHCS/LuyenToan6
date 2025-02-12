export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { studentId, problemId, completedExercises, totalScore, averageScore, problemsDone } = req.body;
    if (!studentId || !problemId) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    try {
        // 🔹 Lấy JSON hiện tại từ GitHub
        const githubUrl = "https://raw.githubusercontent.com/OnToanAnhDuong/LuyenToan6/main/data/progress.json";
        const response = await fetch(githubUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("Không thể tải JSON từ GitHub.");

        let allProgress = await response.json();
        
        // 🔄 Cập nhật tiến trình học sinh
        allProgress[studentId] = {
            completedExercises,
            totalScore,
            averageScore,
            problemsDone
        };

        // 📌 Ghi lại JSON lên GitHub
        const githubApiUrl = "https://api.github.com/repos/OnToanAnhDuong/LuyenToan6/contents/data/progress.json";
        const githubToken = process.env.GITHUB_TOKEN;  // 🔑 Lấy token từ biến môi trường

        // Lấy SHA của file hiện tại
        const fileResponse = await fetch(githubApiUrl, {
            headers: { Authorization: `token ${githubToken}` }
        });
        const fileData = await fileResponse.json();
        const sha = fileData.sha;  // 🔑 Cần SHA để ghi đè file

        // 📝 Cập nhật file trên GitHub
        const updateResponse = await fetch(githubApiUrl, {
            method: "PUT",
            headers: {
                Authorization: `token ${githubToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Cập nhật tiến trình học sinh ${studentId}`,
                content: Buffer.from(JSON.stringify(allProgress, null, 2)).toString("base64"),
                sha
            })
        });

        if (!updateResponse.ok) throw new Error("Lỗi khi cập nhật JSON lên GitHub.");
        
        console.log(`✅ Cập nhật tiến trình thành công:`, allProgress[studentId]);
        res.status(200).json({ message: "Cập nhật thành công!", progress: allProgress[studentId] });
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
        res.status(500).json({ error: error.message });
    }
}
