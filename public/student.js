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
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;  // Chuyển sang API Key tiếp theo
    return apiKey;
}

// 🛠 Gửi request API có luân phiên API Key và retry khi lỗi
async function makeApiRequest(url, body, maxRetries = 5, delay = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiKey = getNextApiKey(); // Lấy API Key tiếp theo
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

// 🛠 Hàm xử lý chấm bài bằng Gemini API
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
    const formattedProblemText = formatProblemText(problemText);

    const promptText = `
Học sinh: ${studentId}
Đề bài:
${formattedProblemText}

Hãy thực hiện các bước sau:
1. Nhận diện bài làm của học sinh từ hình ảnh và gõ lại dưới dạng văn bản.
2. Giải bài toán và cung cấp lời giải chi tiết.
3. So sánh bài làm của học sinh với đáp án đúng, chấm điểm chi tiết.
4. Trả về JSON với thông tin kết quả.
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

        return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error('Lỗi:', error.message);
        return { error: "Không thể xử lý bài làm." };
    }
}

// 🛠 Khi nhấn nút "Chấm bài"
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

    let base64Image = null;
    if (studentFileInput.files.length > 0) {
        base64Image = await getBase64(studentFileInput.files[0]);
    }
    if (!base64Image) {
        alert("⚠ Vui lòng tải lên ảnh bài làm hoặc chụp ảnh từ camera.");
        return;
    }

    try {
        isGrading = true;
        document.getElementById("result").innerText = "🔄 Đang chấm bài...";

        const result = await gradeWithGemini(base64Image, problemText, studentId);
        if (result.error) {
            throw new Error(result.error);
        }

        document.getElementById("result").innerHTML = `
            <p><strong>📌 Bài làm của học sinh:</strong><br>${result.studentAnswer}</p>
            <p><strong>📝 Lời giải chi tiết:</strong><br>${result.detailedSolution}</p>
            <p><strong>📊 Chấm điểm chi tiết:</strong><br>${result.gradingDetails}</p>
            <p><strong>🏆 Điểm số:</strong> ${result.score}/10</p>
            <p><strong>💡 Nhận xét:</strong><br>${result.feedback}</p>
            <p><strong>🔧 Đề xuất cải thiện:</strong><br>${result.suggestions}</p>
        `;
        alert(`✅ Bài tập đã được chấm! Bạn đạt ${result.score}/10 điểm.`);
    } catch (error) {
        console.error("❌ Lỗi khi chấm bài:", error);
        document.getElementById("result").innerText = `Lỗi: ${error.message}`;
    } finally {
        isGrading = false;
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    await loadApiKeys();
    console.log("✅ Đã tải API Keys và sẵn sàng chấm bài!");
});
