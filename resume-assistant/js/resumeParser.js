/**
 * 智谱AI简历解析工具
 * 使用OCR + GLM-4 Flash模型解析简历
 */

class ResumeParser {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.chatApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        this.ocrApiUrl = 'https://open.bigmodel.cn/api/paas/v4/files/ocr';
    }

    /**
     * 检查文件是否为支持的格式
     * @param {File} file - 文件对象
     * @returns {boolean} 是否支持
     */
    isSupported(file) {
        const supportedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'text/plain'
        ];
        return supportedTypes.includes(file.type);
    }

    /**
     * 将文件转换为base64
     * @param {File} file - 文件对象
     * @returns {Promise<string>} base64编码的文件
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * 使用OCR识别图片文字
     * @param {File} file - 图片文件
     * @returns {Promise<string>} 识别出的文本
     */
    async recognizeImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tool_type', 'hand_write');
        formData.append('language_type', 'CHN_ENG');

        console.log('🔍 正在使用OCR识别图片...');

        try {
            const response = await fetch(this.ocrApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            const responseText = await response.text();
            console.log('OCR响应状态:', response.status);

            if (!response.ok) {
                let errorMessage = `OCR识别失败: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                    console.error('OCR错误详情:', errorData);
                } catch (e) {
                    console.error('OCR错误响应:', responseText);
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`解析OCR响应失败: ${responseText}`);
            }

            if (result.status === 'succeeded' && result.words_result) {
                // 按位置排序提取文本
                const sorted = result.words_result.sort((a, b) => {
                    if (Math.abs(a.location.top - b.location.top) < 10) {
                        return a.location.left - b.location.left;
                    }
                    return a.location.top - b.location.top;
                });

                const text = sorted.map(item => item.words).join('\n');
                console.log(`✅ OCR识别成功，提取了 ${text.length} 个字符`);
                return text;
            } else {
                throw new Error(result.message || 'OCR识别失败');
            }

        } catch (error) {
            console.error('❌ OCR识别失败:', error);
            throw error;
        }
    }

    /**
     * 使用GLM-4 Flash解析简历文本
     * @param {string} text - 简历文本内容
     * @returns {Promise<Object>} 解析后的简历数据
     */
    async parseTextWithGLM4(text) {
        const prompt = `你是一个专业的简历解析助手。请从以下简历文本中提取结构化信息，并以JSON格式返回。

请提取以下信息：
{
  "basic_info": {
    "name": "姓名",
    "phone": "电话",
    "email": "邮箱",
    "current_position": "当前职位",
    "education": {
      "degree": "学历",
      "school": "学校",
      "major": "专业"
    }
  },
  "work_experience": [
    {
      "company": "公司名称",
      "position": "职位",
      "start_date": "开始日期",
      "end_date": "结束日期",
      "responsibilities": ["职责1", "职责2"]
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "role": "角色",
      "tech_stack": ["技术1", "技术2"],
      "achievements": "成果描述"
    }
  ],
  "skills": {
    "technical": ["技术技能1", "技术技能2"],
    "soft": ["软技能1", "软技能2"]
  }
}

如果某项信息无法从简历中提取到，请使用"未提及"作为值。

简历文本内容：
${text}

请严格按照上述JSON格式返回结果，不要包含其他说明文字。`;

        const requestBody = {
            model: 'glm-4-flash',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 4096,
            top_p: 0.7
        };

        console.log('📤 调用GLM-4 Flash API解析文本...');

        try {
            const response = await fetch(this.chatApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();
            console.log('GLM-4响应状态:', response.status);

            if (!response.ok) {
                let errorMessage = `调用GLM-4失败: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error?.message || errorMessage;
                    console.error('GLM-4错误详情:', errorData);
                } catch (e) {
                    console.error('GLM-4错误响应:', responseText);
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`解析GLM-4响应失败: ${responseText}`);
            }

            console.log('✅ GLM-4调用成功');

            // 提取AI返回的内容
            const content = result.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('未能获取到AI回复内容');
            }

            console.log('AI返回内容:', content);

            // 尝试从内容中提取JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const resumeData = JSON.parse(jsonMatch[0]);
                    return this.normalizeData(resumeData);
                } catch (e) {
                    console.log('JSON解析失败，返回原始文本');
                }
            }

            // 如果无法解析JSON，返回原始文本
            return {
                raw_text: content,
                basic_info: {
                    name: '需手动提取',
                    phone: '需手动提取',
                    email: '需手动提取',
                    current_position: '需手动提取',
                    education: {
                        degree: '需手动提取',
                        school: '需手动提取',
                        major: '需手动提取'
                    }
                },
                work_experience: [],
                projects: [],
                skills: { technical: [], soft: [] }
            };

        } catch (error) {
            console.error('❌ 调用GLM-4失败:', error);
            throw error;
        }
    }

    /**
     * 使用OCR + GLM-4 Flash解析简历
     * @param {File} file - 简历文件
     * @returns {Promise<Object>} 解析后的简历数据
     */
    async parseWithGLM4(file) {
        const isImage = file.type.startsWith('image/');
        let text = '';

        if (isImage) {
            // 图片简历：先使用OCR识别文字
            console.log('📷 检测到图片简历');
            text = await this.recognizeImage(file);
        } else {
            // 文档简历：读取文本内容
            console.log('📄 检测到文档简历，读取文本内容');
            text = await this.readDocumentText(file);
        }

        // 使用GLM-4 Flash解析文本
        return await this.parseTextWithGLM4(text);
    }

    /**
     * 读取文档文本内容（简化版，仅支持TXT）
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 文本内容
     */
    async readDocumentText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * 标准化简历数据
     * @param {Object} data - 原始数据
     * @returns {Object} 标准化的简历数据
     */
    normalizeData(data) {
        return {
            basic_info: {
                name: data.name || data.basic_info?.name || '待提取',
                phone: data.phone || data.basic_info?.phone || '待提取',
                email: data.email || data.basic_info?.email || '待提取',
                current_position: data.current_position || data.position || '待提取',
                education: data.education || data.basic_info?.education || {
                    degree: '待提取',
                    school: '待提取',
                    major: '待提取'
                }
            },
            work_experience: data.work_experience || data.work_history || [],
            projects: data.projects || data.project_experience || [],
            skills: data.skills || {
                technical: data.technical_skills || [],
                soft: data.soft_skills || []
            },
            raw_data: data
        };
    }

    /**
     * 解析简历（完整流程）
     * @param {File} file - 简历文件
     * @param {string} jobDescription - 岗位描述（可选）
     * @returns {Promise<Object>} 标准化的简历数据
     */
    async parse(file, jobDescription = '通用岗位') {
        // 验证文件格式
        if (!this.isSupported(file)) {
            throw new Error('不支持的文件格式，请使用 PDF、DOCX、DOC、PNG、JPG、TXT 格式的简历');
        }

        // 验证文件大小
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            throw new Error(`文件大小超过${maxSize / 1024 / 1024}MB限制`);
        }

        console.log('🚀 开始解析简历:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        try {
            // 使用GLM-4 Flash解析简历
            const resumeData = await this.parseWithGLM4(file);

            console.log('✅ 简历解析完成');
            return resumeData;

        } catch (error) {
            console.error('❌ 简历解析失败:', error);
            throw error;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeParser;
}
