let currentKeyIndex = 0;  // Biến để theo dõi API key đang sử dụng
let apiKeys = [];  // Biến lưu API keys

let base64Image = ""; // Biến toàn cục để lưu ảnh bài làm
let progressData = {}; // Biến lưu tiến trình học sinh
let currentProblem = null; // Biến lưu bài tập hiện tại
let isGrading = false; // Biến trạng thái để chống spam
// student.js - Quản lý tiến trình học sinh và chấm bài
let currentStudentId = null;  // ID học sinh đăng nhập
const GITHUB_PROGRESS_URL = "https://raw.githubusercontent.com/ToanTHCS/LuyenToan6/main/data/progress.json";
const GITHUB_RESULTS_URL = "https://raw.githubusercontent.com/ToanTHCS/LuyenToan6/main/data/results.json";
const GITHUB_SAVE_PROGRESS_URL = "https://api.github.com/repos/ToanTHCS/LuyenToan6/contents/data/progress.json";

// Hàm lấy GitHub token từ biến môi trường
async function getGitHubToken() {
    try {
        const response = await fetch("/api/get-github-token");
        if (!response.ok) throw new Error("Không thể lấy GitHub token");
        const data = await response.json();
        return data.githubToken;
    } catch (error) {
        console.error("❌ Lỗi khi lấy GitHub token:", error);
        return null;
    }
}

// Tải tiến trình từ GitHub
async function loadProgress() {
    try {
        console.log("📥 Đang tải tiến trình từ GitHub...");
        const response = await fetch(GITHUB_PROGRESS_URL);
        if (!response.ok) throw new Error("Không thể tải tiến trình từ GitHub.");
        progressData = await response.json();
        console.log("✅ Tiến trình đã tải thành công:", progressData);
        displayProblemList();
    } catch (error) {
        console.error("❌ Lỗi khi tải tiến trình:", error);
        progressData = {};
    }
}

// Hiển thị danh sách bài tập với trạng thái màu sắc

// Hiển thị danh sách bài tập với trạng thái màu sắc
function updateProblemList() {
    const problemContainer = document.getElementById("problemList");
    problemContainer.innerHTML = "";

    problems.forEach(problem => {
        const problemBox = document.createElement("div");
        problemBox.textContent = problem.index;
        problemBox.className = "problem-box";
        problemBox.dataset.id = problem.index;

        function updateProblemColor() {
            if (progressData[currentStudentId]?.history.includes(problem.index)) {
                problemBox.style.backgroundColor = "green";
            } else {
                problemBox.style.backgroundColor = "yellow";
            }
        }

        updateProblemColor();

        problemBox.addEventListener("click", async () => {
            if (!progressData[currentStudentId]?.history.includes(problem.index)) {
                problemBox.style.backgroundColor = "blue";
            }
            displayProblem(problem);
        });

        problemContainer.appendChild(problemBox);
    });
}

// Lưu tiến trình lên GitHub JSON
async function saveProgress() {
    try {
        console.log("📤 Đang gửi tiến trình lên GitHub...");
        const githubToken = await getGitHubToken();
        if (!githubToken) throw new Error("Không có GitHub token.");

        if (!progressData[currentStudentId]) {
            progressData[currentStudentId] = { completedExercises: 0, averageScore: 0, history: [] };
        }
        if (!progressData[currentStudentId].history.includes(currentProblem.index)) {
            progressData[currentStudentId].history.push(currentProblem.index);
        }
        progressData[currentStudentId].completedExercises = progressData[currentStudentId].history.length;

        const updatedData = {
            message: "Cập nhật tiến trình học sinh",
            content: btoa(JSON.stringify(progressData, null, 2)),
        };

        const response = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `token ${githubToken}`
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) throw new Error("Lỗi khi lưu tiến trình vào GitHub.");
        console.log("✅ Tiến trình đã được lưu!");
        await loadProgress();
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}
function formatProblemText(problemText) {
    return problemText.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
}
// Tải API keys từ server
async function loadApiKeys() {
    try {
        const response = await fetch('/api/get-api-keys'); // Gọi API get-api-keys
        if (!response.ok) {
            throw new Error('Không thể tải API keys');
        }
        const data = await response.json();
        apiKeys = data.apiKeys;  // Lấy dữ liệu API keys
        console.log('API Keys:', apiKeys);

        if (apiKeys.length === 0) {
            console.error("Không có API keys hợp lệ.");
        } else {
            console.log(`Có ${apiKeys.length} API keys hợp lệ.`);
        }
    } catch (error) {
        console.error('Lỗi khi tải API keys:', error);
    }
}

// Hàm khởi tạo trang học sinh
async function initStudentPage() {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
        alert("⚠ Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
        window.location.href = "index.html"; // Chuyển hướng về trang đăng nhập
        return;
    }

    console.log(`🔹 Đang tải dữ liệu học sinh: ${studentId}`);
    await loadStudentData(studentId);
    await loadProblems();
    await loadProgress(studentId);
    console.log("✅ Trang học sinh đã khởi tạo hoàn tất!");
}

