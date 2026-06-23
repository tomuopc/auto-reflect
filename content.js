// 定义输入框映射关系
// key: 对应 template.js 中的 userPromptKeys
// selector: CSS 选择器
// type: 'text' | 'radio' | 'weekly_qa'
const FIELD_MAPPING = {
    'user_workSummary': {
        selector: 'div.editor-content[contenteditable="true"]',
        type: 'text'
    },
    'user_learn': {
        selector: 'div.strange-textarea textarea[rows="4"]',
        type: 'text'
    },
    'user_cantSolve': {
        selector: 'div.strange-textarea textarea[rows="13"]',
        type: 'text'
    },
    'user_mistakes': {
        selector: 'textarea[rows="6"][maxlength="400"]',
        type: 'text'
    },
    'user_nextTasks': {
        selector: 'div.strange-textarea textarea[rows="7"]',
        type: 'text'
    },
    'user_didToday': {
        selector: 'div.strange-textarea textarea[rows="6"]',
        type: 'text'
    },
    'user_weeklySummary': {
        selector: 'div.weekly-qa',
        type: 'weekly_qa'
    },
    'user_impossible': {
        selector: 'textarea[placeholder*="宏伟目标"]',
        triggerSelector: 'p.title-underline.cursor-pointer',
        triggerText: '不可能的挑战',
        type: 'text'
    },
    'user_share': {
        selector: 'input[placeholder="请输入标题"]', // 用于检测是否已打开
        triggerSelector: 'p.title-underline.cursor-pointer',
        triggerText: '添加任何你想分享的内容',
        type: 'structured_text',
        fields: {
            title: 'input[placeholder="请输入标题"]',
            content: 'textarea[placeholder="请输入内容"]'
        }
    },
    'user_badge': {
        selector: 'div.recognition',
        type: 'radio'
    }
};

// AI 生成函数
async function generateContent(systemPrompt, userPrompt, config) {
    try {
        const response = await fetch(config.CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.API_KEY}`
            },
            body: JSON.stringify({
                model: config.MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: config.TEMPERATURE
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Invalid API response:', data);
            throw new Error('Invalid API response structure');
        }

        const content = data.choices[0].message.content;
        
        if (content === undefined || content === null) {
            console.error('API returned empty content:', data);
            throw new Error('API returned empty content');
        }

        return content;
    } catch (error) {
        console.error('AI generation error:', error);
        throw error;
    }
}

// 带重试机制的 AI 生成函数
async function generateContentWithRetry(systemPrompt, userPrompt, config, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (i > 0) {
                console.log(`Retry attempt ${i + 1} for prompt: ${userPrompt.substring(0, 20)}...`);
                // 重试前短暂等待
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const content = await generateContent(systemPrompt, userPrompt, config);
            
            // 检查内容是否为空字符串
            if (content && content.trim().length > 0) {
                return content;
            }
            
            console.warn(`Attempt ${i + 1} returned empty content.`);
            lastError = new Error('Generated content is empty');
            
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error);
            lastError = error;
        }
    }
    
    throw lastError || new Error(`Failed to generate content after ${maxRetries} attempts`);
}

// 模拟人类输入
function simulateInput(element, text) {
    if (!element) return;
    if (text === undefined || text === null) {
        console.warn('simulateInput received undefined/null text, skipping fill.');
        return;
    }
    
    // 聚焦元素
    element.focus();

    if (element.tagName === 'DIV' && element.isContentEditable) {
        element.innerText = text;
        // 触发 input 事件以通知 Vue/React 等框架
        element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// 随机选择徽章
function selectRandomBadge(container) {
    if (!container) return;
    
    // 排除自定义徽章 (.custom)
    const radios = container.querySelectorAll('.item:not(.custom) .van-radio');
    if (radios.length === 0) return;

    // 随机选择一个索引
    const randomIndex = Math.floor(Math.random() * radios.length);
    const radio = radios[randomIndex];
    
    // 模拟点击
    radio.click();
    console.log(`Selected random badge at index ${randomIndex}`);
}

// 每周总结问答：每组随机选择前两个选项之一
async function selectRandomWeeklyQaAnswers(container) {
    if (!container) return;

    const qaItems = container.querySelectorAll('.weekly-qa-item');
    if (qaItems.length === 0) {
        console.warn('Weekly QA items not found.');
        return;
    }

    for (const item of qaItems) {
        const options = item.querySelectorAll('.weekly-qa-options .qa-option');
        if (options.length < 2) {
            console.warn('Weekly QA item does not have two selectable options.');
            continue;
        }

        const randomIndex = Math.floor(Math.random() * 2);
        options[randomIndex].click();
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Randomly selected answers for ${qaItems.length} weekly QA items.`);
}

