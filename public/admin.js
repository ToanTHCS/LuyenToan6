// admin.js (Sử dụng ESM)

const STUDENTS_URL = '/data/students.json';  // Đảm bảo đúng URL

let studentsData = {};  // Biến để lưu dữ liệu học sinh

// Tải danh sách học sinh
export async function loadStudents() {
    try {
        const response = await fetch(STUDENTS_URL);
        if (!response.ok) throw new Error("Không thể tải danh sách học sinh.");
        studentsData = await response.json();  // Lưu vào biến global studentsData
        displayStudentList();
    } catch (error) {
        console.error('❌ Lỗi tải danh sách học sinh:', error);
    }
}

// Hiển thị danh sách học sinh lên giao diện
function displayStudentList() {
    const container = document.getElementById('studentList');
    container.innerHTML = '';  // Reset lại container trước khi hiển thị mới
    
    Object.keys(studentsData).forEach(id => {
        const row = `<tr>
            <td>${id}</td>
            <td>${studentsData[id].name}</td>
            <td><button onclick="deleteStudent('${id}')">❌ Xoá</button></td>
        </tr>`;
        container.innerHTML += row;
    });
}

// Xóa học sinh khỏi danh sách
export async function deleteStudent(studentId) {
    try {
        delete studentsData[studentId];  // Xóa học sinh từ dữ liệu
        await saveStudents();  // Lưu lại danh sách sau khi xóa
        displayStudentList();  // Cập nhật lại giao diện
    } catch (error) {
        console.error('❌ Lỗi khi xóa học sinh:', error);
    }
}

// Lưu danh sách học sinh vào file hoặc API
async function saveStudents() {
    try {
        const response = await fetch('/api/save-students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentsData)
        });

        if (!response.ok) throw new Error("Không thể lưu danh sách học sinh.");
    } catch (error) {
        console.error('❌ Lỗi khi lưu danh sách học sinh:', error);
    }
}

// Khi trang tải xong, tự động tải danh sách học sinh
document.addEventListener('DOMContentLoaded', loadStudents);
