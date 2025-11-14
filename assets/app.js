// assets/app.js - 完整版本

// 天地人三才随机源
function generateThreeTalentsSeed() {
    const heavenlySeed = Math.floor(Date.now() / 60000);
    
    const earthlySource = window.location.href + navigator.userAgent;
    let earthlySeed = 0;
    for (let i = 0; i < earthlySource.length; i++) {
        earthlySeed = ((earthlySeed << 5) - earthlySeed) + earthlySource.charCodeAt(i);
        earthlySeed |= 0;
    }
    
    let humanSeed = localStorage.getItem('zen_tap_user_id');
    if (!humanSeed) {
        humanSeed = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        localStorage.setItem('zen_tap_user_id', humanSeed);
    }
    let humanSeedHash = 0;
    for (let i = 0; i < humanSeed.length; i++) {
        humanSeedHash = ((humanSeedHash << 5) - humanSeedHash) + humanSeed.charCodeAt(i);
        humanSeedHash |= 0;
    }
    
    return {
        heaven: heavenlySeed,
        earth: earthlySeed,
        human: humanSeedHash
    };
}

function deterministicRandom(seed, salt) {
    const x = Math.sin(seed + salt) * 10000;
    return x - Math.floor(x);
}

function tossThreeCoins() {
    const seeds = generateThreeTalentsSeed();
    
    const coinHeaven = deterministicRandom(seeds.heaven, 1) < 0.5 ? 0 : 1;
    const coinEarth = deterministicRandom(seeds.earth, 2) < 0.5 ? 0 : 1;
    const coinHuman = deterministicRandom(seeds.human, 3) < 0.5 ? 0 : 1;

    const headsCount = (coinHeaven === 0 ? 1 : 0) + 
                      (coinEarth === 0 ? 1 : 0) + 
                      (coinHuman === 0 ? 1 : 0);

    if (headsCount === 3) return 9;
    if (headsCount === 2) return 7;
    if (headsCount === 1) return 8;
    if (headsCount === 0) return 6;
}

function generateHexagram() {
    const originalLines = [];
    const changingLines = [];

    for (let i = 0; i < 6; i++) {
        const lineResult = tossThreeCoins();
        originalLines.push(lineResult);
        
        if (lineResult === 9 || lineResult === 6) {
            changingLines[i] = true;
        } else {
            changingLines[i] = false;
        }
    }

    return {
        original: originalLines,
        changing: changingLines
    };
}

function calculateChangingHexagram(originalHexagram, changingLines) {
    const changingHexagram = [];
    
    for (let i = 0; i < 6; i++) {
        if (changingLines[i]) {
            if (originalHexagram[i] === 9) {
                changingHexagram[i] = 8;
            } else if (originalHexagram[i] === 6) {
                changingHexagram[i] = 7;
            }
        } else {
            changingHexagram[i] = originalHexagram[i];
        }
    }

    return changingHexagram;
}

function convertToBinaryKey(hexagramArray) {
    const binaryArray = [];
    
    for (let i = 0; i < hexagramArray.length; i++) {
        const line = hexagramArray[i];
        if (line === 7 || line === 9) {
            binaryArray.push(1);
        } else if (line === 8 || line === 6) {
            binaryArray.push(0);
        } else {
            binaryArray.push(0);
        }
    }

    return binaryArray.join('');
}

// 真实的 DeepSeek API 调用
async function callDeepSeekAPI(prompt) {
    // 在Vercel中配置 DEEPSEEK_API_KEY 环境变量
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    
    // 如果没有配置API密钥，返回友好的提示信息
    if (!API_KEY || API_KEY === 'your_deepseek_api_key_here') {
        return `🧠 全息扫描完成！

基于当前的时空能量场扫描，系统发现你正处在一个需要耐心与包容的阶段。

这是一个积累和沉淀的时期，适合：
• 内省和自我调整
• 接纳当下的状态
• 为未来的行动积蓄力量

请相信，每个阶段都有其独特的意义，此刻的沉淀将为未来的绽放奠定基础。

（如需更精准的AI启示，请在部署后配置DeepSeek API密钥）`;
    }
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('API调用错误:', error);
        // 返回一个优雅的降级响应
        return `🌌 全息场连接中...

此刻的时空能量正在流动，虽然暂时无法获取深度解读，但请感知内心的平静。

有时候，静默本身就是最好的启示。在这个需要耐心的阶段，不妨：
• 倾听内心的声音
• 观察周围的迹象
• 信任自然的节奏

真正的智慧往往在静默中显现。`;
    }
}

// 主函数
window.generateInterpretation = async function() {
    const button = document.getElementById('zenButton');
    const resultDiv = document.getElementById('quoteDisplay');

    button.disabled = true;
    button.textContent = '全息扫描中...';
    resultDiv.innerHTML = '';

    try {
        console.log('开始加载语义库...');
        
        if (!window.zenTapCore.library) {
            await window.zenTapCore.loadLibrary();
            console.log('语义库加载成功');
        }
        
        console.log('开始起卦...');
        const hexagramData = generateHexagram();
        console.log('本卦:', hexagramData.original);
        
        hexagramData.changingHexagram = calculateChangingHexagram(
            hexagramData.original, 
            hexagramData.changing
        );
        console.log('变卦:', hexagramData.changingHexagram);
        
        hexagramData.originalKey = convertToBinaryKey(hexagramData.original);
        hexagramData.changingKey = convertToBinaryKey(hexagramData.changingHexagram);
        console.log('卦象键:', hexagramData.originalKey, hexagramData.changingKey);
        
        const prompt = window.zenTapCore.generateInspiration(hexagramData);
        console.log('Prompt生成成功');
        
        const aiInterpretation = await callDeepSeekAPI(prompt);
        resultDiv.innerHTML = aiInterpretation;

    } catch (error) {
        console.error('完整错误:', error);
        resultDiv.innerHTML = `🌿 能量场微扰<br><br>全息扫描遇到暂时干扰，请静心片刻后重试。<br><br><small>技术提示: ${error.message}</small>`;
    } finally {
        button.disabled = false;
        button.textContent = '默想三秒点击';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('zenButton');
    if (button) {
        button.addEventListener('click', window.generateInterpretation);
    }
    console.log('Zen-Tap 系统初始化完成');
});