// Hàm tải dữ liệu học sinh từ `students.json`
const loadStudentData = async (studentId) => {
    try {
        const response = await fetch('/api/get-students');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách học sinh.");
        }
        const studentsObject = await response.json();  // Lấy dữ liệu từ API

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
};

// Hàm tải danh sách bài tập từ `problems.json`
const loadProblems = async () => {
    try {
        const response = await fetch('/api/get-problems');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách bài tập!");
        }
        const problems = await response.json();
        console.log("✅ Danh sách bài tập:", problems);
        displayProblemList(problems);
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách bài tập:", error);
    }
};

// Hiển thị danh sách bài tập
function displayProblemList(problems) {
    const problemContainer = document.getElementById("problemList");
    problemContainer.innerHTML = ""; // Xóa danh sách cũ nếu có

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
            if (progressData[problem.index]) {
                alert("📌 Bài tập này đã làm! Vui lòng chọn bài tập khác hoặc chọn bài tương tự.");
                return;
            }
            displayProblem(problem); // Hiển thị nội dung bài tập
        });

        problemContainer.appendChild(problemBox);
    });

    console.log("✅ Danh sách bài tập đã cập nhật.");
}

// Hiển thị nội dung bài tập khi học sinh chọn bài
function displayProblem(problem) {
    document.getElementById("problemText").innerHTML = problem.problem; // Hiển thị đề bài
    currentProblem = problem; // Lưu bài tập hiện tại
    MathJax.typesetPromise([document.getElementById("problemText")]).catch(err => console.error("MathJax lỗi:", err));
}

// Tải tiến trình học sinh
async function loadProgress(studentId) {
    try {
        const response = await fetch(`/api/get-progress?studentId=${studentId}`);
        const progress = await response.json();
        progressData = progress || {}; // Lưu vào biến toàn cục
        console.log(`✅ Tiến trình của học sinh ${studentId}:`, progressData);
        updateProgressUI();
    } catch (error) {
        console.error("❌ Lỗi khi tải tiến trình:", error);
    }
}

// Cập nhật tiến trình UI
function updateProgressUI() {
    document.getElementById("completedExercises").textContent = progressData.completedExercises || 0;
    document.getElementById("averageScore").textContent = progressData.averageScore || 0;
}

// Lưu tiến trình học sinh vào `progress.json`
async function saveProgress(studentId, score) {
    try {
        let completedExercises = progressData.completedExercises || 0;
        let totalScore = (progressData.averageScore || 0) * completedExercises;
        completedExercises += 1;
        let averageScore = (totalScore + score) / completedExercises;

        progressData.completedExercises = completedExercises;
        progressData.averageScore = averageScore;

        await fetch("/api/save-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, completedExercises, averageScore })
        });

        console.log(`✅ Tiến trình đã được cập nhật: ${completedExercises} bài, Điểm TB: ${averageScore.toFixed(2)}`);
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
    }
}

// Chuyển đổi ảnh thành Base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
    });
}

// Hàm lấy API key tiếp theo từ danh sách
function getNextApiKey() {
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return apiKey;
}

