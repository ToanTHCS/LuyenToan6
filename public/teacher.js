// teacher.js (Sử dụng ESM)

// Kiểm tra trạng thái đăng nhập giáo viên
export function checkTeacherLogin() {
    if (localStorage.getItem("teacherLoggedIn") === "true") {
        document.getElementById('teacherLogin').style.display = 'none';
        document.getElementById('teacherPanel').style.display = 'block';
    }
}

// 🚀 Đăng nhập giáo viên
export function loginTeacher() {
    const password = document.getElementById('teacherPassword').value;
    if (password === "admin123") { // 🔑 Thay bằng mật khẩu bảo mật hơn
        localStorage.setItem("teacherLoggedIn", "true");
        document.getElementById('teacherLogin').style.display = 'none';
        document.getElementById('teacherPanel').style.display = 'block';
    } else {
        alert("❌ Mật khẩu sai!");
    }
}

// 🚀 Tải danh sách học sinh
export async function fetchStudents() {
    try {
        const response = await fetch('/api/get-students');
        const students = await response.json();
        const tableBody = document.querySelector("#studentsTable tbody");
        tableBody.innerHTML = "";
        students.forEach((student, index) => {
            const row = `<tr>
                <td>${index + 1}</td>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td><button onclick="deleteStudent('${student.id}')">❌</button></td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error('❌ Lỗi tải danh sách học sinh:', error);
    }
}

// 🚀 Thêm học sinh mới
export async function addStudent() {
    const id = document.getElementById('newStudentId').value;
    const name = document.getElementById('newStudentName').value;
    if (!id || !name) {
        alert("⚠ Vui lòng nhập đầy đủ ID và tên học sinh.");
        return;
    }
    const students = await fetch('/api/get-students').then(res => res.json());
    students.push({ id, name });
    await fetch('/api/save-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students })
    });
    alert("✅ Học sinh đã được thêm!");
    fetchStudents();
}

// 🚀 Xóa học sinh
export async function deleteStudent(studentId) {
    let students = await fetch('/api/get-students').then(res => res.json());
    students = students.filter(student => student.id !== studentId);
    await fetch('/api/save-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students })
    });
    alert("✅ Học sinh đã bị xóa!");
    fetchStudents();
}

// 🚀 Tải danh sách bài tập
export async function fetchProblems() {
    const problems = await fetch('/api/get-problems').then(res => res.json());
    const tableBody = document.querySelector("#problemsTable tbody");
    tableBody.innerHTML = "";
    problems.forEach((problem, index) => {
        const row = `<tr>
            <td>${index + 1}</td>
            <td>${problem}</td>
            <td><button onclick="deleteProblem(${index})">❌</button></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// 🚀 Thêm bài tập
export async function addProblem() {
    const text = document.getElementById('newProblemText').value;
    if (!text) {
        alert("⚠ Vui lòng nhập nội dung bài tập.");
        return;
    }
    const problems = await fetch('/api/get-problems').then(res => res.json());
    problems.push(text);
    await fetch('/api/save-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problems })
    });
    alert("✅ Bài tập đã được thêm!");
    fetchProblems();
}

// Đảm bảo chạy khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', () => {
    checkTeacherLogin();
});
