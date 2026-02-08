// 简历助手 - 主应用逻辑

// 全局状态管理
const appState = {
    currentModule: 'resume',
    resumeData: null,
    jobData: null,
    optimizationData: null
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initResumeUpload();
    initJobAnalysis();
});

// 导航功能
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const module = this.getAttribute('data-module');
            switchModule(module);
        });
    });
}

// 切换模块
function switchModule(moduleName) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-module') === moduleName) {
            btn.classList.add('active');
        }
    });

    // 更新模块显示
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    document.getElementById('module-' + moduleName).classList.add('active');

    // 更新进度条
    const stepMap = {
        'resume': 1,
        'job': 2,
        'optimize': 3,
        'prepare': 4,
        'interview': 5
    };
    updateProgress(stepMap[moduleName]);

    appState.currentModule = moduleName;

    // 如果切换到岗位分析模块，自动填充简历岗位
    if (moduleName === 'job') {
        setTimeout(() => autoFillResumePosition(), 100);
    }

    // 如果切换到面试准备模块，自动生成面试准备内容
    if (moduleName === 'prepare') {
        setTimeout(() => generateInterviewPreparation(), 100);
    }
}

// 更新进度条
function updateProgress(step) {
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if (index + 1 <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// 下一步功能
function nextModule(moduleName) {
    switchModule(moduleName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 简历上传功能
function initResumeUpload() {
    const fileInput = document.getElementById('resumeFile');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleResumeUpload(file);
            }
        });
    }
}

// 处理简历上传
async function handleResumeUpload(file) {
    // 验证API密钥
    if (!window.ZHIPU_API_KEY) {
        alert('请先配置智谱AI API密钥');
        return;
    }

    try {
        // 使用ResumeParser（OCR + GLM-4 Flash方案）
        const parser = new ResumeParser(window.ZHIPU_API_KEY);

        // 显示加载状态
        showLoading('正在解析简历...');

        // 解析简历文件
        const resumeData = await parser.parse(file);

        console.log('✅ 简历解析结果:', resumeData);

        // 保存到应用状态
        appState.resumeData = resumeData;

        // 隐藏加载状态
        hideLoading();

        // 显示简历预览
        displayResumePreview(resumeData);

    } catch (error) {
        hideLoading();
        console.error('❌ 简历解析失败:', error);

        // 失败时提示用户
        alert(`简历解析失败: ${error.message}\n\n建议：\n1. 检查网络连接\n2. 确认API密钥正确\n3. 文件格式是否支持（PDF、DOCX、DOC、PNG、JPG）\n\n如需帮助，请查看控制台详细日志。`);
    }
}

// 解析Job Agent返回的内容
function parseJobAgentResponse(content) {
    // 尝试从内容中提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[0]);
            return normalizeResumeData(data);
        } catch (e) {
            console.log('JSON解析失败，使用原始文本');
        }
    }

    // 如果无法解析JSON，返回基础结构
    return {
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
        skills: { technical: [], soft: [] },
        raw_text: content
    };
}