document.addEventListener("DOMContentLoaded", async function () {
    await loadApiKeys(); // Tải API keys khi trang được tải
    await initStudentPage();
});
// Hàm gửi yêu cầu API với API key
async function makeApiRequest(apiUrl, requestBody) {
    let attempts = 0;
    while (attempts < apiKeys.length) {
        const apiKey = getNextApiKey(); // Lấy API key từ danh sách
        try {
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                return await response.json();
            } else if (response.status === 403) {
                console.log(`API key expired: ${apiKey}`);
                attempts++;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('API error:', error);
            attempts++;
        }
    }
    throw new Error('All API keys exhausted.');
}
// Hàm gọi API Gemini để chấm bài
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';

    // Format đề bài trước khi gửi lên API
    const formattedProblemText = formatProblemText(problemText);

    const promptText = `
Học sinh: ${studentId}
Đề bài:
${formattedProblemText}

Hãy thực hiện các bước sau:
1. Nhận diện bài làm của học sinh từ hình ảnh và gõ lại dưới dạng văn bản, công thức Toán viết bằng Latex ($...$).
2. Giải bài toán và cung cấp lời giải chi tiết theo chương trình lớp 7.
3. So sánh bài làm của học sinh với đáp án đúng, chấm điểm chi tiết.
4. Chấm điểm trên thang 10, nếu sai hoàn toàn thì cho 0 điểm.
5. Đưa ra nhận xét chi tiết và đề xuất cải thiện.
6. Trả về kết quả **đúng định dạng JSON** sau, không thêm nội dung thừa:

{
  "studentAnswer": "[Nội dung nhận diện]",
  "detailedSolution": "[Lời giải từng bước]",
  "gradingDetails": "[Giải thích cách chấm]",
  "score": [Số từ 0-10],
  "feedback": "[Nhận xét chi tiết]",
  "suggestions": "[Các đề xuất]"
}

Nếu không thể nhận diện hoặc lỗi, trả về JSON:
{
  "error": "Không thể xử lý hình ảnh hoặc nhận diện bài làm."
}
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

    try {
        const data = await makeApiRequest(apiUrl, requestBody);

        console.log("🔍 Full API Response:", JSON.stringify(data, null, 2));

        if (!data?.candidates?.length || !data.candidates[0]?.content?.parts?.length) {
            throw new Error("API không trả về dữ liệu hợp lệ.");
        }

        let responseText = data.candidates[0].content.parts[0].text;

        if (!responseText) {
            throw new Error("API trả về phản hồi rỗng.");
        }

        // Kiểm tra nếu API trả về lỗi
        if (responseText.includes("Không thể xử lý")) {
            throw new Error("Không thể nhận diện hoặc xử lý hình ảnh.");
        }

        // Cố gắng parse JSON từ phản hồi API
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(responseText);
        } catch (jsonError) {
            console.error("❌ Lỗi khi parse JSON từ API:", jsonError);
            console.log("Dữ liệu API nhận được:", responseText);
            throw new Error("API không trả về đúng định dạng JSON.");
        }

        // Kiểm tra nếu JSON hợp lệ và đủ dữ liệu
        if (!jsonResponse.studentAnswer || !jsonResponse.detailedSolution || !jsonResponse.gradingDetails || 
            typeof jsonResponse.score !== "number" || !jsonResponse.feedback || !jsonResponse.suggestions) {
            console.error("❌ API trả về dữ liệu thiếu:", jsonResponse);
            throw new Error("API không trả về đủ thông tin cần thiết.");
        }

        return {
            studentAnswer: jsonResponse.studentAnswer.trim() || "Không có dữ liệu",
            detailedSolution: jsonResponse.detailedSolution.trim() || "Không có dữ liệu",
            gradingDetails: jsonResponse.gradingDetails.trim() || "Không có dữ liệu",
            score: jsonResponse.score || 0,
            feedback: jsonResponse.feedback.trim() || "Không có dữ liệu",
            suggestions: jsonResponse.suggestions.trim() || "Không có dữ liệu"
        };

    } catch (error) {
        console.error('Lỗi:', error.message);
        return {
            studentAnswer: "Lỗi xử lý",
            detailedSolution: "Lỗi xử lý",
            gradingDetails: "Lỗi xử lý",
            score: 0,
            feedback: `Lỗi: ${error.message}`,
            suggestions: "Lỗi xử lý"
        };
    }
}

// Hàm khi nhấn nút "Chấm bài"
document.getElementById("submitBtn").addEventListener("click", async () => {
    if (isGrading) {
        alert("⏳ Hệ thống đang chấm bài, vui lòng đợi...");
        return;
    }

    if (!currentProblem) {
        alert("⚠ Vui lòng chọn bài tập trước khi chấm.");
        return;
    }

    const studentId = localStorage.getItem("studentId");
    const problemText = document.getElementById("problemText").innerText.trim();
    const studentFileInput = document.getElementById("studentImage");

    if (!problemText) {
        alert("⚠ Đề bài chưa được tải.");
        return;
    }

    let base64Image = null;

    if (studentFileInput.files.length > 0) {
        try {
            base64Image = await getBase64(studentFileInput.files[0]);
        } catch (error) {
            alert("❌ Lỗi khi xử lý ảnh. Vui lòng thử lại.");
            console.error("Lỗi khi chuyển ảnh sang Base64:", error);
            return;
        }
    }

    if (!base64Image) {
        alert("⚠ Vui lòng tải lên ảnh bài làm hoặc chụp ảnh từ camera.");
        return;
    }

    try {
        isGrading = true;
        document.getElementById("result").innerText = "🔄 Đang chấm bài...";

        // Gọi API chấm bài
        const { studentAnswer, detailedSolution, gradingDetails, score, feedback, suggestions } = 
            await gradeWithGemini(base64Image, problemText, studentId);

        await saveProgress(studentId, score);

        // Hiển thị kết quả
        document.getElementById("result").innerHTML = `
            <p><strong>📌 Bài làm của học sinh:</strong><br>${studentAnswer}</p>
            <p><strong>📝 Lời giải chi tiết:</strong><br>${detailedSolution}</p>
            <p><strong>📊 Chấm điểm chi tiết:</strong><br>${gradingDetails}</p>
            <p><strong>🏆 Điểm số:</strong> ${score}/10</p>
            <p><strong>💡 Nhận xét:</strong><br>${feedback}</p>
            <p><strong>🔧 Đề xuất cải thiện:</strong><br>${suggestions}</p>
        `;
        
        // Xử lý MathJax nếu có
        if (window.MathJax) {
            MathJax.typesetPromise([document.getElementById("result")]).catch(err => 
                console.error("MathJax lỗi:", err)
            );
        }

        alert(`✅ Bài tập đã được chấm! Bạn đạt ${score}/10 điểm.`);
        progressData[currentProblem.index] = true;
        updateProgressUI();
    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        document.getElementById("result").innerText = `Lỗi: ${error.message}`;
    } finally {
        isGrading = false;
    }
});