// 自动发布函数
function publishJournal() {
    const publishBtns = document.querySelectorAll('div.btn.poppins-m-5');
    let targetBtn = null;
    
    for (const btn of publishBtns) {
        if (btn.innerText.trim() === '发布日记') {
            targetBtn = btn;
            break;
        }
    }

    if (targetBtn) {
        console.log('Executing auto publish...');
        targetBtn.click();
    } else {
        console.warn('Publish button not found.');
    }
}

// 自动选中“已完成”状态函数
function selectCompletedStatus() {
    const optionGroups = document.querySelectorAll('div.today-status-options');
    if (optionGroups.length > 0) {
        let selectedYes = false;
        let selectedNo = false;

        for (const group of optionGroups) {
            const buttons = group.querySelectorAll('button.status-option');
            if (buttons.length === 0) continue;

            for (const btn of buttons) {
                const text = btn.innerText.trim().toLowerCase();

                if (!selectedYes && (text === '是' || text === 'yes')) {
                    btn.click();
                    selectedYes = true;
                    break;
                }

                if (!selectedNo && text === 'no') {
                    btn.click();
                    selectedNo = true;
                    break;
                }
            }

            if (selectedYes && selectedNo) {
                break;
            }
        }
    } else {
        console.warn('Status options container not found.');
    }
}

// 创建自动填写按钮
function createAutoFillButton() {
    // 1. URL 限制：只在 https://www.reflect.today/ 或 https://www.reflect.today 生效
    const currentUrl = window.location.href;
    if (currentUrl !== 'https://www.reflect.today/' && currentUrl !== 'https://www.reflect.today') {
        console.log('AI Reflect: Not on homepage (strictly https://www.reflect.today/), skipping.');
        return;
    }

    // 防止重复创建 (但需要处理重新显示的情况)
    if (document.getElementById('ai-reflect-auto-fill-btn')) return;

    // 2. 检查隐藏按钮设置
    chrome.storage.local.get(['hideAutoFillBtn'], function(result) {
        if (result.hideAutoFillBtn) {
            console.log('AI Reflect: Auto-fill button is hidden by setting.');
            return;
        }
        
        // 如果没有隐藏，则创建按钮
        renderButton();
    });

    // 3. 监听设置变化
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local') {
            if (changes.hideAutoFillBtn) {
                if (changes.hideAutoFillBtn.newValue) {
                    // 隐藏按钮和选填框
                    removeButton();
                } else {
                    // 显示按钮 (再次检查 URL，虽然初始化时已经检查过，但为了安全和逻辑完整性)
                    const currentUrl = window.location.href;
                    if (currentUrl === 'https://www.reflect.today/' || currentUrl === 'https://www.reflect.today') {
                        renderButton();
                    }
                }
            }

            if (changes.showOptionalInput) {
                const hideAutoFillBtn = document.getElementById('ai-reflect-auto-fill-btn') === null;
                if (changes.showOptionalInput.newValue) {
                    if (!hideAutoFillBtn) {
                        renderOptionalInput();
                    }
                } else {
                    removeOptionalInput();
                }
            }
        }
    });
}

function removeOptionalInput() {
    const input = document.getElementById('ai-reflect-temp-input');
    if (input) input.remove();
}

function renderOptionalInput() {
    if (document.getElementById('ai-reflect-temp-input')) return;
    if (!document.getElementById('ai-reflect-auto-fill-btn')) return;

    const input = document.createElement('textarea');
    input.id = 'ai-reflect-temp-input';
    input.placeholder = '（可选填）简单概括今日重点工作或特定内容，AI将围绕这些内容生成...';

    Object.assign(input.style, {
        position: 'fixed',
        bottom: '30px',
        right: '160px',
        zIndex: '10000',
        width: '180px',
        height: '46px',
        padding: '8px 12px',
        backgroundColor: 'rgba(30, 60, 90, 0.9)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        fontSize: '14px',
        resize: 'none',
        outline: 'none',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    });

    input.onfocus = () => {
        input.style.border = '1px solid rgba(255, 255, 255, 0.8)';
        input.style.backgroundColor = 'rgba(30, 60, 90, 0.95)';
    };
    input.onblur = () => {
        input.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        input.style.backgroundColor = 'rgba(30, 60, 90, 0.9)';
    };

    document.body.appendChild(input);
}

