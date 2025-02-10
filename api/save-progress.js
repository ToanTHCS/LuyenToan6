import { Octokit } from "octokit";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Token GitHub từ biến môi trường
const REPO_OWNER = "ToanTHCS"; // Chủ sở hữu repository
const REPO_NAME = "LuyenToan6"; // Tên repository
const FILE_PATH = "data/progress.json"; // Đường dẫn file JSON trên GitHub

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// 🔹 1. Lấy nội dung file `progress.json` từ GitHub
async function getProgressData() {
    try {
        const response = await octokit.request(`GET /repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`);
        const fileContent = Buffer.from(response.data.content, "base64").toString("utf-8");
        return { data: JSON.parse(fileContent), sha: response.data.sha };
    } catch (error) {
        console.error("❌ Lỗi lấy dữ liệu progress.json:", error);
        return { data: {}, sha: null };
    }
}

// 🔹 2. Lưu tiến trình học sinh lên GitHub
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Chỉ hỗ trợ phương thức POST!" });
    }

    try {
        const { studentId, completedExercises, averageScore, problems } = req.body;
        if (!studentId) return res.status(400).json({ message: "Thiếu mã học sinh!" });

        console.log(`📌 Đang cập nhật tiến trình cho học sinh: ${studentId}`);

        const { data: progressData, sha } = await getProgressData();

        // Cập nhật tiến trình
        progressData[studentId] = {
            completed: completedExercises,
            totalScore: (averageScore * completedExercises).toFixed(2),
            averageScore: averageScore.toFixed(2),
            problems
        };

        // Chuyển đổi dữ liệu thành base64
        const updatedContent = Buffer.from(JSON.stringify(progressData, null, 2), "utf-8").toString("base64");

        // 🔹 3. Gửi yêu cầu cập nhật file lên GitHub
        await octokit.request(`PUT /repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            message: `Cập nhật tiến trình học sinh: ${studentId}`,
            content: updatedContent,
            sha, // Cần `sha` để cập nhật file trên GitHub
            branch: "main"
        });

        console.log(`✅ Tiến trình học sinh ${studentId} đã lưu lên GitHub!`);
        res.status(200).json({ message: "Cập nhật tiến trình thành công!" });

    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
        res.status(500).json({ message: "Lỗi khi lưu tiến trình!" });
    }
}
