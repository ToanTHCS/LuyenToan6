let currentKeyIndex = 0;  // Biến để theo dõi API key đang sử dụng
let base64Image = ""; // Biến toàn cục để lưu ảnh bài làm
let progressData = {}; // Biến lưu tiến trình học sinh
let currentProblem = null; // Biến lưu bài tập hiện tại
let isGrading = false; // Biến trạng thái để chống spam
let apiKey = ""; // Khai báo biến toàn cục để lưu API Key

function formatProblemText(problemText) {
    return problemText.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
}
// Tải API key từ server
async function loadApiKey() {
    try {
        const response = await fetch('/api/get-api-keys'); // Gọi API get-api-keys
        if (!response.ok) {
            throw new Error('Không thể tải API key');
        }
        const data = await response.json();
        apiKey = data.apiKey;  // Lưu API key duy nhất
        console.log('✅ API Key:', apiKey);

        if (!apiKey) {
            console.error("Không có API Key hợp lệ.");
        }
    } catch (error) {
        console.error('❌ Lỗi khi tải API Key:', error);
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

document.addEventListener("DOMContentLoaded", async function () {
    await loadApiKey(); // Tải API Key duy nhất khi trang được tải
    await initStudentPage();
});
// Hàm gửi yêu cầu API với API Key
async function makeApiRequest(apiUrl, requestBody) {
    console.log("🔹 Đang gửi request đến Gemini API:", JSON.stringify(requestBody, null, 2)); // Log request
    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API lỗi ${response.status}:`, errorText); // Log lỗi chi tiết
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ API error:', error);
        throw error;
    }
}

// Hàm gọi API Gemini để chấm bài
function displayResult(response) {
    const resultContainer = document.getElementById("result");

    if (!response || typeof response !== "object") {
        resultContainer.innerHTML = "<p>❌ Lỗi: Không có dữ liệu phản hồi từ API.</p>";
        return;
    }

    // Định dạng lại các trường có chứa nhiều dòng
    function formatText(text) {
        return text.replace(/\n/g, "<br>");
    }

    const formattedResponse = `
        <div class="result-box">
            <h3>📌 Bài làm của học sinh:</h3>
            <pre>${formatText(response.studentAnswer)}</pre>
            
            <h3>📝 Lời giải chi tiết:</h3>
            <pre>${formatText(response.detailedSolution)}</pre>
            
            <h3>📊 Cách chấm điểm:</h3>
            <pre>${formatText(response.gradingDetails)}</pre>
            
            <h3>🎯 Điểm số: ${response.score}/10</h3>
            
            <h3>📢 Nhận xét:</h3>
            <pre>${formatText(response.feedback)}</pre>
            
            <h3>🔍 Gợi ý cải thiện:</h3>
            <pre>${formatText(response.suggestions)}</pre>
        </div>
    `;

    resultContainer.innerHTML = formattedResponse;

    // Kích hoạt MathJax để hiển thị công thức toán
    MathJax.typesetPromise([resultContainer]).catch(err => console.error("MathJax rendering error:", err));
}

// Hàm xử lý ảnh trước khi gửi lên AI (ĐÃ SỬA LẠI)
async function preprocessImage(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function () {
            console.log("📷 Đã đọc ảnh thành công!");

            const img = new Image();
            img.src = reader.result;

            img.onload = function () {
                console.log(`📏 Kích thước ảnh gốc: ${img.width}x${img.height}`);

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // Resize ảnh nếu quá lớn
                const maxSize = 800;
                let width = img.width;
                let height = img.height;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height *= maxSize / width;
                        width = maxSize;
                    } else {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                console.log(`📏 Ảnh sau khi resize: ${canvas.width}x${canvas.height}`);

                // Chuyển ảnh sang grayscale
                const imageData = ctx.getImageData(0, 0, width, height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                    imageData.data[i] = avg; // R
                    imageData.data[i + 1] = avg; // G
                    imageData.data[i + 2] = avg; // B
                }
                ctx.putImageData(imageData, 0, 0);

                console.log("✅ Ảnh đã xử lý thành công!");

                // Lấy dữ liệu Base64, loại bỏ tiền tố "data:image/jpeg;base64,"
                const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];
                console.log("📌 Base64 đã xử lý:", base64Image.substring(0, 100) + "..."); // Log 100 ký tự đầu để kiểm tra

                resolve(base64Image);
            };

            img.onerror = function (err) {
                console.error("❌ Lỗi khi tải ảnh:", err);
                reject("Lỗi khi tải ảnh.");
            };
        };

        reader.onerror = function (err) {
            console.error("❌ Lỗi khi đọc ảnh:", err);
            reject("Lỗi khi đọc ảnh.");
        };

        reader.readAsDataURL(imageFile);
    });
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
            base64Image = await preprocessImage(studentFileInput.files[0]); // Dùng ảnh đã xử lý
        } catch (error) {
            alert("❌ Lỗi khi xử lý ảnh. Vui lòng thử lại.");
            console.error("Lỗi khi xử lý ảnh:", error);
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
        const response = await gradeWithGemini(base64Image, problemText, studentId);

        // Hiển thị kết quả
        document.getElementById("result").innerHTML = `<pre>${JSON.stringify(response, null, 2)}</pre>`;

    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        document.getElementById("result").innerText = `❌ Lỗi: ${error.message}`;
    } finally {
        isGrading = false;
    }
});