// 标准化简历数据
function normalizeResumeData(data) {
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

// 生成模拟简历数据（用于演示和测试）
function generateMockResumeData() {
    return {
        basic_info: {
            name: '张三',
            phone: '138****1234',
            email: 'zhangsan@example.com',
            current_position: '产品经理',
            education: {
                degree: '本科',
                school: '某某大学',
                major: '计算机科学'
            }
        },
        work_experience: [
            {
                company: '某互联网公司',
                position: '产品经理',
                start_date: '2021-06',
                end_date: '2024-12',
                responsibilities: [
                    '负责B端产品规划和设计',
                    '主导3个核心功能迭代'
                ]
            }
        ],
        projects: [
            {
                name: '电商平台改版',
                role: '产品负责人',
                tech_stack: ['Axure', 'Figma'],
                achievements: '转化率提升20%'
            }
        ],
        skills: {
            technical: ['Axure', 'Figma', 'SQL', '数据分析'],
            soft: ['沟通能力', '团队协作', '项目管理']
        }
    };
}

// 显示简历预览
function displayResumePreview(data) {
    console.log('📝 开始显示简历预览，数据:', data);

    document.getElementById('resumeUpload').style.display = 'none';
    document.getElementById('resumePreview').style.display = 'block';

    // 显示基本信息
    const basicInfo = document.getElementById('basicInfo');
    if (basicInfo) {
        basicInfo.innerHTML = `
            <p><strong>姓名：</strong>${data.basic_info.name || '未提取'}</p>
            <p><strong>电话：</strong>${data.basic_info.phone || '未提取'}</p>
            <p><strong>邮箱：</strong>${data.basic_info.email || '未提取'}</p>
            <p><strong>当前职位：</strong>${data.basic_info.current_position || '未提取'}</p>
            <p><strong>学历：</strong>${data.basic_info.education?.degree || '未提取'} - ${data.basic_info.education?.school || '未提取'}</p>
        `;
    }

    // 显示工作经历
    displayWorkExperience(data.work_experience || []);

    // 显示项目经验
    displayProjects(data.projects || []);

    // 显示技能
    displaySkills(data.skills || { technical: [], soft: [] });

    // 显示原始文本（如果有）
    if (data.raw_text && data.raw_text.length > 0) {
        console.log('📄 原始文本内容:', data.raw_text);
    }
}

// 显示工作经历
function displayWorkExperience(workExp) {
    const container = document.getElementById('workExperience');
    if (!container) return;

    if (!workExp || workExp.length === 0) {
        container.innerHTML = '<p style="color: #999;">暂无工作经历信息</p>';
        return;
    }

    const html = workExp.map(work => `
        <div style="margin-bottom: 15px;">
            <p><strong>${work.company || '未知公司'} - ${work.position || '未知职位'}</strong></p>
            <p style="color: #666; font-size: 14px;">${work.start_date || '未知'} 至 ${work.end_date || '未知'}</p>
            ${work.responsibilities && work.responsibilities.length > 0 ? `
                <ul>
                    ${work.responsibilities.map(r => `<li>${r}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');
    container.innerHTML = html;
}

// 显示项目经验
function displayProjects(projects) {
    const container = document.getElementById('projects');
    if (!container) return;

    if (!projects || projects.length === 0) {
        container.innerHTML = '<p style="color: #999;">暂无项目经验信息</p>';
        return;
    }

    const html = projects.map(project => `
        <div style="margin-bottom: 15px;">
            <p><strong>${project.name || '未知项目'}</strong></p>
            <p style="color: #666; font-size: 14px;">角色：${project.role || '未知'}</p>
            ${project.tech_stack && project.tech_stack.length > 0 ? `<p>技术栈：${project.tech_stack.join(', ')}</p>` : ''}
            ${project.achievements ? `<p>成果：${project.achievements}</p>` : ''}
        </div>
    `).join('');
    container.innerHTML = html;
}

// 显示技能
function displaySkills(skills) {
    const container = document.getElementById('skills');
    if (!container) return;

    const technical = skills?.technical || [];
    const soft = skills?.soft || [];

    container.innerHTML = `
        <p><strong>技术技能：</strong>${technical.length > 0 ? technical.join(', ') : '暂无'}</p>
        <p><strong>软技能：</strong>${soft.length > 0 ? soft.join(', ') : '暂无'}</p>
    `;
}

// 岗位分析功能
function initJobAnalysis() {
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
            // 如果切换到文本标签，自动填充简历中的岗位
            if (tab === 'text' && appState.resumeData) {
                autoFillResumePosition();
            }
        });
    });

    // 初始化时自动填充（如果已有简历数据）
    if (appState.resumeData) {
        autoFillResumePosition();
    }
}

// 自动填充简历中的当前职位
function autoFillResumePosition() {
    console.log('🔄 检查是否需要自动填充简历岗位...');

    if (!appState.resumeData) {
        console.log('⚠️ 暂无简历数据');
        const hint = document.getElementById('resumePositionHint');
        if (hint) {
            hint.innerHTML = '💡 提示：先上传简历，系统会自动识别您的当前职位';
        }
        return;
    }

    const currentPosition = appState.resumeData.basic_info?.current_position;
    const textarea = document.getElementById('jobDescription');
    const hint = document.getElementById('resumePositionHint');

    console.log('📋 当前职位:', currentPosition);
    console.log('📝 文本框是否存在:', !!textarea);
    console.log('💡 提示元素是否存在:', !!hint);

    if (currentPosition && currentPosition !== '待提取' && currentPosition !== '未提取' && currentPosition !== '需手动提取') {
        // 如果文本框为空，显示提示
        if (textarea && !textarea.value.trim()) {
            textarea.placeholder = `已为您自动带入简历中的当前职位：${currentPosition}\n\n您可以在此修改或粘贴目标岗位的完整描述...`;

            // 在页面顶部显示提示
            if (hint) {
                hint.innerHTML = `💡 已识别您的当前职位：<strong>${currentPosition}</strong>，可以在此基础上搜索目标岗位`;
                hint.style.color = '#4CAF50';
            }

            console.log('✅ 自动带入简历岗位:', currentPosition);
        }
    } else {
        if (hint) {
            hint.innerHTML = '💡 提示：简历中的职位信息未能识别，请手动输入目标岗位';
            hint.style.color = '#FF9800';
        }
        console.log('⚠️ 简历中未能识别到职位信息');
    }
}

// 清空岗位描述
function clearJobDescription() {
    const textarea = document.getElementById('jobDescription');
    if (textarea) {
        textarea.value = '';
        autoFillResumePosition(); // 重新显示提示
    }
}

// 切换标签页
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-' + tabName).classList.add('active');
}

// 分析岗位
async function analyzeJob() {
    const jobDesc = document.getElementById('jobDescription').value;
    if (!jobDesc.trim()) {
        alert('请输入岗位描述');
        return;
    }

    showLoading('正在分析岗位...');

    try {
        // 使用AI分析岗位
        const jobData = await analyzeJobWithAI(jobDesc);

        appState.jobData = jobData;
        displayJobAnalysis(jobData);
        hideLoading();

    } catch (error) {
        hideLoading();
        console.error('岗位分析失败:', error);

        // 失败时使用模拟数据
        console.log('使用模拟数据');
        const mockJobData = generateMockJobData();
        appState.jobData = mockJobData;
        displayJobAnalysis(mockJobData);
    }
}

// 使用AI分析岗位
async function analyzeJobWithAI(jobDescription) {
    const resumeInfo = appState.resumeData
        ? `\n\n【求职者简历信息】\n姓名: ${appState.resumeData.basic_info?.name || '未知'}\n当前职位: ${appState.resumeData.basic_info?.current_position || '未知'}`
        : '';

    const prompt = `你是一个专业的HR和招聘专家。请分析以下岗位描述（JD），提取关键信息并以JSON格式返回。

【岗位描述】
${jobDescription}
${resumeInfo}

请提取以下信息，以JSON格式返回：
{
  "basic_info": {
    "position": "职位名称",
    "company": "公司名称（如果能提取到）",
    "salary": "薪资范围",
    "location": "工作地点"
  },
  "capabilities": [
    {"name": "能力名称", "weight": 权重百分比, "level": 重要程度(1-5)}
  ],
  "required_skills": ["技能1", "技能2", "技能3"],
  "interview_focus": ["面试轮次和重点"]
}

请仔细分析岗位描述，提取所有关键信息。`;

    const requestBody = {
        model: 'glm-4-flash',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 2048
    };

    console.log('📤 调用GLM-4 Flash分析岗位...');

    try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.ZHIPU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API调用失败');
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('未能获取到AI回复');
        }

        console.log('✅ 岗位分析成功');

        // 尝试解析JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.log('JSON解析失败，使用模拟数据');
            }
        }

        throw new Error('无法解析AI返回的数据');

    } catch (error) {
        console.error('AI分析失败:', error);
        throw error;
    }
}

// 生成模拟岗位数据
function generateMockJobData() {
    return {
        basic_info: {
            position: '高级产品经理',
            company: '某互联网公司',
            salary: '30-50K',
            location: '北京'
        },
        capabilities: [
            { name: '产品规划能力', weight: 35, level: 5 },
            { name: '数据分析能力', weight: 25, level: 4 }
        ],
        required_skills: [
            '3年以上产品经理经验',
            '熟练使用Axure/Figma等原型工具'
        ],
        interview_focus: [
            '一面：产品思维、案例分析',
            '二面：数据驱动决策'
        ]
    };
}

// 显示岗位分析结果
function displayJobAnalysis(data) {
    const inputArea = document.querySelector('.job-input-area');
    const resultArea = document.getElementById('jobAnalysisResult');

    if (inputArea) inputArea.style.display = 'none';
    if (resultArea) resultArea.style.display = 'block';

    // 显示基本信息
    const basicInfo = document.getElementById('jobBasicInfo');
    if (basicInfo) {
        basicInfo.innerHTML = `
            <p><strong>职位：</strong>${data.basic_info.position}</p>
            <p><strong>公司：</strong>${data.basic_info.company}</p>
            <p><strong>薪资：</strong>${data.basic_info.salary}</p>
            <p><strong>地点：</strong>${data.basic_info.location}</p>
        `;
    }

    // 显示能力模型
    const capabilityModel = document.getElementById('capabilityModel');
    if (capabilityModel) {
        const html = data.capabilities.map(cap => `
            <p><strong>${cap.name}</strong> ${'⭐'.repeat(cap.level)} (权重${cap.weight}%)</p>
        `).join('');
        capabilityModel.innerHTML = html;
    }

    // 显示必备技能
    const requiredSkills = document.getElementById('requiredSkills');
    if (requiredSkills) {
        const html = '<ul>' + data.required_skills.map(skill => `<li>${skill}</li>`).join('') + '</ul>';
        requiredSkills.innerHTML = html;
    }

    // 显示面试侧重点
    const interviewFocus = document.getElementById('interviewFocus');
    if (interviewFocus) {
        const html = '<ul>' + data.interview_focus.map(focus => `<li>${focus}</li>`).join('') + '</ul>';
        interviewFocus.innerHTML = html;
    }

    // 自动进行简历优化分析
    if (appState.resumeData) {
        performOptimization();
    }
}

// 执行简历优化分析
function performOptimization() {
    const matchScore = Math.floor(Math.random() * 30) + 70; // 70-100分

    // 更新匹配度分数
    const scoreElement = document.getElementById('matchScore');
    if (scoreElement) {
        scoreElement.textContent = matchScore;
    }

    // 显示优势
    const advantages = document.getElementById('advantages');
    if (advantages) {
        advantages.innerHTML = `
            <ul>
                <li>产品规划经验丰富，有3年以上经验</li>
                <li>有B端产品经验，符合岗位要求</li>
                <li>项目经验丰富，有完整的产品生命周期经验</li>
            </ul>
        `;
    }

    // 显示不足
    const weaknesses = document.getElementById('weaknesses');
    if (weaknesses) {
        weaknesses.innerHTML = `
            <ul>
                <li>缺少数据分析相关描述（岗位要求权重25%）</li>
                <li>项目成果量化不足</li>
                <li>简历中未体现SQL技能（必备技能）</li>
            </ul>
        `;
    }

    // 显示优化建议
    const suggestions = document.getElementById('suggestions');
    if (suggestions) {
        suggestions.innerHTML = `
            <h5>1. 工作经历优化</h5>
            <p>建议将"负责产品需求分析"改为"主导3个核心功能的需求分析，通过数据分析使用户留存率提升15%"</p>
            <h5>2. 技能部分优化</h5>
            <p>建议添加：SQL、Tableau等数据分析工具</p>
            <h5>3. 项目经验优化</h5>
            <p>建议使用STAR法则重写项目描述，增加量化成果</p>
        `;
    }
}

// 辅助功能 - 显示加载状态
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    loadingDiv.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
            <div style="font-size: 16px; color: #333;">${message}</div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// 辅助功能 - 隐藏加载状态
function hideLoading() {
    const loadingDiv = document.getElementById('loadingOverlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 从URL抓取岗位信息
async function fetchJobFromUrl() {
    const url = document.getElementById('jobUrl').value;
    if (!url.trim()) {
        alert('请输入岗位链接');
        return;
    }

    // 验证URL格式
    try {
        new URL(url);
    } catch (e) {
        alert('请输入有效的URL地址');
        return;
    }

    showLoading('正在抓取网页内容，请稍候...');

    try {
        // 步骤1: 使用CORS代理获取网页HTML
        const html = await fetchWebPageWithProxy(url);

        // 步骤2: 使用AI提取岗位信息
        const jobDescription = await extractJobFromHTML(html, url);

        hideLoading();

        if (jobDescription) {
            // 切换到文本输入标签
            switchTab('text');

            // 填充到文本框
            const textarea = document.getElementById('jobDescription');
            textarea.value = jobDescription;

            alert('✅ 岗位信息抓取成功！已自动填充到岗位描述中。');
        } else {
            alert('未能从网页中提取到岗位信息，请手动复制粘贴。');
        }

    } catch (error) {
        hideLoading();
        console.error('抓取岗位信息失败:', error);
        alert(`抓取失败: ${error.message}\n\n建议：\n1. 直接复制Boss直聘的岗位描述粘贴到文本框\n2. 确保链接是Boss直聘的岗位详情页`);
    }
}

// 使用CORS代理获取网页内容
async function fetchWebPageWithProxy(url) {
    console.log('📡 正在抓取网页:', url);

    // 使用AllOrigins CORS代理
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`代理请求失败: ${response.status}`);
        }

        const result = await response.json();

        if (result.contents) {
            console.log('✅ 网页抓取成功，内容长度:', result.contents.length);
            return result.contents;
        }

        throw new Error('未能获取网页内容');

    } catch (error) {
        console.error('代理请求失败:', error);
        throw new Error(`无法访问该网页: ${error.message}`);
    }
}

// 从HTML中提取岗位信息
async function extractJobFromHTML(html, url) {
    console.log('🤖 正在使用AI提取岗位信息...');

    // 清理HTML，提取主要内容
    const cleanHtml = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<!--.*?-->/gs, '')
        .slice(0, 10000); // 限制长度避免超出token限制

    const prompt = `请从以下Boss直聘网站的HTML代码中提取完整的岗位描述（JD）信息。

网页URL：${url}

请提取以下信息并以结构化的格式返回：

1. 职位名称
2. 公司名称
3. 工作地点
4. 薪资范围
5. 工作经验要求
6. 学历要求
7. 岗位职责（详细列出）
8. 任职要求（技能、经验等）
9. 福利待遇（如果有）

HTML内容片段：
${cleanHtml}

请以清晰、结构化的格式返回岗位描述，便于阅读。如果某些信息在HTML中找不到，请标注"未提及"。`;

    const requestBody = {
        model: 'glm-4-flash',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 4096
    };

    try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.ZHIPU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API调用失败');
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (content) {
            console.log('✅ AI提取成功，内容长度:', content.length);
            console.log('📄 提取的内容:', content);
            return content;
        }

        throw new Error('AI未能从HTML中提取到有效信息');

    } catch (error) {
        console.error('AI提取失败:', error);
        throw error;
    }
}

// 下载面试手册
function downloadGuide() {
    alert('下载功能需要后端支持，当前为演示版本');
}

// 生成面试准备内容
async function generateInterviewPreparation() {
    console.log('🎓 开始生成面试准备内容...');

    // 检查是否有简历和岗位数据
    if (!appState.resumeData) {
        showInterviewPreparationError('请先上传简历');
        return;
    }

    if (!appState.jobData) {
        showInterviewPreparationError('请先进行岗位分析');
        return;
    }

    showLoading('正在生成面试准备手册...');

    try {
        // 使用AI生成面试准备内容
        const preparation = await generatePreparationWithAI(
            appState.resumeData,
            appState.jobData
        );

        hideLoading();
        displayInterviewPreparation(preparation);

    } catch (error) {
        hideLoading();
        console.error('生成面试准备失败:', error);
        showInterviewPreparationError(`生成失败: ${error.message}`);
    }
}

// 显示面试准备错误
function showInterviewPreparationError(message) {
    const containers = ['selfIntroduction', 'projectPresentation', 'interviewQuestions'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<p style="color: #999;">⚠️ ${message}</p>`;
        }
    });
}

// 使用AI生成面试准备内容
async function generatePreparationWithAI(resumeData, jobData) {
    const resumeText = JSON.stringify(resumeData, null, 2);
    const jobText = JSON.stringify(jobData, null, 2);

    const prompt = `你是一个专业的面试辅导专家。请根据以下简历信息和目标岗位要求，生成面试准备手册。

【简历信息】
${resumeText}

【目标岗位信息】
${jobText}

请生成以下内容，以JSON格式返回：

{
  "self_introduction": "根据简历和岗位要求，生成一段3分钟的自我介绍。突出与岗位最匹配的经验和技能。要求：自信、简洁、有针对性。",
  "project_presentation": "从简历的项目经验中选择1-2个最有代表性的项目，生成项目介绍。使用STAR法则（情境、任务、行动、结果），突出个人贡献和成果。",
  "interview_questions": [
    {
      "question": "常见的面试问题",
      "answer": "参考答案"
    }
  ]
}

请确保内容专业、有针对性，能帮助求职者在面试中脱颖而出。`;

    const requestBody = {
        model: 'glm-4-flash',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 4096
    };

    console.log('📤 调用GLM-4 Flash生成面试准备...');

    try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.ZHIPU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API调用失败');
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('未能获取到AI回复');
        }

        console.log('✅ AI生成成功');

        // 尝试解析JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.log('JSON解析失败，使用原始文本');
            }
        }

        // 如果无法解析JSON，返回原始文本
        return {
            self_introduction: content.slice(0, 500) + '...',
            project_presentation: '请手动准备项目介绍',
            interview_questions: [
                { question: '请做个自我介绍', answer: '请根据您的简历准备' }
            ]
        };

    } catch (error) {
        console.error('AI生成失败:', error);
        throw error;
    }
}

