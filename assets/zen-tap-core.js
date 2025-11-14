class ZenTapCore {
    constructor() {
        this.library = null;
        this.scenes = null;
        this.currentScene = 'base';
        this.currentLanguage = 'zh';

        this.CODESIGN_MAPPING = {
            '111111': 'sunrise_field',
            '000000': 'earth_field',  
            '111000': 'pause_field',
            '000111': 'flow_field',
            '010001': 'challenge_field',
            '100010': 'conflict_field',
            '011011': 'clarity_field',
            '101101': 'stillness_field'
        };
    }

    _toSecureKey(binaryKey) {
        return this.CODESIGN_MAPPING[binaryKey] || binaryKey;
    }

    async loadLibrary() {
        try {
            const response = await fetch('assets/semantics.json');
            const fullData = await response.json();

            this.library = fullData.core_library;
            this.scenes = fullData.scenes_library || {};

            console.log('语义库加载完成', {
                Codesign数量: Object.keys(this.library).length,
                安全映射: '已启用'
            });

            return this;
        } catch (error) {
            console.error('加载语义库失败:', error);
            throw error;
        }
    }

    generateInspiration(codesignData, options = {}) {
        const scene = options.scene || this.currentScene;
        const hasScenes = this.scenes && this.scenes[codesignData.mainCodeKey];

        if (hasScenes && scene !== 'base') {
            return this._buildScenePrompt(codesignData, scene);
        } else {
            return this._buildBasePrompt(codesignData);
        }
    }

    _buildBasePrompt(codesignData) {
        const mainCodeSecureKey = this._toSecureKey(codesignData.mainCodeKey);
        const transCodeSecureKey = this._toSecureKey(codesignData.transCodeKey);

        const mainCodeSemantic = this.library[mainCodeSecureKey];
        const transCodeSemantic = this.library[transCodeSecureKey];

        const changingDimensionsInfo = this._getChangingDimensionsInfo(codesignData, mainCodeSemantic);

        return `你是一位以清晰洞察和温柔语言见长的现代心灵顾问。  
请根据以下【全息场扫描结果】，为当下时空节点的用户生成一段具备安慰、方向感与深度的启示内容。

【全息场扫描结果】
- 核心态势：${mainCodeSemantic?.modern_meaning || "能量正在聚集与形成"}
- 动态趋势：${transCodeSemantic?.modern_meaning || "转变与流动的契机正在显现"}
${changingDimensionsInfo.length > 0 ? `- 关键转变信号：\n${changingDimensionsInfo.join('\n')}` : '- 当前处于相对稳定的全息场周期'}

请综合以上信息，创作一段面向用户的心灵提示，并遵守以下要求：

【结构要求】
1. 先描述用户当前可能的内在体验或处境（基于“核心态势”）。
2. 再指出此态势中蕴含的变化方向与机遇（基于“动态趋势”与“关键转变信号”）。
3. 最后提供温柔且现实的鼓励，帮助用户以更清晰的心态面对当下。

【表达要求】
- 语言现代、平静、不神秘化，以“对话式智慧”呈现。
- 避免使用“维度”“频率”“Codesign”等术语，将其本质融入自然表达中。
- 将 "${mainCodeSemantic?.core_imagery || ''}" 与 "${transCodeSemantic?.core_imagery || ''}" 的核心意象自然融入叙述，使其成为暗线意象而非直白解释。
- 150–220 字之间，保持密度、节奏和阅读的轻盈感。
- 结尾用一句不超过 10 字的温柔提醒作为点睛句（如“你值得被看见”）。

请生成最终内容。`.trim();
    }

    _getChangingDimensionsInfo(codesignData, mainCodeSemantic) {
        const changingDimensionsInfo = [];

        for (let i = 0; i < codesignData.changing.length; i++) {
            if (codesignData.changing[i]) {
                const dimensionNumber = i + 1;
                const dimensionMeaning = mainCodeSemantic?.dimensions?.[dimensionNumber]?.modern_base || "重要的全息场转换";
                changingDimensionsInfo.push(`  · 第${dimensionNumber}维度：${dimensionMeaning}`);
            }
        }

        return changingDimensionsInfo;
    }

    setScene(scene) {
        const availableScenes = ['base', 'career', 'relationship', 'mental', 'family', 'health'];
        if (availableScenes.includes(scene)) {
            this.currentScene = scene;
            console.log(`已切换到场景模式: ${scene}`);
        }
        return this;
    }
}

window.zenTapCore = new ZenTapCore();