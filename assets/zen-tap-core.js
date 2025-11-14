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

        return `你是一位深谙万物规律的智者。请基于以下全息场扫描结果，为处于当前时空节点的用户，生成一段独特的心灵启示。

【全息场扫描结果】
- 核心态势：${mainCodeSemantic?.modern_meaning || "能量正在聚集与形成"}
- 动态趋势：${transCodeSemantic?.modern_meaning || "转变与流动的契机正在显现"}
${changingDimensionsInfo.length > 0 ? `- 关键转变信号：\n${changingDimensionsInfo.join('\n')}` : '- 当前处于相对稳定的全息场周期'}

请将以上扫描结果融会贯通，生成一段直接面向用户的、安慰且富有智慧的话语。

结构建议：
1. 首先，描述用户当下可能正在体验的核心感受或处境（基于【核心态势】）。
2. 然后，揭示这种态势中蕴含的转变契机与发展方向（基于【动态趋势】和【关键转变信号】）。
3. 最后，给予鼓励和向前看的视角。

要求：
- 语言优美、平静、深刻，直接与用户的内心对话。
- 完全避免使用"Codesign"、"维度转变"等术语，将其智慧完全内化在叙述中。
- 将"${mainCodeSemantic?.core_imagery || ''}"和"${transCodeSemantic?.core_imagery || ''}"的核心意象自然糅合进内容里。
- 字数在150-250字之间，确保内容的深度和完整性。`.trim();
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