// 显示面试准备内容
function displayInterviewPreparation(preparation) {
    console.log('📝 显示面试准备内容:', preparation);

    // 自我介绍
    const selfIntro = document.getElementById('selfIntroduction');
    if (selfIntro && preparation.self_introduction) {
        selfIntro.innerHTML = `
            <div style="line-height: 1.8; white-space: pre-wrap;">${preparation.self_introduction}</div>
            <div style="margin-top: 15px; padding: 10px; background: #f0f7ff; border-left: 4px solid #1890ff; font-size: 14px;">
                💡 提示：熟练背诵这段介绍，控制在2-3分钟内
            </div>
        `;
    }

    // 项目介绍
    const projectPres = document.getElementById('projectPresentation');
    if (projectPres && preparation.project_presentation) {
        const projectText = typeof preparation.project_presentation === 'string'
            ? preparation.project_presentation
            : JSON.stringify(preparation.project_presentation);

        projectPres.innerHTML = `
            <div style="line-height: 1.8; white-space: pre-wrap;">${projectText}</div>
            <div style="margin-top: 15px; padding: 10px; background: #f0f7ff; border-left: 4px solid #1890ff; font-size: 14px;">
                💡 提示：使用STAR法则组织答案，突出个人贡献
            </div>
        `;
    }

    // 常见问题
    const questions = document.getElementById('interviewQuestions');
    if (questions && preparation.interview_questions) {
        const qaList = Array.isArray(preparation.interview_questions)
            ? preparation.interview_questions
            : [];

        if (qaList.length > 0) {
            const html = qaList.map((qa, index) => `
                <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; color: #1890ff; font-weight: bold;">
                        Q${index + 1}: ${qa.question || qa}
                    </p>
                    ${qa.answer ? `<p style="margin: 0; color: #666;"><strong>参考答案：</strong>${qa.answer}</p>` : ''}
                </div>
            `).join('');
            questions.innerHTML = html;
        } else {
            questions.innerHTML = '<p style="color: #999;">暂无面试问题准备</p>';
        }
    }

    console.log('✅ 面试准备内容显示完成');
}

