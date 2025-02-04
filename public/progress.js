// progress.js (Sử dụng ESM)

const PROGRESS_URL = '/data/progress.json'; // Đảm bảo đúng URL của tiến trình

let progressData = {}; // Biến toàn cục lưu trữ tiến trình học sinh

// Tải tiến trình học sinh
export async function loadProgress() {
    try {
        const response = await fetch(PROGRESS_URL);
        if (!response.ok) throw new Error('Không thể tải tiến trình học sinh.');
        progressData = await response.json();
        console.log('✅ Tiến trình đã tải thành công!');
    } catch (error) {
        console.error('❌ Lỗi tải tiến trình:', error);
    }
}

// Cập nhật điểm số học sinh
export async function updateStudentProgress(studentId, score) {
    if (!progressData[studentId]) {
        progressData[studentId] = { completed: 0, totalScore: 0, averageScore: 0, problems: [] };
    }

    progressData[studentId].completed++;
    progressData[studentId].totalScore += score;
    progressData[studentId].averageScore = progressData[studentId].totalScore / progressData[studentId].completed;
    
    await saveProgress();
}

// Lưu tiến trình vào JSON
export async function saveProgress() {
    try {
        await fetch('/api/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        });
    } catch (error) {
        console.error('❌ Lỗi lưu tiến trình:', error);
    }
}
