/**
 * 智谱AI Job Agent客户端
 * 使用GLM-4V Plus模型实现简历解析和模拟面试
 */

class JobAgentClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.chatUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    }

    /**
     * 将文件转换为base64
     * @param {File} file - 文件对象
     * @returns {Promise<string>} base64编码的文件
     */
    async fileToBase64(file) {
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
     * 解析简历文件
     * @param {File} file - 简历文件
     * @param {string} jobDescription - 目标岗位描述
     * @returns {Promise<Object>} 解析结果
     */
    async parseResumeFile(file, jobDescription = '') {
        const isImage = file.type.startsWith('image/');

        console.log('🚀 开始Job Agent简历解析...');

        let messageContent;

        if (isImage) {
            // 图片简历：使用GLM-4V Plus视觉模型
            console.log('📷 检测到图片简历，使用GLM-4V Plus');
            const base64 = await this.fileToBase64(file);

            messageContent = [
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:${file.type};base64,${base64}`
                    }
                },
                {
                    type: 'text',
                    text: this.buildResumeParsePrompt(jobDescription)
                }
            ];
        } else {
            // 文档简历：需要先读取文本
            console.log('📄 检测到文档简历，读取文本内容');
            const text = await this.readDocumentText(file);

            messageContent = this.buildResumeParsePrompt(jobDescription) + '\n\n简历内容：\n' + text;
        }

        const requestBody = {
            model: 'glm-4v-plus',
            messages: [
                {
                    role: 'user',
                    content: messageContent
                }
            ],
            temperature: 0.3,
            max_tokens: 4096
        };

        console.log('📤 调用GLM-4V Plus解析简历...');

        try {
            const response = await fetch(this.chatUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || '解析失败');
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;

            console.log('✅ 简历解析完成');
            return { content, raw: result };

        } catch (error) {
            console.error('❌ 简历解析失败:', error);
            throw error;
        }
    }

    /**
     * 构建简历解析提示词
     */
    buildResumeParsePrompt(jobDescription) {
        let prompt = `你是一个专业的简历解析助手。请从以下简历中提取结构化信息，并以JSON格式返回。

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
}`;

        if (jobDescription) {
            prompt += `\n\n目标岗位：${jobDescription}\n\n请同时评估简历与目标岗位的匹配度，并在结果中给出匹配建议。`;
        } else {
            prompt += `\n\n如果某项信息无法从简历中提取到，请使用"未提及"作为值。`;
        }

        return prompt;
    }

    /**
     * 进行面试对话
     * @param {Object} resumeData - 简历数据
     * @param {Object} jobData - 岗位数据
     * @param {string} userAnswer - 用户回答
     * @param {Array} conversationHistory - 对话历史
     * @returns {Promise<Object>} 面试回复
     */
    async conductInterview(resumeData, jobData, userAnswer, conversationHistory = []) {
        // 构建对话上下文
        const messages = [
            {
                role: 'system',
                content: `你是一位专业的面试官，正在进行${jobData.basic_info?.position || '未知'}岗位的面试。

候选人信息：
- 姓名：${resumeData.basic_info?.name || '未知'}
- 当前职位：${resumeData.basic_info?.current_position || '未知'}

岗位要求：
${this.buildJobRequirements(jobData)}

面试要求：
1. 保持专业、友好的语气
2. 根据候选人的回答追问相关问题
3. 一次只问一个问题
4. 问题要具体、有针对性
5. 不要泛泛而谈`
            }
        ];

        // 添加对话历史
        conversationHistory.forEach(msg => {
            messages.push({
                role: msg.role === 'interviewer' ? 'assistant' : 'user',
                content: msg.content
            });
        });

        // 添加当前用户回答
        if (userAnswer) {
            messages.push({
                role: 'user',
                content: userAnswer
            });
        } else {
            // 第一次面试，请候选人自我介绍
            messages.push({
                role: 'assistant',
                content: '你好，欢迎来到我们公司面试。请先做个自我介绍吧，大概3分钟左右，重点说说您的工作经历和项目经验。'
            });
        }

        const requestBody = {
            model: 'glm-4-flash',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
        };

        console.log('💬 AI面试官正在思考...');

        try {
            const response = await fetch(this.chatUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'AI回复失败');
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;

            console.log('✅ AI面试官回复完成');
            return { content, raw: result };

        } catch (error) {
            console.error('❌ AI面试官回复失败:', error);
            throw error;
        }
    }

    /**
     * 构建岗位要求描述
     */
    buildJobRequirements(jobData) {
        let requirements = `职位：${jobData.basic_info?.position || '未知'}
公司：${jobData.basic_info?.company || '未知'}
薪资：${jobData.basic_info?.salary || '未知'}
地点：${jobData.basic_info?.location || '未知'}`;

        if (jobData.capabilities && jobData.capabilities.length > 0) {
            requirements += '\n\n核心能力要求：\n';
            jobData.capabilities.forEach(cap => {
                requirements += `- ${cap.name} (权重${cap.weight}%)\n`;
            });
        }

        if (jobData.required_skills && jobData.required_skills.length > 0) {
            requirements += '\n必备技能：\n';
            jobData.required_skills.forEach(skill => {
                requirements += `- ${skill}\n`;
            });
        }

        return requirements;
    }

    /**
     * 读取文档文本内容
     */
    async readDocumentText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobAgentClient;
}
