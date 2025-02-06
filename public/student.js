let currentKeyIndex = 0;  // Chỉ mục API Key hiện tại
let apiKeys = [];  // Danh sách API Keys
let base64Image = ""; // Lưu ảnh bài làm
let progressData = {}; // Lưu tiến trình học sinh
let currentProblem = null; // Lưu bài tập hiện tại
let isGrading = false; // Trạng thái chống spam

// 🛠 Tải danh sách API Keys từ server
async function loadApiKeys() {
    try {
        const response = await fetch('/api/get-api-keys');
        if (!response.ok) throw new Error('Không thể tải API keys');

        const data = await response.json();
        apiKeys = data.apiKeys.filter(key => key);  // Lọc ra API Key hợp lệ

        if (apiKeys.length === 0) throw new Error("Không có API keys hợp lệ.");
        console.log(`✅ Đã tải ${apiKeys.length} API keys`);
    } catch (error) {
        console.error('❌ Lỗi khi tải API keys:', error);
    }
}

// 🛠 Chọn API Key tiếp theo để luân phiên
function getNextApiKey() {
    if (apiKeys.length === 0) {
        console.error("❌ Không có API keys nào khả dụng!");
        return null;
    }
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;  // Chuyển sang API Key tiếp theo
    return apiKey;
}

// 🛠 Gửi request API có luân phiên API Key và retry khi lỗi
async function makeApiRequest(url, body, maxRetries = 5, delay = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiKey = getNextApiKey(); // Lấy API Key tiếp theo
            if (!apiKey) throw new Error("Không tìm thấy API Key để sử dụng.");
            console.log(`🔑 Dùng API Key: ${apiKey} (Lần thử: ${attempt})`);

            const response = await fetch(`${url}?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (response.status === 403 || response.status === 429) {
                console.warn(`⚠️ API Key bị chặn (403/429). Chuyển sang API Key tiếp theo...`);
                await new Promise(res => setTimeout(res, delay));  // Đợi trước khi thử lại
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`❌ API lỗi (lần thử ${attempt}):`, error);
            if (attempt === maxRetries) throw new Error("API lỗi sau nhiều lần thử.");
            await new Promise(res => setTimeout(res, delay));  // Đợi trước khi thử lại
        }
    }
}

// 🛠 Tải danh sách bài tập từ API
async function loadProblems() {
    try {
        const response = await fetch('/api/get-problems');
        if (!response.ok) {
            throw new Error("Không thể tải danh sách bài tập!");
        }
        const problems = await response.json();
        console.log("✅ Danh sách bài tập:", problems);
        displayProblemList(problems); // Hiển thị danh sách bài tập
    } catch (error) {
        console.error("❌ Lỗi khi tải danh sách bài tập:", error);
    }
}

// 🛠 Hiển thị danh sách bài tập
function displayProblemList(problems) {
    const problemContainer = document.getElementById("problemList");
    if (!problemContainer) {
        console.error("❌ Không tìm thấy phần tử #problemList để hiển thị bài tập!");
        return;
    }

    problemContainer.innerHTML = ""; // Xóa danh sách cũ nếu có

    problems.forEach(problem => {
        const problemBox = document.createElement("div");
        problemBox.textContent = problem.index;
        problemBox.className = "problem-box";
        problemBox.dataset.id = problem.index;

        problemBox.addEventListener("click", () => {
            displayProblem(problem); // Hiển thị nội dung bài tập khi người dùng nhấn vào
        });

        problemContainer.appendChild(problemBox);
    });

    console.log("✅ Danh sách bài tập đã cập nhật.");
}

// 🛠 Hiển thị bài tập khi chọn
function displayProblem(problem) {
    document.getElementById("problemText").innerText = problem.problem;
    currentProblem = problem;
}

// Gọi hàm loadProblems() khi trang tải xong
document.addEventListener("DOMContentLoaded", async function () {
    await loadApiKeys();
    await loadProblems();
    console.log("✅ Đã tải API Keys và danh sách bài tập!");
});
