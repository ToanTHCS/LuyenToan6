// api.js (Sử dụng ESM)

export async function fetchStudents() {
    try {
        const response = await fetch('/api/get-students');
        return await response.json();  // Trả về danh sách học sinh
    } catch (error) {
        console.error('❌ Lỗi tải danh sách học sinh:', error);
        return [];  // Trả về mảng rỗng nếu có lỗi
    }
}

// Lưu danh sách học sinh
export async function saveStudents(students) {
    try {
        await fetch('/api/save-students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students })
        });
    } catch (error) {
        console.error('❌ Lỗi lưu danh sách học sinh:', error);
    }
}

// Khi trang tải xong, tự động tải danh sách học sinh
document.addEventListener('DOMContentLoaded', async () => {
    const students = await fetchStudents();
    console.log(students);  // Hiển thị danh sách học sinh đã tải
});
