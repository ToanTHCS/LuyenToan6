let currentKeyIndex = 0;  // Biến để theo dõi API key đang sử dụng
let apiKeys = [];  // Biến lưu API key duy nhất

let base64Image = ""; // Biến toàn cục để lưu ảnh bài làm
let progressData = {}; // Biến lưu tiến trình học sinh
let currentProblem = null; // Biến lưu bài tập hiện tại

// Tải API key từ server (GPT, chỉ 1 API key)
async function loadApiKeys() {
    try {
        const response = await fetch('/api/get-api-keys'); // Gọi API để lấy API key GPT
        if (!response.ok) {
            throw new Error('Không thể tải API key');
        }
        const data = await response.json();
        
        if (data.apiKey) {
            // GPT API - Chỉ lấy 1 API key duy nhất
            apiKeys = [data.apiKey]; 
            console.log('API Key (GPT):', apiKeys);
        }

        if (!apiKeys || apiKeys.length === 0) {
            console.error("Không có API key hợp lệ.");
        } else {
            console.log(`Có ${apiKeys.length} API key hợp lệ.`);
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

// Hàm lấy API key duy nhất từ danh sách
function getNextApiKey() {
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return apiKey;
}

document.addEventListener("DOMContentLoaded", async function () {
    await loadApiKeys(); // Tải API key khi trang được tải
    await initStudentPage();
});

// Hàm gửi yêu cầu API với API key
async function makeApiRequest(apiUrl, requestBody) {
    let attempts = 0;
    while (attempts < apiKeys.length) {
        const apiKey = getNextApiKey(); // Lấy API key duy nhất từ danh sách
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

// Hàm gọi API GPT để chấm bài
async function gradeWithGPT(base64Image, problemText, studentId) {
    const apiUrl = 'https://api.openai.com/v1/completions';  // Endpoint GPT

    const promptText = `
    Học sinh: ${studentId}
    Đề bài:
    ${problemText}

    Hãy thực hiện các bước sau:
    1. Nhận diện và gõ lại bài làm của học sinh từ hình ảnh thành văn bản một cách chính xác, tất cả công thức Toán viết dưới dạng Latex, bọc trong dấu $, không tự suy luận nội dung hình ảnh, chỉ gõ lại chính xác các nội dung nhận diện được từ hình ảnh.
    2. Giải bài toán và cung cấp lời giải chi tiết cho từng phần, lời giải phù hợp học sinh lớp 7 học theo chương trình 2018.
    3. So sánh bài làm của học sinh với đáp án đúng, chấm chi tiết từng bước làm đến kết quả.
    4. Chấm điểm bài làm của học sinh trên thang điểm 10, cho 0 điểm với bài giải không đúng yêu cầu đề bài. Giải thích chi tiết cách tính điểm cho từng phần.
    5. Đưa ra nhận xét chi tiết và đề xuất cải thiện.
    6. Kiểm tra lại kết quả chấm điểm và đảm bảo tính nhất quán giữa bài làm, lời giải, và điểm số.
    
    🚨 KẾT QUẢ PHẢI TRẢ VỀ ĐÚNG 6 DÒNG, THEO ĐỊNH DẠNG SAU:
    1. Bài làm của học sinh: [Bài làm được nhận diện từ hình ảnh]
    2. Lời giải chi tiết: [Lời giải từng bước]
    3. Chấm điểm chi tiết: [Giải thích cách chấm điểm]
    4. Điểm số: [Điểm trên thang điểm 10]
    5. Nhận xét: [Nhận xét chi tiết]
    6. Đề xuất cải thiện: [Các đề xuất cụ thể]

    ❗Nếu không thể nhận diện hình ảnh hoặc có lỗi, hãy trả về "Không thể xử lý".  
    ❗Điểm số phải là số từ 0 đến 10, có thể có một chữ số thập phân.
    ❗Nếu có sự không nhất quán giữa bài làm và điểm số, hãy giải thích rõ lý do.
    `;

    const requestBody = {
        model: "gpt-3.5-turbo",  // Sử dụng mô hình GPT-3 thay vì GPT-4
        messages: [
            { role: "system", content: "Bạn là một chuyên gia toán học và giáo viên, giúp chấm điểm bài làm của học sinh." },
            { role: "user", content: promptText }
        ],
        max_tokens: 1500,
        temperature: 0.5
    };

    const apiKey = apiKeys[0]; // Lấy API key duy nhất

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,  // Đảm bảo rằng API key được nối đúng với tiền tố 'Bearer '
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        
        // Kiểm tra phản hồi từ API
        if (!response.ok || !result.choices || result.choices.length === 0) {
            console.error("API GPT Error:", result);  // Hiển thị lỗi nếu phản hồi không hợp lệ
            throw new Error("Không nhận được kết quả hợp lệ từ API.");
        }

        // Kiểm tra cấu trúc dữ liệu và trả về kết quả
        console.log("API GPT Result:", result);
        return result.choices[0].message.content;  // Trả về nội dung kết quả từ OpenAI
    } catch (error) {
        console.error('Lỗi khi gọi API GPT:', error);
        throw new Error("Đã xảy ra lỗi khi gọi API GPT.");
    }
}

document.getElementById("submitBtn").addEventListener("click", async () => {
    console.log("Nút chấm bài đã được nhấn");

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

    if (!base64Image && studentFileInput.files.length === 0) {
        alert("⚠ Vui lòng tải lên ảnh bài làm hoặc chụp ảnh từ camera.");
        return;
    }

    if (!base64Image && studentFileInput.files.length > 0) {
        base64Image = await getBase64(studentFileInput.files[0]);
    }

    try {
        document.getElementById("result").innerText = "🔄 Đang chấm bài...";
        // Gọi lại hàm gradeWithGPT đã có
        const { studentAnswer, feedback, score } = await gradeWithGPT(base64Image, problemText, studentId);
        await saveProgress(studentId, score);

        document.getElementById("result").innerHTML = feedback;
        MathJax.typesetPromise([document.getElementById("result")]).catch(err => console.error("MathJax lỗi:", err));

        alert(`✅ Bài tập đã được chấm! Bạn đạt ${score}/10 điểm.`);
        progressData[currentProblem.index] = true;
        updateProgressUI();
    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        document.getElementById("result").innerText = `Lỗi: ${error.message}`;
    }
});

