/**
 * Zen-Tap 核心引擎 - 终极架构
 */
class ZenTapCore {
    constructor() {
        this.library = null;
        this.scenes = null;
        this.currentScene = 'base';
        this.currentLanguage = 'zh';
    }

    /**
     * 统一数据加载接口
     */
async loadLibrary() {
    try {
        const response = await fetch('assets/semantics.json');
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        // 先获取文本内容，检查格式
        const textContent = await response.text();
        console.log('获取到的文件内容:', textContent.substring(0, 200) + '...');
        
        // 尝试解析JSON
        const fullData = JSON.parse(textContent);
        
        this.library = fullData.core_library;
        this.scenes = fullData.scenes_library || {};
        
        console.log('语义库加载成功', {
            核心卦象数量: Object.keys(this.library).length
        });
        
        return this;
        
    } catch (error) {
        console.error('加载语义库失败:', error);
        throw new Error(`语义库解析错误: ${error.message}`);
    }
}

    /**
     * 统一的启示生成接口
     */
    generateInspiration(hexagramData, options = {}) {
        const scene = options.scene || this.currentScene;
        const hasScenes = this.scenes && this.scenes[hexagramData.originalKey];
        
        if (hasScenes && scene !== 'base') {
            return this._buildScenePrompt(hexagramData, scene);
        } else {
            return this._buildBasePrompt(hexagramData);
        }
    }

    /**
     * 基础模式Prompt构建
     */
    _buildBasePrompt(hexagramData) {
        const originalSemantic = this.library[hexagramData.originalKey];
        const changingSemantic = this.library[hexagramData.changingKey];
        
        const changingLinesInfo = this._getChangingLinesInfo(hexagramData, originalSemantic);
        
        return `
你是一位深谙万物规律的智者。请基于以下全息信息扫描结果，为处于当前时空节点的用户，生成一段独特的心灵启示。

【全息信息扫描结果】
- 核心态势：${originalSemantic?.modern_meaning || "能量正在聚集与形成"}
- 动态趋势：${changingSemantic?.modern_meaning || "转变与流动的契机正在显现"}
${changingLinesInfo.length > 0 ? `- 关键转变信号：\n${changingLinesInfo.join('\n')}` : '- 当前处于相对稳定的能量周期'}

请将以上扫描结果融会贯通，生成一段直接面向用户的、安慰且富有智慧的话语。

结构建议：
1. 首先，描述用户当下可能正在体验的核心感受或处境（基于【核心态势】）。
2. 然后，揭示这种态势中蕴含的转变契机与发展方向（基于【动态趋势】和【关键转变信号】）。
3. 最后，给予鼓励和向前看的视角。

要求：
- 语言优美、平静、深刻，直接与用户的内心对话。
- 完全避免使用"卦象"、"爻变"、"易经"等术语，将其智慧完全内化在叙述中。
- 将"${originalSemantic?.core_imagery || ''}"和"${changingSemantic?.core_imagery || ''}"的核心意象自然糅合进内容里。
- 字数在150-250字之间，确保内容的深度和完整性。
`.trim();
    }

    /**
     * 多场景模式Prompt构建（为未来预留）
     */
    _buildScenePrompt(hexagramData, scene) {
        const originalSemantic = this.library[hexagramData.originalKey];
        const changingSemantic = this.library[hexagramData.changingKey];
        const sceneGuidance = this.scenes[hexagramData.originalKey]?.[scene];
        
        const changingLinesInfo = this._getChangingLinesInfo(hexagramData, originalSemantic);
        
        return `
你是一位深谙万物规律的智者。请基于以下全息信息扫描结果，为用户生成针对${scene}领域的启示。

【全息信息扫描结果】
- 核心态势：${originalSemantic?.modern_meaning || "能量正在聚集"}
- 领域聚焦：${sceneGuidance || "当前阶段的特殊指引"}
- 动态趋势：${changingSemantic?.modern_meaning || "转变正在发生"}
${changingLinesInfo.length > 0 ? `- 关键转变：\n${changingLinesInfo.join('\n')}` : ''}

请融合以上信息，首描述${scene}领域现状，再揭示转变契机，最后给予具体指引。
完全避免易经术语，语言优美实用。
`.trim();
    }

    /**
     * 获取变爻详细信息
     */
    _getChangingLinesInfo(hexagramData, originalSemantic) {
        const changingLinesInfo = [];
        
        for (let i = 0; i < hexagramData.changing.length; i++) {
            if (hexagramData.changing[i]) {
                const lineNumber = i + 1;
                const lineMeaning = originalSemantic?.lines?.[lineNumber]?.modern_base || "重要的能量转换";
                changingLinesInfo.push(`  · 第${lineNumber}维度：${lineMeaning}`);
            }
        }
        
        return changingLinesInfo;
    }

    /**
     * 场景模式切换（为未来UI预留）
     */
    setScene(scene) {
        const availableScenes = ['base', 'career', 'relationship', 'mental', 'family', 'health'];
        if (availableScenes.includes(scene)) {
            this.currentScene = scene;
            console.log(`已切换到场景模式: ${scene}`);
        }
        return this;
    }
}

// 创建全局实例
window.zenTapCore = new ZenTapCore();