/**
 * 智谱AI OCR服务
 * 用于识别图片中的文字内容
 */

class ZhipuOCR {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://open.bigmodel.cn/api/paas/v4/files/ocr';
    }

    /**
     * 检查文件是否为支持的图片格式
     * @param {File} file - 文件对象
     * @returns {boolean} 是否为支持的图片格式
     */
    isImageFile(file) {
        const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
        return supportedTypes.includes(file.type);
    }

    /**
     * OCR文字识别（手写/印刷体通用）
     * @param {File} file - 图片文件
     * @param {Object} options - 可选参数
     * @param {string} options.language_type - 语言类型：'AUTO'(自动), 'CHN_ENG'(中英), 'ENG'(英文), 'JAP'(日文), 'KOR'(韩文)等
     * @param {boolean} options.probability - 是否返回置信度
     * @returns {Promise<Object>} 识别结果
     */
    async recognize(file, options = {}) {
        // 验证文件格式
        if (!this.isImageFile(file)) {
            throw new Error('不支持的文件格式，仅支持 PNG、JPG、JPEG、BMP 格式的图片');
        }

        // 验证文件大小（8MB限制）
        const maxSize = 8 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`文件大小超过8MB限制，当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // 准备表单数据
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tool_type', 'hand_write'); // 固定值，支持手写和印刷体
        formData.append('language_type', options.language_type || 'CHN_ENG');
        if (options.probability) {
            formData.append('probability', 'true');
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'succeeded') {
                return data;
            } else {
                throw new Error(data.message || 'OCR识别失败');
            }
        } catch (error) {
            console.error('OCR识别失败:', error);
            throw error;
        }
    }

    /**
     * 将OCR识别结果转换为纯文本
     * @param {Object} ocrResult - OCR识别结果
     * @returns {string} 提取的文本内容
     */
    extractText(ocrResult) {
        if (!ocrResult.words_result || !Array.isArray(ocrResult.words_result)) {
            return '';
        }

        // 按照位置排序（从上到下，从左到右）
        const sortedResults = ocrResult.words_result.sort((a, b) => {
            if (Math.abs(a.location.top - b.location.top) < 10) {
                // 同一行，按左坐标排序
                return a.location.left - b.location.left;
            }
            // 不同行，按上坐标排序
            return a.location.top - b.location.top;
        });

        // 提取所有文本行
        return sortedResults.map(item => item.words).join('\n');
    }

    /**
     * 识别图片并返回文本（完整流程）
     * @param {File} file - 图片文件
     * @param {Object} options - 可选参数
     * @returns {Promise<string>} 识别出的文本内容
     */
    async recognizeToText(file, options = {}) {
        const result = await this.recognize(file, options);
        return this.extractText(result);
    }

    /**
     * 获取识别统计信息
     * @param {Object} ocrResult - OCR识别结果
     * @returns {Object} 统计信息
     */
    getStatistics(ocrResult) {
        if (!ocrResult.words_result || !Array.isArray(ocrResult.words_result)) {
            return null;
        }

        const stats = {
            totalLines: ocrResult.words_result_num || ocrResult.words_result.length,
            totalCharacters: 0,
            averageConfidence: 0,
            hasConfidenceData: false
        };

        // 计算总字符数
        ocrResult.words_result.forEach(item => {
            stats.totalCharacters += item.words.length;

            // 如果有置信度数据
            if (item.probability) {
                stats.hasConfidenceData = true;
                stats.averageConfidence += item.probability.average || 0;
            }
        });

        // 计算平均置信度
        if (stats.hasConfidenceData && stats.totalLines > 0) {
            stats.averageConfidence = stats.averageConfidence / stats.totalLines;
        }

        return stats;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZhipuOCR;
}
