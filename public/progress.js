const PROGRESS_URL = "/api/get-progress"; // API lấy tiến trình từ GitHub
const SAVE_PROGRESS_URL = "/api/save-progress"; // API lưu tiến trình

let progressData = {}; // Biến lưu tiến trình học sinh

// 🔹 1. Tải tiến trình học sinh từ GitHub JSON
export async function loadProgress(studentId) {
    try {
        const response = await fetch(`${PROGRESS_URL}?studentId=${studentId}`);
        if (!response.ok) throw new Error("❌ Không thể tải tiến trình học sinh!");
        progressData = await response.json() || {};
        console.log("✅ Tiến trình đã tải:", progressData);
        updateProgressUI(studentId);
    } catch (error) {
        console.error("❌ Lỗi tải tiến trình:", error);
    }
}

// 🔹 2. Cập nhật số bài đã làm, điểm trung bình
export async function updateStudentProgress(studentId, score, problemIndex) {
    if (!progressData[studentId]) {
        progressData[studentId] = { completed: 0, totalScore: 0, averageScore: 0, problems: [] };
    }

    // Nếu bài này chưa làm, thêm vào danh sách
    if (!progressData[studentId].problems.includes(problemIndex)) {
        progressData[studentId].completed++;
        progressData[studentId].totalScore += score;
        progressData[studentId].problems.push(problemIndex);
        progressData[studentId].averageScore = (progressData[studentId].totalScore / progressData[studentId].completed).toFixed(2);
    }

    console.log(`📌 Cập nhật tiến trình ${studentId}:`, progressData[studentId]);

    await saveProgress(studentId);
    updateProgressUI(studentId);
}

// 🔹 3. Lưu tiến trình học sinh lên GitHub JSON
async function saveProgress(studentId) {
    try {
        const response = await fetch(SAVE_PROGRESS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentId,
                completedExercises: progressData[studentId].completed,
                averageScore: progressData[studentId].averageScore,
                problems: progressData[studentId].problems
            })
        });

        if (!response.ok) throw new Error("❌ Không thể lưu tiến trình!");
        console.log("✅ Tiến trình đã lưu lên GitHub!");
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}

// 🔹 4. Hiển thị số bài đã làm và điểm trung bình
function updateProgressUI(studentId) {
    document.getElementById("completedExercises").textContent = progressData[studentId]?.completed || 0;
    document.getElementById("averageScore").textContent = progressData[studentId]?.averageScore || 0;
}

// 🚀 Khi tải trang, tự động load tiến trình
document.addEventListener("DOMContentLoaded", async function () {
    const studentId = localStorage.getItem("studentId");
    if (studentId) {
        await loadProgress(studentId);
    }
});
