/**
 * 智谱AI文件解析服务
 * 使用智谱AI文件解析API解析简历文件
 */

class ZhipuFileParser {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/files/parser';
    }

    /**
     * 获取文件类型
     * @param {File} file - 文件对象
     * @returns {string} 文件类型
     */
    getFileType(file) {
        const fileName = file.name.toLowerCase();
        const ext = fileName.substring(fileName.lastIndexOf('.') + 1);

        const typeMap = {
            'pdf': 'PDF',
            'docx': 'DOCX',
            'doc': 'DOC',
            'xlsx': 'XLSX',
            'xls': 'XLS',
            'pptx': 'PPTX',
            'ppt': 'PPT',
            'png': 'PNG',
            'jpg': 'JPG',
            'jpeg': 'JPEG',
            'txt': 'TXT',
            'md': 'MD'
        };

        return typeMap[ext] || 'PDF';
    }

    /**
     * 创建文件解析任务
     * @param {File} file - 要解析的文件
     * @param {string} toolType - 解析工具类型: 'lite', 'expert', 'prime'
     * @returns {Promise<string>} 任务ID
     */
    async createParseTask(file, toolType = 'lite') {
        const fileType = this.getFileType(file);

        // 准备表单数据
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_type', fileType);
        formData.append('tool_type', toolType);

        try {
            const response = await fetch(`${this.baseUrl}/create`, {
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

            if (data.success && data.task_id) {
                return data.task_id;
            } else {
                throw new Error(data.message || '创建解析任务失败');
            }
        } catch (error) {
            console.error('创建解析任务失败:', error);
            throw error;
        }
    }

    /**
     * 获取解析结果
     * @param {string} taskId - 任务ID
     * @param {string} formatType - 返回格式: 'text', 'download_link'
     * @returns {Promise<Object>} 解析结果
     */
    async getParseResult(taskId, formatType = 'text') {
        try {
            const response = await fetch(`${this.baseUrl}/result/${taskId}/${formatType}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取解析结果失败:', error);
            throw error;
        }
    }

    /**
     * 轮询等待解析完成
     * @param {string} taskId - 任务ID
     * @param {number} maxRetries - 最大重试次数
     * @param {number} interval - 轮询间隔(毫秒)
     * @returns {Promise<string>} 解析后的文本内容
     */
    async waitForCompletion(taskId, maxRetries = 60, interval = 3000) {
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const result = await this.getParseResult(taskId, 'text');

                if (result.status === 'succeeded') {
                    console.log('解析成功!');
                    return result.content;
                } else if (result.status === 'processing') {
                    console.log(`解析中... (${retries + 1}/${maxRetries})`);
                    // 等待后重试
                    await new Promise(resolve => setTimeout(resolve, interval));
                    retries++;
                } else if (result.status === 'failed') {
                    throw new Error(result.message || '解析失败');
                } else {
                    throw new Error(`未知状态: ${result.status}`);
                }
            } catch (error) {
                if (retries >= maxRetries - 1) {
                    throw error;
                }
                console.error(`获取结果失败 (${retries + 1}/${maxRetries}):`, error.message);
                await new Promise(resolve => setTimeout(resolve, interval));
                retries++;
            }
        }

        throw new Error('解析超时，请稍后重试');
    }

    /**
     * 检查是否为图片文件
     * @param {File} file - 文件对象
     * @returns {boolean} 是否为图片文件
     */
    isImageFile(file) {
        const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
        return imageTypes.includes(file.type);
    }

    /**
     * 解析文件（完整流程）
     * 自动识别文件类型，图片使用OCR，其他使用文件解析API
     * @param {File} file - 要解析的文件
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<string>} 解析后的文本内容
     */
    async parseFile(file, onProgress = null) {
        try {
            // 如果是图片文件，使用OCR
            if (this.isImageFile(file)) {
                return await this.parseImage(file, onProgress);
            }

            // 其他文件使用文件解析API
            return await this.parseDocument(file, onProgress);
        } catch (error) {
            console.error('文件解析失败:', error);
            throw error;
        }
    }

    /**
     * 解析图片文件（使用OCR）
     * @param {File} file - 图片文件
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<string>} 识别出的文本内容
     */
    async parseImage(file, onProgress = null) {
        if (onProgress) onProgress('正在识别图片文字...');

        // 使用ZhipuOCR类
        const ocr = new ZhipuOCR(this.apiKey);
        const text = await ocr.recognizeToText(file, { language_type: 'CHN_ENG' });

        console.log('OCR识别成功!');
        return text;
    }

    /**
     * 解析文档文件（使用文件解析API）
     * @param {File} file - 文档文件
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<string>} 解析后的文本内容
     */
    async parseDocument(file, onProgress = null) {
        // 验证文件大小
        const maxSize = 50 * 1024 * 1024; // 50MB (lite模式限制)
        if (file.size > maxSize) {
            throw new Error(`文件大小超过${maxSize / 1024 / 1024}MB限制`);
        }

        // 步骤1: 创建解析任务
        if (onProgress) onProgress('正在上传文件...');
        const taskId = await this.createParseTask(file, 'lite');
        console.log('任务创建成功, taskId:', taskId);

        // 步骤2: 等待解析完成
        if (onProgress) onProgress('正在解析文件内容...');
        const content = await this.waitForCompletion(taskId);

        return content;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZhipuFileParser;
}