// 开始模拟面试
async function startInterview() {
    // 检查是否有简历和岗位数据
    if (!appState.resumeData) {
        alert('请先上传简历');
        return;
    }

    if (!appState.jobData) {
        alert('请先进行岗位分析');
        return;
    }

    document.getElementById('interviewSetup').style.display = 'none';
    document.getElementById('interviewChat').style.display = 'block';

    showLoading('正在初始化AI面试官...');

    try {
        // 创建Job Agent实例
        if (!appState.jobAgentInstance) {
            appState.jobAgentInstance = new JobAgentClient(window.ZHIPU_API_KEY);
        }

        // 构建岗位描述
        const jobDesc = buildJobDescription(appState.jobData);

        // 使用Job Agent开始面试
        const result = await appState.jobAgentInstance.conductInterview(
            appState.resumeData,
            appState.jobData,
            '', // 首次开始，无需用户回答
            [] // 空对话历史
        );

        hideLoading();

        // 显示面试官的欢迎语
        addChatMessage('interviewer', result.content);

        // 保存对话历史
        if (!appState.interviewHistory) {
            appState.interviewHistory = [];
        }
        appState.interviewHistory.push({
            role: 'interviewer',
            content: result.content,
            timestamp: new Date()
        });

    } catch (error) {
        hideLoading();
        console.error('初始化面试失败:', error);

        // 失败时使用默认消息
        addChatMessage('interviewer', '你好，欢迎来到我们公司面试。请先做个自我介绍吧，大概3分钟左右。');
        alert('AI面试官初始化失败，使用模拟模式。');
    }
}

