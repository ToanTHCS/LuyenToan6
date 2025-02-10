// student.js - Quản lý giao diện học sinh, gọi API, chấm bài

import { loadProgress, saveProgress } from "./progress.js"; // Import từ progress.js

let currentKeyIndex = 0;  // Biến để theo dõi API key đang sử dụng
let base64Image = ""; // Biến toàn cục để lưu ảnh bài làm
let progressData = {}; // Biến lưu tiến trình học sinh
let currentProblem = null; // Biến lưu bài tập hiện tại
let isGrading = false; // Biến trạng thái để chống spam
let apiKey = ""; // Biến toàn cục lưu API Key

// ✅ Format đề bài thành HTML
function formatProblemText(problemText) {
    return problemText.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
}

// ✅ Tải API key từ server
async function loadApiKey() {
    try {
        const response = await fetch('/api/get-api-keys');
        if (!response.ok) throw new Error('Không thể tải API key');
        const data = await response.json();
        apiKey = data.apiKey;  
        console.log('✅ API Key:', apiKey);
    } catch (error) {
        console.error('❌ Lỗi khi tải API Key:', error);
    }
}

// ✅ Khởi tạo trang học sinh
async function initStudentPage() {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
        alert("⚠ Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
        window.location.href = "index.html";
        return;
    }

    console.log(`🔹 Đang tải dữ liệu học sinh: ${studentId}`);
    await loadStudentData(studentId);
    await loadProblems();
    await loadProgress(studentId); // Load tiến trình
    console.log("✅ Trang học sinh đã khởi tạo hoàn tất!");
}

// ✅ Tải danh sách học sinh
async function loadStudentData(studentId) {
    try {
        const response = await fetch('/api/get-students');
        if (!response.ok) throw new Error("Không thể tải danh sách học sinh.");
        const studentsObject = await response.json();

        const students = Object.keys(studentsObject).map(key => ({
            id: key,
            name: studentsObject[key].name,
            role: studentsObject[key].role
        }));

        console.log("✅ Danh sách học sinh:", students);
        return students;
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách học sinh:", error);
        return [];
    }
}

// ✅ Tải danh sách bài tập
async function loadProblems() {
    try {
        const response = await fetch('/api/get-problems');
        if (!response.ok) throw new Error("Không thể tải danh sách bài tập!");
        const problems = await response.json();
        console.log("✅ Danh sách bài tập:", problems);
        displayProblemList(problems);
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách bài tập:", error);
    }
}

// ✅ Hiển thị danh sách bài tập
function displayProblemList(problems) {
    const problemContainer = document.getElementById("problemList");
    problemContainer.innerHTML = ""; 

    problems.forEach(problem => {
        const problemBox = document.createElement("div");
        problemBox.textContent = problem.index;
        problemBox.className = "problem-box";
        problemBox.dataset.id = problem.index;

        function updateProblemColor() {
            if (progressData[problem.index]) {
                problemBox.style.backgroundColor = "green"; 
            } else {
                problemBox.style.backgroundColor = "yellow";
            }
        }

        updateProblemColor();

        problemBox.addEventListener("click", async () => {
            if (progressData[problem.index]) {
                alert("📌 Bài tập này đã làm! Vui lòng chọn bài tập khác hoặc chọn bài tương tự.");
                return;
            }
            displayProblem(problem);
        });

        problemContainer.appendChild(problemBox);
    });

    console.log("✅ Danh sách bài tập đã cập nhật.");
}

// ✅ Hiển thị nội dung bài tập
function displayProblem(problem) {
    document.getElementById("problemText").innerHTML = problem.problem;
    currentProblem = problem;
    MathJax.typesetPromise([document.getElementById("problemText")]).catch(err => console.error("MathJax lỗi:", err));
}

// ✅ Chấm bài với Gemini AI
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';

    const promptText = `
Học sinh: ${studentId}
📌 Đề bài:
${problemText}
🔹 **Yêu cầu chấm bài:**
1️⃣ Nhận diện bài làm từ ảnh và gõ lại **chính xác từng ký tự, công thức Toán viết dưới dạng LaTeX**.
2️⃣ Giải bài toán theo đúng yêu cầu đề bài, cung cấp lời giải **chi tiết từng bước**.
3️⃣ So sánh bài làm của học sinh với đáp án đúng, **chấm điểm từng bước** theo mức độ chính xác.
4️⃣ Chấm điểm trên thang **10**, cho **0 điểm nếu bài làm sai hoàn toàn hoặc không khớp đề bài**.
5️⃣ Đưa ra **nhận xét chi tiết** về bài làm và **đề xuất cách cải thiện**.

📌 **Định dạng JSON phản hồi bắt buộc:**
{
  "studentAnswer": "[Nội dung nhận diện từ ảnh]",
  "detailedSolution": "[Lời giải từng bước]",
  "gradingDetails": "[Cách chấm điểm]",
  "score": [Số từ 0-10],
  "feedback": "[Nhận xét chi tiết]",
  "suggestions": "[Đề xuất cải thiện]"
}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }
        ]
    };

    console.log("📌 Đang gửi request đến Gemini API...");
    
    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error("API không trả về dữ liệu hợp lệ.");
        
        let data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);

    } catch (error) {
        console.error('❌ Lỗi khi chấm bài:', error);
        return { score: 0, feedback: "Lỗi hệ thống, vui lòng thử lại." };
    }
}

// ✅ Xử lý khi nhấn "Chấm bài"
document.getElementById("submitBtn").addEventListener("click", async () => {
    if (isGrading) return alert("⏳ Hệ thống đang chấm bài...");

    if (!currentProblem) return alert("⚠ Vui lòng chọn bài tập trước khi chấm.");

    const studentId = localStorage.getItem("studentId");
    const problemText = document.getElementById("problemText").innerText.trim();
    const studentFileInput = document.getElementById("studentImage");

    if (!problemText) return alert("⚠ Đề bài chưa được tải.");

    let base64Image = null;
    if (studentFileInput.files.length > 0) {
        const file = studentFileInput.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => base64Image = reader.result.split(",")[1];
    }

    if (!base64Image) return alert("⚠ Vui lòng tải lên ảnh bài làm.");

    isGrading = true;
    const response = await gradeWithGemini(base64Image, problemText, studentId);
    
    await saveProgress(studentId, response.score);
    isGrading = false;
});
