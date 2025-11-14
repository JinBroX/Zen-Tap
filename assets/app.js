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

function generateCodesign() {
    const mainCodeLines = [];
    const changingDimensions = [];

    for (let i = 0; i < 6; i++) {
        const lineResult = tossThreeCoins();
        mainCodeLines.push(lineResult);

        if (lineResult === 9 || lineResult === 6) {
            changingDimensions[i] = true;
        } else {
            changingDimensions[i] = false;
        }
    }

    return {
        mainCode: mainCodeLines,
        changing: changingDimensions
    };
}

function calculateTransCode(mainCode, changingDimensions) {
    const transCode = [];

    for (let i = 0; i < 6; i++) {
        if (changingDimensions[i]) {
            if (mainCode[i] === 9) {
                transCode[i] = 8;
            } else if (mainCode[i] === 6) {
                transCode[i] = 7;
            }
        } else {
            transCode[i] = mainCode[i];
        }
    }

    return transCode;
}

function convertToBinaryKey(codesignArray) {
    const binaryArray = [];

    for (let i = 0; i < codesignArray.length; i++) {
        const line = codesignArray[i];
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

async function callDeepSeekAPI(prompt, codesignData) {
    console.log('🔐 安全映射验证:', {
        mainCode二进制: codesignData.mainCodeKey,
        mainCode安全键: window.zenTapCore._toSecureKey(codesignData.mainCodeKey),
        transCode二进制: codesignData.transCodeKey,
        transCode安全键: window.zenTapCore._toSecureKey(codesignData.transCodeKey),
        查询的语义: window.zenTapCore.library[window.zenTapCore._toSecureKey(codesignData.mainCodeKey)]?.name
    });

    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:';

    if (isLocal) {
        const secureKey = window.zenTapCore._toSecureKey(codesignData.mainCodeKey);
        const semanticName = window.zenTapCore.library[secureKey]?.name || '未知全息场';

        return `🧠 本地开发模式 - 安全映射验证

mainCode二进制: ${codesignData.mainCodeKey}
安全键名: ${secureKey}  
全息场类型: ${semanticName}

💡 真实部署后将隐藏这些技术细节，只显示AI生成的启示。`;
    }

    try {
        console.time('API调用耗时');
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API请求失败');
        }

        const data = await response.json();
        console.timeEnd('API调用耗时');
        return data.choices[0].message.content;

    } catch (error) {
        console.error('API调用错误:', error);
        console.timeEnd('API调用耗时');
        return `🌌 全息场连接中...请稍后重试。`;
    }
}

window.generateInterpretation = async function() {
    const button = document.getElementById('zenButton');
    const resultDiv = document.getElementById('quoteDisplay');

    // ⚡ 立即响应优化 - 让用户立即感知到变化
    button.disabled = true;
    button.textContent = '场域扫描中...';
    resultDiv.innerHTML = '<div class="loading">全息场同频中...</div>';

    // 给用户"扫描过程"的感知（600-800ms 最佳体验）
    await new Promise(resolve => setTimeout(resolve, 700));

    try {
        console.log('开始加载语义库...');

        if (!window.zenTapCore.library) {
            await window.zenTapCore.loadLibrary();
            console.log('语义库加载成功');
        }

        // 更新状态提示
        resultDiv.innerHTML = '<div class="loading">📡 解析全息信号...</div>';

        console.log('开始生成Codesign...');
        const codesignData = generateCodesign();
        console.log('mainCode:', codesignData.mainCode);

        codesignData.transCode = calculateTransCode(
            codesignData.mainCode, 
            codesignData.changing
        );
        console.log('transCode:', codesignData.transCode);

        codesignData.mainCodeKey = convertToBinaryKey(codesignData.mainCode);
        codesignData.transCodeKey = convertToBinaryKey(codesignData.transCode);
        console.log('Codesign键:', codesignData.mainCodeKey, codesignData.transCodeKey);

        // 更新状态提示
        resultDiv.innerHTML = '<div class="loading">✨ 转译智慧启示...</div>';

        const prompt = window.zenTapCore.generateInspiration(codesignData);
        console.log('Prompt生成成功');

        const aiInterpretation = await callDeepSeekAPI(prompt, codesignData);
        resultDiv.innerHTML = aiInterpretation;

    } catch (error) {
        console.error('完整错误:', error);
        resultDiv.innerHTML = `🌿 全息场微扰<br><br>请静心片刻后重试。`;
    } finally {
        button.disabled = false;
        button.textContent = '默想三秒点击';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('zenButton');
    if (button) {
        button.addEventListener('click', window.generateInterpretation);
    }
    console.log('Zen-Tap 系统初始化完成');
});