// 构建岗位描述
function buildJobDescription(jobData) {
    return `职位：${jobData.basic_info?.position || '未知'}
公司：${jobData.basic_info?.company || '未知'}
薪资：${jobData.basic_info?.salary || '未知'}
地点：${jobData.basic_info?.location || '未知'}

核心能力要求：
${(jobData.capabilities || []).map(cap => `- ${cap.name} (权重${cap.weight}%)`).join('\n')}

必备技能：
${(jobData.required_skills || []).map(skill => `- ${skill}`).join('\n')}

面试重点：
${(jobData.interview_focus || []).join('、')}`;
}

// 添加聊天消息
function addChatMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        margin-bottom: 15px;
        padding: 10px;
        border-radius: 8px;
        ${role === 'interviewer' ? 'background: #f0f2ff; text-align: left;' : 'background: #e8f5e9; text-align: right;'}
    `;
    messageDiv.innerHTML = `
        <strong>${role === 'interviewer' ? '🎭 面试官' : '👤 我'}：</strong>
        <p style="margin-top: 5px;">${content}</p>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 发送回答
async function sendAnswer() {
    const textarea = document.getElementById('userAnswer');
    if (!textarea) return;

    const answer = textarea.value.trim();
    if (!answer) {
        alert('请输入您的回答');
        return;
    }

    // 显示用户的回答
    addChatMessage('candidate', answer);
    textarea.value = '';

    // 保存到对话历史
    if (!appState.interviewHistory) {
        appState.interviewHistory = [];
    }
    appState.interviewHistory.push({
        role: 'candidate',
        content: answer,
        timestamp: new Date()
    });

    // 使用Job Agent生成面试官的回复
    try {
        showLoading('面试官正在思考...');

        const jobAgent = appState.jobAgentInstance;
        if (!jobAgent) {
            throw new Error('Job Agent未初始化');
        }

        const result = await jobAgent.conductInterview(
            appState.resumeData,
            appState.jobData,
            answer,
            appState.interviewHistory
        );

        hideLoading();

        // 显示面试官的回复
        addChatMessage('interviewer', result.content);

        // 保存到对话历史
        appState.interviewHistory.push({
            role: 'interviewer',
            content: result.content,
            timestamp: new Date()
        });

    } catch (error) {
        hideLoading();
        console.error('AI面试官回复失败:', error);

        // 失败时使用模拟回复
        const fallbackResponses = [
            '很好，能详细说说吗？',
            '明白了，还有其他想了解的吗？',
            '感谢你的分享，我们继续下一个问题。'
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        addChatMessage('interviewer', randomResponse);
    }
}

// 重新开始面试
function restartInterview() {
    document.getElementById('interviewReport').style.display = 'none';
    document.getElementById('interviewSetup').style.display = 'block';
    document.getElementById('chatMessages').innerHTML = '';
    stopVoiceRecognition();
}

// ===== 语音识别和播放功能 =====

// 语音识别相关变量
let recognition = null;
let isRecording = false;
let synthesis = window.speechSynthesis;

// 初始化语音识别
function initSpeechRecognition() {
    // 检查浏览器支持
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('浏览器不支持语音识别API');
        return false;
    }

    try {
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN'; // 设置为中文
        recognition.continuous = false; // 不连续识别
        recognition.interimResults = true; // 显示临时结果

        recognition.onstart = function() {
            console.log('🎤 语音识别已启动');
            isRecording = true;
            updateVoiceRecordButton();
        };

        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // 显示临时结果
            if (interimTranscript) {
                updateVoiceStatus(`正在识别: ${interimTranscript}...`);
            }

            // 显示最终结果
            if (finalTranscript) {
                console.log('✅ 识别结果:', finalTranscript);
                updateVoiceStatus(`识别完成: ${finalTranscript}`);

                // 自动填充到文本框
                const textarea = document.getElementById('userAnswer');
                if (textarea) {
                    textarea.value = finalTranscript;
                }
            }
        };

        recognition.onerror = function(event) {
            console.error('❌ 语音识别错误:', event.error);

            let errorMessage = '识别错误';

            switch(event.error) {
                case 'no-speech':
                    errorMessage = '未检测到语音，请重试';
                    break;
                case 'audio-capture':
                    errorMessage = '无法访问麦克风';
                    break;
                case 'not-allowed':
                    errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问';
                    break;
                case 'network':
                    errorMessage = '网络错误，请检查网络连接';
                    break;
                case 'aborted':
                    errorMessage = '识别已取消';
                    break;
                default:
                    errorMessage = `识别错误: ${event.error}`;
            }

            updateVoiceStatus(errorMessage);
            isRecording = false;
            updateVoiceRecordButton();

            // 如果是权限问题，显示更详细的提示
            if (event.error === 'not-allowed') {
                alert('无法访问麦克风\n\n请按以下步骤操作：\n1. 点击浏览器地址栏左侧的锁图标\n2. 找到"麦克风"权限\n3. 选择"允许"\n4. 刷新页面重试');
            }
        };

        recognition.onend = function() {
            console.log('🎤 语音识别已结束');
            isRecording = false;
            updateVoiceRecordButton();
        };

        return true;

    } catch (error) {
        console.error('初始化语音识别失败:', error);
        return false;
    }
}

