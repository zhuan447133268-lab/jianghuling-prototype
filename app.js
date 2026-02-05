// 全局状态
let currentUser = {
    name: '侠客' + Math.floor(Math.random() * 1000),
    title: '初入江湖',
    helped: 0,
    published: 0,
    rating: 0,
    ratedCount: 0,
    badges: [],
    history: [],
    canPublish: true,
    canAccept: true,
    avatar: '🗡️',
    avatarUrl: null // 存储上传的图片URL
};

let selectedType = 'urgent';
let currentGuideStep = 1;
let currentChatTokenId = null;
let currentRateUserId = null;
let currentRating = 0;
let currentFilterType = 'all';

// 模拟江湖令数据
let mockTokens = [
    {
        id: 1,
        type: 'urgent',
        content: '我的车在高速上抛锚了，需要帮忙换个轮胎，有人在附近吗？',
        userName: '游侠阿飞',
        userTitle: '行侠仗义',
        userAvatar: '⚔️',
        distance: '800米',
        time: '10分钟前',
        acceptor: null,
        status: 'waiting'
    },
    {
        id: 2,
        type: 'gather',
        content: '晚上8点想找个饭友一起吃火锅，一个人吃太无聊了，有人一起吗？',
        userName: '酒家小二',
        userTitle: '无名小卒',
        userAvatar: '🍺',
        distance: '300米',
        time: '20分钟前',
        acceptor: null,
        status: 'waiting'
    },
    {
        id: 3,
        type: 'reward',
        content: '帮我取个快递，就在楼下便利店，请喝奶茶！',
        userName: '书生李白',
        userTitle: '初入江湖',
        userAvatar: '📚',
        distance: '100米',
        time: '5分钟前',
        acceptor: null,
        status: 'waiting'
    },
    {
        id: 4,
        type: 'urgent',
        content: '家里老人突然不舒服，需要有人帮忙送到医院，急！',
        userName: '侠女小红',
        userTitle: '行侠仗义',
        userAvatar: '🎭',
        distance: '500米',
        time: '2分钟前',
        acceptor: null,
        status: 'waiting'
    },
    {
        id: 5,
        type: 'gather',
        content: '周末想去爬山，有没有人一起组队？',
        userName: '登山客',
        userTitle: '无名小卒',
        userAvatar: '🏔️',
        distance: '600米',
        time: '30分钟前',
        acceptor: null,
        status: 'waiting'
    }
];

// 聊天消息存储
let chatMessages = {};

// 头衔进阶规则
const titleLevels = [
    { name: '初入江湖', threshold: 0 },
    { name: '无名小卒', threshold: 5 },
    { name: '行侠仗义', threshold: 15 },
    { name: '名震一方', threshold: 30 },
    { name: '一代宗师', threshold: 50 }
];

// 勋章定义
const badgeDefinitions = {
    timelyRain: { name: '及时雨', icon: '⚡', desc: '在急字令中响应最快的前10%' },
    gourmet: { name: '老饕客', icon: '🍜', desc: '成功组织过50次以上饭局拼团' },
    hiddenMerit: { name: '深藏功名', icon: '🌟', desc: '好评率100%且从未主动索取报酬' }
};

// 页面切换
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 页面特定逻辑
    if (pageName === 'home') {
        renderTokenList();
    } else if (pageName === 'profile') {
        updateProfile();
    }
}

// 登录功能
function loginWithPhone() {
    const phone = document.getElementById('phone').value;
    if (phone.length === 11) {
        currentUser.name = '侠客' + phone.slice(-4);
        showPage('home');
        renderTokenList();
    } else {
        alert('请输入正确的手机号');
    }
}

function loginWithWechat() {
    currentUser.name = '侠客' + Math.floor(Math.random() * 1000);
    showPage('home');
    renderTokenList();
}

// 新手引导
function nextGuide() {
    if (currentGuideStep < 3) {
        document.getElementById('guide-' + currentGuideStep).style.display = 'none';
        currentGuideStep++;
        document.getElementById('guide-' + currentGuideStep).style.display = 'block';

        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector('.dot[data-guide="' + currentGuideStep + '"]').classList.add('active');

        if (currentGuideStep === 3) {
            document.getElementById('guide-btn').textContent = '开始江湖之旅';
        }
    } else {
        showPage('home');
    }
}

