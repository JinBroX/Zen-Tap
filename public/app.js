// ======== Zen-Tap 预生成数据查表系统 ========
// 版本: 2.0 - 64卦专用版
// 功能: 加载64卦数据 + 单卦查询 + 错误处理

// ======== 1. 全局变量 ========
let ZEN_OUTPUTS = null;
let IS_LOADING = false;
let LOAD_ERROR = null;

// ======== 2. 64卦数据 ========
const HEXAGRAMS = [
  "乾", "坤", "屯", "蒙", "需", "讼", "师", "比", 
  "小畜", "履", "泰", "否", "同人", "大有", "谦", "豫",
  "随", "蛊", "临", "观", "噬嗑", "贲", "剥", "复",
  "无妄", "大畜", "颐", "大过", "坎", "离", "咸", "恒",
  "遁", "大壮", "晋", "明夷", "家人", "睽", "蹇", "解",
  "损", "益", "夬", "姤", "萃", "升", "困", "井",
  "革", "鼎", "震", "艮", "渐", "归妹", "丰", "旅",
  "巽", "兑", "涣", "节", "中孚", "小过", "既济", "未济"
];

// ======== 3. 数据加载函数 ========
async function loadZenOutputs() {
    if (ZEN_OUTPUTS) {
        console.log("✓ 使用缓存数据");
        return ZEN_OUTPUTS;
    }
    
    if (IS_LOADING) {
        console.log("⏳ 数据加载中，请等待...");
        // 等待加载完成
        while (IS_LOADING) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return ZEN_OUTPUTS;
    }
    
    IS_LOADING = true;
    LOAD_ERROR = null;
    
    try {
        console.log("🔄 开始加载64卦数据...");
        
        // 显示加载状态
        showLoadingState();
        
        const response = await fetch('/data/zen_outputs.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
            throw new Error("64卦数据文件为空或格式错误");
        }
        
        ZEN_OUTPUTS = data;
        console.log(`✓ 64卦数据加载成功，共 ${Object.keys(ZEN_OUTPUTS).length} 卦`);
        console.log("可用卦名:", Object.keys(ZEN_OUTPUTS));
        
        hideLoadingState();
        return ZEN_OUTPUTS;
        
    } catch (error) {
        console.error("❌ 加载64卦数据失败:", error);
        LOAD_ERROR = error.message;
        showErrorState(`数据加载失败: ${error.message}`);
        return null;
    } finally {
        IS_LOADING = false;
    }
}

// ======== 4. 起卦算法 ========
function getRandomHexagram() {
    return HEXAGRAMS[Math.floor(Math.random() * HEXAGRAMS.length)];
}

function computeHexagram() {
    const main = getRandomHexagram();
    // 趋势和变化暂时不使用，因为当前数据文件只有主卦信息
    const trend = getRandomHexagram();
    const change = Math.floor(Math.random() * 3);
    
    console.log(`🎯 生成卦象: 主卦=${main}`);
    
    return { main, trend, change };
}

// ======== 5. 查表核心函数 ========
async function getZenResult(main, trend, change) {
    try {
        const outputs = await loadZenOutputs();
        
        if (!outputs) {
            throw new Error("数据未加载成功");
        }
        
        // 直接使用主卦作为键（因为数据文件只有主卦数据）
        const result = outputs[main];
        
        console.log('=== 调试信息 ===');
        console.log('查询主卦:', main);
        console.log('所有可用卦名:', Object.keys(outputs));
        console.log('匹配结果:', result);
        console.log('================');
        
        if (!result) {
            console.warn(`⚠️ 未找到对应结果: ${main}`);
            
            // 尝试返回第一个可用的结果
            const firstKey = Object.keys(outputs)[0];
            if (firstKey) {
                console.log(`🔄 使用第一个可用结果: ${firstKey}`);
                return outputs[firstKey];
            }
            
            return null;
        }
        
        console.log("✅ 找到匹配结果");
        return result;
        
    } catch (error) {
        console.error("❌ 查询失败:", error);
        return null;
    }
}

// ======== 6. 前端交互函数 ========
function showLoadingState() {
    const btn = document.getElementById("scanBtn");
    const originalText = btn.textContent;
    btn.textContent = "加载中...";
    btn.disabled = true;
    btn.setAttribute("data-original-text", originalText);
}

function hideLoadingState() {
    const btn = document.getElementById("scanBtn");
    const originalText = btn.getAttribute("data-original-text") || "开始扫描";
    btn.textContent = originalText;
    btn.disabled = false;
}