function removeButton() {
    const btn = document.getElementById('ai-reflect-auto-fill-btn');
    if (btn) btn.remove();
    removeOptionalInput();
}

function renderButton() {
    if (document.getElementById('ai-reflect-auto-fill-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ai-reflect-auto-fill-btn';
    btn.innerHTML = '自动填写';
    
    // 设置样式
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: '10000',
        padding: '12px 24px',
        backgroundColor: '#2ecc71', // 鲜艳的绿色
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)',
        transition: 'all 0.3s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    });

    // 悬停效果
    btn.onmouseover = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 20px rgba(46, 204, 113, 0.6)';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.4)';
    };

    document.body.appendChild(btn);

    chrome.storage.local.get(['showOptionalInput'], function(result) {
        if (result.showOptionalInput) {
            renderOptionalInput();
        }
    });

    // 点击事件
    btn.addEventListener('click', async function() {
        // 获取临时输入框的内容
        const tempInput = document.getElementById('ai-reflect-temp-input');
        const additionalContext = tempInput ? tempInput.value.trim() : '';
        
        // 添加加载动画效果
        const originalText = btn.innerHTML;
        btn.innerHTML = '生成内容中...';
        btn.style.opacity = '0.8';
        btn.style.cursor = 'wait';
        
        try {
            console.log('开始自动填写流程...');
            
            // 1. 读取配置和用户设置 (带迁移逻辑)
            const storageData = await new Promise(resolve => {
                const keys = ['systemPrompt', 'userPrompts', 'userPromptToggles', 'userPromptFridayToggles', 'autoPublish'];
                chrome.storage.local.get(keys, function(localResult) {
                    // Check if critical data is missing in local
                    // 如果本地没有系统提示词和用户提示词，尝试从 sync 读取
                    if (!localResult.systemPrompt && !localResult.userPrompts) {
                        chrome.storage.sync.get(keys, function(syncResult) {
                            // Merge: prefer local, fallback to sync
                            const finalResult = {...localResult};
                            let hasMigration = false;
                            const dataToMigrate = {};

                            keys.forEach(key => {
                                if (finalResult[key] === undefined && syncResult[key] !== undefined) {
                                    finalResult[key] = syncResult[key];
                                    dataToMigrate[key] = syncResult[key];
                                    hasMigration = true;
                                }
                            });

                            if (hasMigration) {
                                console.log('Migrating data from sync to local in content script:', dataToMigrate);
                                chrome.storage.local.set(dataToMigrate);
                            }
                            resolve(finalResult);
                        });
                    } else {
                        resolve(localResult);
                    }
                });
            });

            const systemPrompt = storageData.systemPrompt || '';
            const autoPublish = storageData.autoPublish || false;

            // 检查系统提示词是否存在
            if (!systemPrompt || systemPrompt.trim() === '') {
                if (confirm('检测到尚未设置系统提示词。是否现在前往设置页面？')) {
                    // 发送消息给 background script 打开设置页面
                    chrome.runtime.sendMessage({ action: 'openTemplatePage' });
                }
                return; // 终止后续流程
            }

            const userPrompts = storageData.userPrompts || {};
            const userPromptToggles = storageData.userPromptToggles || {};
            const userPromptFridayToggles = storageData.userPromptFridayToggles || {};
            
            // 2. 查找页面元素并准备任务
            const tasks = [];
            const badgeTask = []; // 特殊处理徽章
            const weeklyQaTasks = []; // 每周问答特殊处理
            
            // 定义需要添加额外上下文的字段
            const contextAwareFields = [
                'user_workSummary',
                'user_learn',
                'user_cantSolve',
                'user_mistakes',
                'user_didToday'
            ];

            // Check if it is Friday based on the 6 weekly QA groups
            const isFriday = document.querySelectorAll('.weekly-qa-item').length === 6;
            console.log(`Friday detection: ${isFriday ? 'Yes' : 'No'}`);

            for (const [key, mapping] of Object.entries(FIELD_MAPPING)) {
                // 检查开关是否开启
                const mainToggle = userPromptToggles[key];
                const fridayToggle = userPromptFridayToggles[key];
                let shouldRun = false;

                if (fridayToggle) {
                    // 如果勾选了"只在周五执行"，则只在周五运行 (无视主开关)
                    shouldRun = isFriday;
                } else {
                    // 否则遵循主开关
                    shouldRun = mainToggle;
                }

                if (!shouldRun) {
                     // console.log(`Skipping ${key}: shouldRun is false (FridayOnly: ${fridayToggle}, Main: ${mainToggle}, IsFriday: ${isFriday})`);
                     continue;
                }

                // 检查是否需要触发点击才能显示输入框
                let element = document.querySelector(mapping.selector);
                
                // 针对 user_mistakes (第四部分：我犯了什么错误) 的特殊处理
                if (key === 'user_mistakes') {
                    const dropdowns = document.querySelectorAll('.van-dropdown-menu__title');
                    for (const dt of dropdowns) {
                        if (dt.innerText.includes('Select a category')) {
                            dt.click();
                            // 等待下拉菜单展开
                            await new Promise(r => setTimeout(r, 300));
                            
                            // 查找并点击特定选项
                            const options = document.querySelectorAll('.van-cell__title span');
                            for (const opt of options) {
                                if (opt.innerText.includes('I found my mistake by myself:')) {
                                    // 尽量点击外层容器以确保触发 Vant 组件事件
                                    const cell = opt.closest('.van-cell') || opt;
                                    cell.click();
                                    // 等待输入框渲染
                                    await new Promise(r => setTimeout(r, 300));
                                    break;
                                }
                            }
                            break; // 处理完下拉逻辑后跳出循环
                        }
                    }
                    // 重新获取元素，因为可能刚刚才渲染出来
                    element = document.querySelector(mapping.selector);
                }

                // 如果元素不存在，且定义了触发器，尝试触发
                if (!element && mapping.triggerSelector) {
                    const triggers = document.querySelectorAll(mapping.triggerSelector);
                    let targetTrigger = null;
                    
                    // 如果定义了触发文本，则精确匹配
                    if (mapping.triggerText) {
                        for (const trigger of triggers) {
                            if (trigger.innerText.trim() === mapping.triggerText) {
                                targetTrigger = trigger;
                                break;
                            }
                        }
                    } else {
                        targetTrigger = triggers[0];
                    }

                    if (targetTrigger) {
                        console.log(`Triggering click for ${key}`);
                        targetTrigger.click();
                        // 等待一下让输入框渲染
                        await new Promise(r => setTimeout(r, 300));
                        // 再次尝试获取元素
                        element = document.querySelector(mapping.selector);
                    }
                }

                if (element || mapping.type === 'multi_text' || mapping.type === 'structured_text' || mapping.type === 'weekly_qa') {
                    if (mapping.type === 'text') {
                        // 文本任务：添加到生成队列
                        let prompt = userPrompts[key];
                        
                        // 如果有额外输入，且当前字段在支持列表中，则追加上下文
                        if (additionalContext && contextAwareFields.includes(key)) {
                            prompt += `\n\n【重要补充】本次生成请务必包含或围绕以下内容进行：${additionalContext}`;
                        }
                        
                        if (prompt) {
                            tasks.push({
                                key,
                                element,
                                prompt
                            });
                        }
                    } else if (mapping.type === 'multi_text') {
                        // 多文本任务：一次生成，分割填入
                        const elements = document.querySelectorAll(mapping.selector);
                        let prompt = userPrompts[key];
                        
                        if (prompt && elements.length > 0) {
                            // 构造新的提示词，要求 AI 返回 JSON 数组格式
                            const count = elements.length;
                            const enhancedPrompt = `${prompt}\n\n【重要指令】请严格生成 ${count} 条不同的内容。结果必须是一个纯 JSON 字符串数组，格式如：["内容1", "内容2", "内容3", ...]。不要包含 markdown 代码块标记，不要包含其他解释性文字，只返回 JSON 数组本身。`;

                            // 创建一个特殊的任务，需要后续处理分割
                            tasks.push({
                                key: key,
                                elements: Array.from(elements), // 保存所有目标元素
                                prompt: enhancedPrompt,
                                type: 'multi_text' // 使用 type 字段标识
                            });
                            console.log(`Prepared multi_text task for key: ${key} with ${count} targets`);
                        }
                    } else if (mapping.type === 'weekly_qa') {
                        if (element) {
                            weeklyQaTasks.push({
                                key,
                                element
                            });
                            console.log(`Prepared weekly_qa task for key: ${key}`);
                        }
                    } else if (mapping.type === 'structured_text') {
                        // 结构化文本任务：生成 JSON 对象填入不同字段
                        const prompt = userPrompts[key];
                        // 查找所有子字段元素
                        const fieldElements = {};
                        let allFieldsFound = true;
                        
                        for (const [fieldName, fieldSelector] of Object.entries(mapping.fields)) {
                            const el = document.querySelector(fieldSelector);
                            if (el) {
                                fieldElements[fieldName] = el;
                            } else {
                                console.warn(`Field element not found: ${fieldName} (${fieldSelector})`);
                                allFieldsFound = false;
                            }
                        }

                        if (prompt && allFieldsFound) {
                            const enhancedPrompt = `${prompt}\n\n【重要指令】请生成两部分内容：标题和正文。结果必须是一个纯 JSON 对象，格式如：{"title": "你的标题", "content": "你的详细内容"}。不要包含 markdown 代码块标记，只返回 JSON 对象本身。`;
                            
                            tasks.push({
                                key: key,
                                elements: fieldElements,
                                prompt: enhancedPrompt,
                                type: 'structured_text'
                            });
                            console.log(`Prepared structured_text task for key: ${key}`);
                        }
                    } else if (mapping.type === 'radio') {
                        // 单选任务：直接处理
                        badgeTask.push({
                            element
                        });
                    }
                } else {
                    console.warn(`Element not found for key: ${key}, selector: ${mapping.selector}`);
                }
            }

            // 3. 并发执行 AI 生成
            if (tasks.length > 0) {
                console.log(`Found ${tasks.length} text fields to fill.`);
                
                const generatePromises = tasks.map(async (task) => {
                    try {
                        const content = await generateContentWithRetry(systemPrompt, task.prompt, AI_CONFIG);
                        return { ...task, content, success: true };
                    } catch (err) {
                        console.error(`Failed to generate content for ${task.key} after retries:`, err);
                        return { ...task, success: false };
                    }
                });

                const results = await Promise.all(generatePromises);

                // 4. 填入内容
                results.forEach(result => {
                    if (result.success) {
                        if (result.type === 'multi_text') {
                            // 处理多文本填入
                            try {
                                // 尝试解析 JSON
                                let contentArray = [];
                                // 清理可能的 markdown 标记
                                const cleanContent = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
                                contentArray = JSON.parse(cleanContent);

                                if (Array.isArray(contentArray)) {
                                    result.elements.forEach((el, index) => {
                                        if (index < contentArray.length) {
                                            simulateInput(el, contentArray[index]);
                                        }
                                    });
                                    console.log(`Filled ${contentArray.length} items for ${result.key}`);
                                } else {
                                    console.error(`Parsed content for ${result.key} is not an array`);
                                }
                            } catch (e) {
                                console.error(`Failed to parse JSON for ${result.key}:`, e);
                                // Fallback: 如果解析失败，尝试按换行符分割
                                const lines = result.content.split('\n').filter(line => line.trim());
                                result.elements.forEach((el, index) => {
                                    if (index < lines.length) {
                                        simulateInput(el, lines[index]);
                                    }
                                });
                            }
                        } else if (result.type === 'structured_text') {
                            // 处理结构化文本填入
                            try {
                                const cleanContent = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
                                const data = JSON.parse(cleanContent);
                                
                                if (result.elements.title && data.title) {
                                    simulateInput(result.elements.title, data.title);
                                }
                                if (result.elements.content && data.content) {
                                    simulateInput(result.elements.content, data.content);
                                }
                                console.log(`Filled structured content for ${result.key}`);
                            } catch (e) {
                                console.error(`Failed to parse JSON for ${result.key}:`, e);
                            }
                        } else {
                            // 普通单文本填入
                            simulateInput(result.element, result.content);
                            console.log(`Filled ${result.key}`);
                        }
                    }
                });
            } else {
                console.log('No text fields matched or enabled.');
            }

            // 5. 处理徽章 (随机选择)
            if (badgeTask.length > 0) {
                selectRandomBadge(badgeTask[0].element);
            }

            // 6. 处理每周总结问答（随机选择）
            if (weeklyQaTasks.length > 0) {
                await selectRandomWeeklyQaAnswers(weeklyQaTasks[0].element);
            }
            
            // 7. 自动选中“已完成”
            selectCompletedStatus();

            // 8. 自动发布
            if (autoPublish) {
                // 等待一小会儿确保填入操作已完成且 UI 已更新
                setTimeout(() => {
                    publishJournal();
                }, 1000);
            }

            console.log('自动填写流程结束');
            
        } catch (error) {
            console.error('自动填写出错:', error);
            alert('自动填写出错: ' + error.message);
        } finally {
            // 恢复按钮状态
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });

    document.body.appendChild(btn);
}

// 页面加载完成后添加按钮
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createAutoFillButton);
} else {
    createAutoFillButton();
}
