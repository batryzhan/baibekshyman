// Конфигурация Gemini API
const API_KEY = "AIzaSyDyYAIGo-onOzzQ7n7-dSNnUI1gw5azCNc";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

class AITeacher {
    constructor() {
        this.chatHistory = JSON.parse(localStorage.getItem('chat_history')) || [];
        this.init();
    }

    init() {
        this.loadChatHistory();
        this.setupEventListeners();
        
        // Показываем приветственное сообщение, если чат пустой
        if (this.chatHistory.length === 0) {
            this.showWelcomeMessage();
        }
    }

    setupEventListeners() {
        const input = document.getElementById('question-input');
        const sendBtn = document.getElementById('send-btn');

        // Enter для отправки (Shift+Enter для новой строки)
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendQuestion();
            }
        });

        // Авто-высота textarea
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Фокус на input при загрузке
        input.focus();
    }

    async sendQuestion() {
        const input = document.getElementById('question-input');
        const question = input.value.trim();

        if (!question) {
            input.focus();
            return;
        }

        // Показываем вопрос пользователя
        this.showMessage('user', question);
        input.value = '';
        input.style.height = 'auto';
        input.focus();

        // Показываем индикатор загрузки
        this.setLoading(true);

        try {
            const response = await this.getAIResponse(question);
            this.showMessage('bot', response);
            this.saveToHistory(question, response);
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('bot', '❌ Произошла ошибка при получении ответа. Пожалуйста, попробуйте еще раз.');
        } finally {
            this.setLoading(false);
        }
    }

    async getAIResponse(question) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: `Ты - опытный и терпеливый учитель с многолетним стажем. Твоя задача - помогать ученикам понимать сложные темы.
                    
Вот твои основные принципы:
1. Объясняй понятно и доступно, на уровне ученика
2. Используй аналогии и примеры из жизни
3. Разбивай сложные темы на простые шаги
4. Будь доброжелательным и поддерживающим
5. Если тема сложная, предложи дополнительные ресурсы для изучения

Вопрос ученика: ${question}

Пожалуйста, дай подробный и полезный ответ:`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Ошибка API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Неверный формат ответа от API');
        }

        return data.candidates[0].content.parts[0].text;
    }

    showMessage(sender, text) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Форматируем текст (сохраняем переносы строк)
        const formattedText = text.replace(/\n/g, '<br>');
        contentDiv.innerHTML = formattedText;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Прокрутка вниз
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showWelcomeMessage() {
        const welcomeText = `Привет! Я твой ИИ-учитель 👨‍🏫

Я здесь, чтобы помочь тебе с любыми учебными вопросами. Можешь спросить меня о:
• Математике и физике
• Истории и литературе
• Программировании
• Естественных науках
• И о многом другом!

Не стесняйся задавать вопросы - я объясню всё понятным языком. 😊`;
        
        this.showMessage('bot', welcomeText);
    }

    setLoading(isLoading) {
        const loading = document.getElementById('loading');
        const sendBtn = document.getElementById('send-btn');
        
        if (isLoading) {
            loading.style.display = 'flex';
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span>Обработка...</span>';
        } else {
            loading.style.display = 'none';
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>Спросить</span><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
        }
    }

    saveToHistory(question, answer) {
        this.chatHistory.push({
            question,
            answer,
            timestamp: new Date().toISOString()
        });
        
        // Сохраняем только последние 50 сообщений
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(-50);
        }
        
        localStorage.setItem('chat_history', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        this.chatHistory.forEach(item => {
            this.showMessage('user', item.question);
            this.showMessage('bot', item.answer);
        });
    }

    clearChat() {
        if (confirm('Вы уверены, что хотите очистить всю историю чата?')) {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';
            
            this.chatHistory = [];
            localStorage.removeItem('chat_history');
            
            // Показываем приветственное сообщение
            this.showWelcomeMessage();
        }
    }
}

// Глобальные функции для кнопок
function sendQuestion() {
    aiTeacher.sendQuestion();
}

function clearChat() {
    aiTeacher.clearChat();
}

function insertExample(question) {
    document.getElementById('question-input').value = question;
    document.getElementById('question-input').focus();
}

// Инициализация при загрузке страницы
let aiTeacher;

document.addEventListener('DOMContentLoaded', () => {
    aiTeacher = new AITeacher();
});