function showErrorState(message) {
    const resultBox = document.getElementById("resultBox");
    const statusEl = document.getElementById("status");
    
    statusEl.textContent = message;
    statusEl.style.color = "#ff6b6b";
    
    // 清空其他字段
    document.getElementById("trend").textContent = "";
    document.getElementById("warning").textContent = "";
    document.getElementById("closing").textContent = "";
    
    resultBox.classList.remove("hidden");
}

function displayResult(result) {
    const resultBox = document.getElementById("resultBox");
    const statusEl = document.getElementById("status");
    
    // 重置样式
    statusEl.style.color = "";
    
    // 填充结果 - 使用64卦数据结构的字段
    document.getElementById("status").textContent = result.modern_meaning || "暂无状态信息";
    document.getElementById("trend").textContent = result.trend || "暂无趋势信息";
    document.getElementById("warning").textContent = result.advice || "暂无注意事项";
    document.getElementById("closing").textContent = result.imagery || "暂无意象信息";
    
    // 显示结果框
    resultBox.classList.remove("hidden");
    
    // 添加显示动画
    resultBox.style.opacity = "0";
    resultBox.style.transform = "translateY(10px)";
    resultBox.classList.remove("hidden");
    
    setTimeout(() => {
        resultBox.style.transition = "all 0.3s ease";
        resultBox.style.opacity = "1";
        resultBox.style.transform = "translateY(0)";
    }, 50);
}

// ======== 7. 主流程函数 ========
async function handleScanClick() {
    console.log("🔄 开始扫描流程...");
    
    try {
        // 生成卦象
        const { main, trend, change } = computeHexagram();
        
        // 更新按钮状态
        const btn = document.getElementById("scanBtn");
        btn.textContent = "查询中...";
        btn.disabled = true;
        
        // 查询结果
        const result = await getZenResult(main, trend, change);
        
        if (result) {
            displayResult(result);
        } else {
            showErrorState("未找到对应的卦象结果。请确保数据文件已正确部署。");
        }
        
    } catch (error) {
        console.error("❌ 扫描流程错误:", error);
        showErrorState(`系统错误: ${error.message}`);
    } finally {
        // 恢复按钮状态
        hideLoadingState();
    }
}

// ======== 8. 初始化函数 ========
async function initializeApp() {
    console.log("🚀 初始化 Zen-Tap 64卦应用...");
    
    // 预加载数据（但不阻塞界面）
    setTimeout(() => {
        loadZenOutputs().then(outputs => {
            if (outputs) {
                console.log("✓ 64卦应用初始化完成");
                
                // 更新按钮状态提示
                const btn = document.getElementById("scanBtn");
                btn.style.backgroundColor = "#4ecdc4";
                btn.textContent = "开始扫描 (64卦)";
            }
        });
    }, 1000);
    
    // 绑定事件
    document.getElementById("scanBtn").addEventListener("click", handleScanClick);
    
    // 添加键盘快捷键
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space" || event.code === "Enter") {
            event.preventDefault();
            handleScanClick();
        }
    });
    
    console.log("✅ 事件绑定完成，64卦应用已就绪");
}

// ======== 9. 页面加载完成后初始化 ========
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}

// ======== 10. 调试工具函数 ========
window.zenDebug = {
    // 查看加载的数据
    checkData: () => {
        console.log("当前加载数据:", ZEN_OUTPUTS);
        return ZEN_OUTPUTS;
    },
    
    // 手动重新加载数据
    reloadData: () => {
        ZEN_OUTPUTS = null;
        return loadZenOutputs();
    },
    
    // 测试特定卦象查询
    testQuery: (hexagramName) => {
        return getZenResult(hexagramName, "", 0);
    },
    
    // 查看所有可用卦名
    listHexagrams: () => {
        return ZEN_OUTPUTS ? Object.keys(ZEN_OUTPUTS) : [];
    },
    
    // 查看加载状态
    getStatus: () => {
        return {
            isLoaded: !!ZEN_OUTPUTS,
            isLoading: IS_LOADING,
            error: LOAD_ERROR,
            hexagramCount: ZEN_OUTPUTS ? Object.keys(ZEN_OUTPUTS).length : 0,
            availableHexagrams: ZEN_OUTPUTS ? Object.keys(ZEN_OUTPUTS) : []
        };
    },
    
    // 直接显示指定卦象
    showHexagram: (name) => {
        const result = ZEN_OUTPUTS ? ZEN_OUTPUTS[name] : null;
        if (result) {
            displayResult(result);
        } else {
            console.warn(`卦象 ${name} 不存在`);
        }
    }
};

console.log("🎯 Zen-Tap 64卦应用脚本加载完成");