// 筛选函数
function filterTokens(type) {
    document.querySelectorAll('.token-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.token-item[data-type="${type}"]`).classList.add('active');
    currentFilterType = type;
    renderTokenList();
}

// 渲染江湖令列表
function renderTokenList() {
    const listContainer = document.getElementById('token-list');
    let filteredTokens = mockTokens;

    if (currentFilterType !== 'all') {
        filteredTokens = mockTokens.filter(token => token.type === currentFilterType);
    }

    // 急字令置顶，然后按距离排序
    filteredTokens.sort((a, b) => {
        // 急字令优先
        if (a.type === 'urgent' && b.type !== 'urgent') return -1;
        if (a.type !== 'urgent' && b.type === 'urgent') return 1;

        // 同类型按距离排序（从近到远）
        const distA = parseInt(a.distance) || 0;
        const distB = parseInt(b.distance) || 0;
        return distA - distB;
    });

    if (filteredTokens.length === 0) {
        listContainer.innerHTML = '<div class="token-empty">暂无江湖令</div>';
        return;
    }

    listContainer.innerHTML = filteredTokens.map(token => {
        const typeClass = token.type;

        return `
            <div class="token-card" onclick="showTokenDetail(${token.id})">
                <div class="card-header">
                    <div class="user-avatar">${token.userAvatar}</div>
                    <div class="user-info">
                        <div class="user-name">${token.userName}</div>
                        <div class="user-title">${token.userTitle}</div>
                    </div>
                    <div class="card-type ${typeClass}">${token.type === 'urgent' ? '急字令' : token.type === 'gather' ? '聚字令' : '赏字令'}</div>
                </div>
                <div class="card-content">${token.content}</div>
                <div class="card-footer">
                    <div class="card-meta">
                        <span>📍 ${token.distance}</span>
                        <span>⏱️ ${token.time}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 旧的渲染代码备份
/*
    listContainer.innerHTML = filteredTokens.map(token => {
        const typeLabels = {
            urgent: '急字令',
            gather: '聚字令',
            reward: '赏字令'
        };

        return `
            <div class="token-card" onclick="showTokenDetail(${token.id})">
                <div class="token-header">
                    <div class="token-avatar">${token.userAvatar}</div>
                    <div class="token-info">
                        <div class="token-name">${token.userName}</div>
                        <div class="token-title-level">${token.userTitle}</div>
                    </div>
                    <div class="token-badge ${token.type}">${typeLabels[token.type]}</div>
                </div>
                <div class="token-content">${token.content}</div>
                <div class="token-footer">
                    <span>📍 ${token.distance}</span>
                    <span>⏱️ ${token.time}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 查看江湖令详情
function showTokenDetail(tokenId) {
    const token = mockTokens.find(t => t.id === tokenId);
    if (!token) return;

    const typeLabels = {
        urgent: '急字令',
        gather: '聚字令',
        reward: '赏字令'
    };

    const detailContainer = document.getElementById('detail-content');
    detailContainer.innerHTML = `
        <div class="detail-header">
            <div class="detail-user">
                <div class="detail-avatar">${token.userAvatar}</div>
                <div class="detail-user-info">
                    <div class="detail-name">${token.userName}</div>
                    <div class="detail-title">${token.userTitle}</div>
                </div>
            </div>
        </div>
        <div class="token-badge ${token.type}" style="margin-bottom: 16px;">${typeLabels[token.type]}</div>
        <div class="detail-content">${token.content}</div>
        <div class="detail-info">
            <div>📍 距离：${token.distance}</div>
            <div>⏱️ 时间：${token.time}</div>
        </div>
        <div class="detail-actions">
            <button class="btn btn-primary" onclick="acceptToken(${token.id})">揭榜</button>
            <button class="btn" style="background: rgba(255,255,255,0.1);" onclick="showPage('home')">返回</button>
        </div>
    `;

    showPage('detail');
}

// 选择江湖令类型
function selectType(type) {
    selectedType = type;
    document.querySelectorAll('.type-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector('.type-item[data-type="' + type + '"]').classList.add('selected');
}

// 发布江湖令
function publishToken() {
    if (!currentUser.canPublish) {
        alert('6小时内不能再发江湖令');
        return;
    }

    const content = document.getElementById('token-content').value.trim();
    if (!content) {
        alert('请填写江湖令内容');
        return;
    }

    if (content.length < 10) {
        alert('江湖令内容至少10个字');
        return;
    }

    const newToken = {
        id: mockTokens.length + 1,
        type: selectedType,
        content: content,
        userName: currentUser.name,
        userTitle: currentUser.title,
        userAvatar: '🗡️',
        distance: '0米',
        time: '刚刚',
        acceptor: null,
        status: 'waiting'
    };

    mockTokens.unshift(newToken);
    currentUser.published++;

    // 添加历史记录
    currentUser.history.unshift({
        type: 'published',
        tokenId: newToken.id,
        content: content,
        tokenType: selectedType,
        time: new Date().toLocaleString()
    });

    // 清空表单
    document.getElementById('token-content').value = '';

    alert('江湖令发布成功！3-4小时内有人接令，自动消失');

    showPage('home');
}

// 揭榜（接令）
function acceptToken(tokenId) {
    if (!currentUser.canAccept) {
        alert('6小时内不能再接令');
        return;
    }

    const token = mockTokens.find(t => t.id === tokenId);
    if (!token) return;

    if (token.acceptor) {
        alert('该江湖令已有人揭榜');
        return;
    }

    token.acceptor = currentUser.name;
    token.status = 'accepted';
    currentUser.helped++;

    // 添加历史记录
    currentUser.history.unshift({
        type: 'accepted',
        tokenId: token.id,
        content: token.content,
        tokenType: token.type,
        userName: token.userName,
        time: new Date().toLocaleString()
    });

    // 初始化聊天
    currentChatTokenId = tokenId;
    chatMessages[tokenId] = [
        { sender: 'system', content: '江湖令已揭榜，双方可以开始沟通' }
    ];

    // 进入聊天
    showChat(tokenId);
}

// 显示聊天
function showChat(tokenId) {
    const token = mockTokens.find(t => t.id === tokenId);
    if (!token) return;

    document.getElementById('chat-title').textContent = token.userName;
    renderChatMessages(tokenId);
    showPage('chat');
}

// 渲染聊天消息
function renderChatMessages(tokenId) {
    const messages = chatMessages[tokenId] || [];
    const container = document.getElementById('chat-messages');

    container.innerHTML = messages.map(msg => {
        if (msg.sender === 'system') {
            return `<div class="chat-message"><div class="chat-bubble" style="background: rgba(255,255,255,0.1); text-align: center;">${msg.content}</div></div>`;
        }
        if (msg.sender === 'self') {
            return `<div class="chat-message self"><div class="chat-avatar">🗡️</div><div class="chat-bubble">${msg.content}</div></div>`;
        }
        return `<div class="chat-message"><div class="chat-avatar">${getUserAvatar(tokenId)}</div><div class="chat-bubble">${msg.content}</div></div>`;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function getUserAvatar(tokenId) {
    const token = mockTokens.find(t => t.id === tokenId);
    return token ? token.userAvatar : '👤';
}

// 发送消息
function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();

    if (!content || !currentChatTokenId) return;

    if (!chatMessages[currentChatTokenId]) {
        chatMessages[currentChatTokenId] = [];
    }

    chatMessages[currentChatTokenId].push({
        sender: 'self',
        content: content,
        time: new Date().toLocaleString()
    });

    input.value = '';
    renderChatMessages(currentChatTokenId);

    // 模拟对方回复
    setTimeout(() => {
        const replies = [
            '好的，我在路上了',
            '没问题，马上到',
            '稍等，我看看位置',
            '好的，我们联系'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        chatMessages[currentChatTokenId].push({
            sender: 'other',
            content: randomReply,
            time: new Date().toLocaleString()
        });

        renderChatMessages(currentChatTokenId);
    }, 1500);
}

// 从聊天返回
function goBackFromChat() {
    const token = mockTokens.find(t => t.id === currentChatTokenId);
    if (token && token.status === 'accepted') {
        if (confirm('任务完成了吗？')) {
            showRatePage(token);
        } else {
            showPage('home');
        }
    } else {
        showPage('home');
    }
}

// 显示评价页面
function showRatePage(token) {
    currentRateUserId = token.userName;
    const rateUserInfo = document.getElementById('rate-user-info');
    rateUserInfo.innerHTML = `
        <div class="rate-avatar">${token.userAvatar}</div>
        <div class="rate-name">${token.userName}</div>
        <div class="rate-title">${token.userTitle}</div>
    `;

    // 重置星级
    document.querySelectorAll('.rate-stars .star').forEach(star => {
        star.classList.remove('active');
    });
    currentRating = 0;

    document.getElementById('rate-comment').value = '';
    showPage('rate');
}

// 星级评价
document.querySelectorAll('.rate-stars .star').forEach(star => {
    star.addEventListener('click', function() {
        currentRating = parseInt(this.dataset.rating);
        document.querySelectorAll('.rate-stars .star').forEach(s => {
            if (parseInt(s.dataset.rating) <= currentRating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    });
});

// 提交评价
function submitRate() {
    if (currentRating === 0) {
        alert('请选择星级');
        return;
    }

    const comment = document.getElementById('rate-comment').value.trim();

    // 更新用户评价
    currentUser.ratedCount++;
    currentUser.rating = ((currentUser.rating * (currentUser.ratedCount - 1)) + currentRating) / currentUser.ratedCount;

    // 检查是否获得勋章
    checkBadges();

    // 更新头衔
    updateTitle();

    alert('评价提交成功！');

    showPage('home');
}

// 检查勋章
function checkBadges() {
    // 及时雨勋章：急字令响应
    const urgentAccepted = currentUser.history.filter(h =>
        h.type === 'accepted' && h.tokenType === 'urgent'
    ).length;

    if (urgentAccepted >= 1 && !currentUser.badges.find(b => b.id === 'timelyRain')) {
        currentUser.badges.push({
            id: 'timelyRain',
            ...badgeDefinitions.timelyRain
        });
        alert('恭喜获得【及时雨】勋章！');
    }

    // 深藏功名勋章：好评率100%
    if (currentUser.rating === 5 && currentUser.ratedCount >= 3 &&
        !currentUser.badges.find(b => b.id === 'hiddenMerit')) {
        currentUser.badges.push({
            id: 'hiddenMerit',
            ...badgeDefinitions.hiddenMerit
        });
        alert('恭喜获得【深藏功名】勋章！');
    }
}

// 更新头衔
function updateTitle() {
    const totalActions = currentUser.helped + currentUser.published;
    let newTitle = currentUser.title;

    for (let i = titleLevels.length - 1; i >= 0; i--) {
        if (totalActions >= titleLevels[i].threshold) {
            newTitle = titleLevels[i].name;
            break;
        }
    }

    if (newTitle !== currentUser.title) {
        currentUser.title = newTitle;
        alert('恭喜晋升为【' + newTitle + '】！');
    }
}

// 更新个人资料页
function updateProfile() {
    // 更新用户名
    document.getElementById('user-name').textContent = currentUser.name;

    // 更新头像
    const avatarDisplay = document.getElementById('user-avatar-display');
    if (currentUser.avatarUrl) {
        avatarDisplay.innerHTML = `<img src="${currentUser.avatarUrl}" alt="头像" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        avatarDisplay.textContent = currentUser.avatar;
    }

    // 更新头衔和统计
    document.getElementById('user-title').textContent = currentUser.title;
    document.getElementById('stat-helped').textContent = currentUser.helped;
    document.getElementById('stat-published').textContent = currentUser.published;
    document.getElementById('stat-rating').textContent = currentUser.rating.toFixed(1);

    // 勋章
    const badgesContainer = document.getElementById('my-badges');
    if (currentUser.badges.length === 0) {
        badgesContainer.innerHTML = '<div class="badge-empty">暂无勋章</div>';
    } else {
        badgesContainer.innerHTML = currentUser.badges.map(badge => `
            <div class="badge">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            </div>
        `).join('');
    }

    // 历史记录
    const historyContainer = document.getElementById('history-list');
    if (currentUser.history.length === 0) {
        historyContainer.innerHTML = '<div class="history-empty">暂无记录</div>';
    } else {
        historyContainer.innerHTML = currentUser.history.map(item => {
            const typeLabels = {
                urgent: '急字令',
                gather: '聚字令',
                reward: '赏字令'
            };

            const icons = {
                published: '📜',
                accepted: '⚔️'
            };

            return `
                <div class="history-item">
                    <div class="history-icon">${icons[item.type]}</div>
                    <div class="history-info">
                        <div class="history-title">${item.type === 'published' ? '发布江湖令' : '揭榜助人'}</div>
                        <div class="history-type">${typeLabels[item.tokenType]}</div>
                    </div>
                    <div class="history-date">${item.time}</div>
                </div>
            `;
        }).join('');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 页面加载完成后的初始化
    console.log('江湖令原型已加载');

    // 初始化令牌标签点击事件
    initTokenTabs();

    // 初始化登录页动画
    initLoginPageAnimations();
});

// 初始化令牌标签点击事件
function initTokenTabs() {
    document.querySelectorAll('.token-item').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.token-item').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            currentFilterType = this.dataset.type;
            renderTokenList();
        });
    });
}

// 初始化登录页动画
function initLoginPageAnimations() {
    // 粒子效果
    createParticles();
}

// 创建粒子效果
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (5 + Math.random() * 5) + 's';
        container.appendChild(particle);
    }
}

// 头像上传处理
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.match('image.*')) {
        alert('请上传图片文件');
        return;
    }

    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentUser.avatarUrl = e.target.result;
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.innerHTML = `<img src="${e.target.result}" alt="头像" style="width: 100%; height: 100%; object-fit: cover;">';
        }
        alert('头像上传成功！');
    };
    reader.readAsDataURL(file);
}

    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentUser.avatarUrl = e.target.result;
        document.getElementById('user-avatar-display').innerHTML = `<img src="${e.target.result}" alt="头像" style="width: 100%; height: 100%; border-radius: 4px;">`;
        alert('头像上传成功！');
    };
    reader.readAsDataURL(file);
}

// 编辑用户名
function editUserName() {
    const currentName = currentUser.name;
    const newName = prompt('请输入你的江湖名：', currentName);

    if (newName && newName.trim() !== '') {
        if (newName.length > 12) {
            alert('江湖名不能超过12个字');
            return;
        }
        currentUser.name = newName.trim();
        document.getElementById('user-name').textContent = currentUser.name;
    }
}