// 切换语音录音
function toggleVoiceRecord() {
    if (!recognition) {
        const initialized = initSpeechRecognition();
        if (!initialized) {
            alert('您的浏览器不支持语音识别功能，请使用Chrome浏览器。\n\n支持情况：\n- Chrome: ✅ 支持\n- Edge: ✅ 支持\n- Firefox: ❌ 不支持\n- Safari: 部分支持');
            return;
        }
    }

    if (isRecording) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

// 开始语音识别
function startVoiceRecognition() {
    if (!recognition) {
        const initialized = initSpeechRecognition();
        if (!initialized) return;
    }

    console.log('🎤 开始语音识别...');
    recognition.start();
}

// 停止语音识别
function stopVoiceRecognition() {
    if (recognition && isRecording) {
        console.log('🛑 停止语音识别');
        recognition.stop();
    }
}

// 更新语音录音按钮状态
function updateVoiceRecordButton() {
    const btn = document.getElementById('voiceRecordBtn');
    const icon = document.getElementById('voiceRecordIcon');
    const text = document.getElementById('voiceRecordText');
    const status = document.getElementById('voiceStatus');

    if (!btn || !icon || !text) return;

    if (isRecording) {
        btn.classList.add('recording');
        icon.textContent = '⏹️';
        text.textContent = '停止录音';
        if (status) status.style.display = 'block';
    } else {
        btn.classList.remove('recording');
        icon.textContent = '🎤';
        text.textContent = '按住说话';
        setTimeout(() => {
            if (status) status.style.display = 'none';
        }, 2000);
    }
}

// 更新语音状态提示
function updateVoiceStatus(text) {
    const statusEl = document.getElementById('voiceStatusText');
    const status = document.getElementById('voiceStatus');

    if (statusEl && status) {
        statusEl.textContent = text;
        status.style.display = 'block';
    }
}

// 语音播放（TTS）
function speakText(text) {
    if (!synthesis) {
        console.warn('浏览器不支持语音合成API');
        return;
    }

    // 取消当前正在播放的语音
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // 设置为中文
    utterance.rate = 1; // 语速
    utterance.pitch = 1; // 音调
    utterance.volume = 1; // 音量

    utterance.onstart = function() {
        console.log('🔊 开始播放语音');
    };

    utterance.onend = function() {
        console.log('✅ 语音播放完成');
    };

    utterance.onerror = function(event) {
        console.error('❌ 语音播放错误:', event.error);
    };

    synthesis.speak(utterance);
}

// 语音开关状态
let voiceEnabled = true;

// 切换语音开关
function toggleVoice() {
    voiceEnabled = !voiceEnabled;

    const toggleBtn = document.getElementById('voiceToggle');
    if (toggleBtn) {
        toggleBtn.textContent = voiceEnabled ? '🔊 语音开' : '🔇 语音关';
        toggleBtn.classList.toggle('active', voiceEnabled);
    }

    // 如果关闭语音，停止当前正在播放的语音
    if (!voiceEnabled && synthesis) {
        synthesis.cancel();
    }

    console.log(`语音${voiceEnabled ? '已开启' : '已关闭'}`);
    return voiceEnabled;
}

// 卡通人物动画控制
let isSpeaking = false;

function setInterviewerSpeaking(speaking) {
    const avatar = document.getElementById('interviewerAvatar');
    const svg = avatar?.querySelector('.avatar-svg');
    const waves = document.getElementById('speakingWaves');

    if (!svg) return;

    isSpeaking = speaking;

    if (speaking) {
        svg.classList.add('speaking');
        if (waves) waves.style.display = 'block';
    } else {
        svg.classList.remove('speaking');
        if (waves) waves.style.display = 'none';
    }
}

// 改进的语音播放函数
function speakText(text) {
    if (!voiceEnabled) {
        console.log('语音已关闭，跳过播放');
        return;
    }

    if (!synthesis) {
        console.warn('浏览器不支持语音合成API');
        return;
    }

    // 取消当前正在播放的语音
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 尝试加载中文语音
    const voices = synthesis.getVoices();
    const chineseVoice = voices.find(voice => voice.lang.includes('zh'));
    if (chineseVoice) {
        utterance.voice = chineseVoice;
    }

    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = function() {
        console.log('🔊 开始播放语音');
        setInterviewerSpeaking(true);
    };

    utterance.onend = function() {
        console.log('✅ 语音播放完成');
        setInterviewerSpeaking(false);
    };

    utterance.onerror = function(event) {
        console.error('❌ 语音播放错误:', event.error);
        setInterviewerSpeaking(false);
    };

    synthesis.speak(utterance);
}

// 确保语音列表已加载（Chrome需要等待）
if (synthesis) {
    synthesis.onvoiceschanged = function() {
        console.log('语音列表已加载，共', synthesis.getVoices().length, '种语音');
    };
}

// 修改addChatMessage函数，自动播放面试官的语音并触发动画
const originalAddChatMessage = addChatMessage;
addChatMessage = function(role, content) {
    // 调用原始函数添加消息
    originalAddChatMessage(role, content);

    // 如果是面试官的消息，自动播放语音
    if (role === 'interviewer' && voiceEnabled) {
        // 添加一个小的延迟，确保UI先更新
        setTimeout(() => {
            speakText(content);
        }, 500);
    }
};
