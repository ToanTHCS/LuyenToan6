// 📌 Biến toàn cục
let base64Image = "";
let progressData = {};
let currentProblem = null;
let isGrading = false;
let apiKey = "";

// 🔹 1. Tải API Key từ server
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

// 🔹 2. Khởi tạo trang học sinh
async function initStudentPage() {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
        alert("⚠ Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
        window.location.href = "index.html";
        return;
    }

    console.log(`🔹 Đang tải dữ liệu học sinh: ${studentId}`);
    await loadProblems();
    await loadProgress(studentId);
    console.log("✅ Trang học sinh đã khởi tạo hoàn tất!");
}

// 🔹 3. Tải danh sách bài tập từ `problems.json`
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

// 🔹 4. Hiển thị danh sách bài tập
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
                problemBox.style.backgroundColor = "green"; // Bài đã làm
            } else {
                problemBox.style.backgroundColor = "yellow"; // Bài chưa làm
            }
        }

        updateProblemColor();

        problemBox.addEventListener("click", async () => {
            displayProblem(problem);
        });

        problemContainer.appendChild(problemBox);
    });

    console.log("✅ Danh sách bài tập đã cập nhật.");
}

// 🔹 5. Hiển thị nội dung bài tập
function displayProblem(problem) {
    document.getElementById("problemText").innerHTML = problem.problem;
    currentProblem = problem;
    MathJax.typesetPromise([document.getElementById("problemText")]).catch(err => console.error("MathJax lỗi:", err));
}

// 🔹 6. Gọi Gemini API để chấm bài
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
\`\`\`json
{
  "studentAnswer": "[Nội dung nhận diện từ ảnh]",
  "detailedSolution": "[Lời giải từng bước]",
  "gradingDetails": "[Cách chấm điểm]",
  "score": [Số từ 0-10],
  "feedback": "[Nhận xét chi tiết]",
  "suggestions": "[Đề xuất cải thiện]"
}
\`\`\`
`;

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
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log("📌 Phản hồi từ API:", data);
        return data;
    } catch (error) {
        console.error("❌ Lỗi khi gọi API Gemini:", error);
        return { score: 0, feedback: "Lỗi khi gọi AI.", suggestions: "Thử lại sau." };
    }
}

// 🔹 7. Khi nhấn "Chấm bài"
document.getElementById("submitBtn").addEventListener("click", async () => {
    if (isGrading || !currentProblem) return;

    const studentId = localStorage.getItem("studentId");
    const problemText = document.getElementById("problemText").innerText.trim();
    const studentFileInput = document.getElementById("studentImage");

    if (!problemText) return alert("⚠ Đề bài chưa được tải.");

    let base64Image = null;

    if (studentFileInput.files.length > 0) {
        try {
            base64Image = await getBase64(studentFileInput.files[0]);
        } catch (error) {
            alert("❌ Lỗi khi xử lý ảnh.");
            return;
        }
    }

    if (!base64Image) {
        alert("⚠ Vui lòng tải lên ảnh bài làm.");
        return;
    }

    try {
        isGrading = true;
        const response = await gradeWithGemini(base64Image, problemText, studentId);
        displayResult(response);
        await saveProgress(studentId, currentProblem.index, response.score);
    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
    } finally {
        isGrading = false;
    }
});

// 🚀 Chạy khi trang tải xong
document.addEventListener("DOMContentLoaded", async () => {
    await loadApiKey();
    await initStudentPage();
});
