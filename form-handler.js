// Конфигурация форм
const FORM_CONFIG = {
    formspreeId: 'YOUR_FORMSPREE_ID', // Заменить на ваш ID
    telegramBotToken: 'YOUR_BOT_TOKEN', // Опционально для Telegram
    chatId: 'YOUR_CHAT_ID' // Опционально для Telegram
};

// Отправка формы через Formspree
async function submitForm(formData, formType = 'consultation') {
    const submitBtn = document.querySelector(`#${formType}-form button[type="submit"]`);
    const originalText = submitBtn.innerHTML;
    
    // Показываем индикатор загрузки
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    try {
        // Отправляем в Formspree
        const response = await fetch(`https://formspree.io/f/${FORM_CONFIG.formspreeId}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            // Дублируем в Telegram (опционально)
            if (FORM_CONFIG.telegramBotToken) {
                await sendToTelegram(formData);
            }
            
            showSuccessMessage(formType);
            return true;
        } else {
            throw new Error('Ошибка отправки формы');
        }
    } catch (error) {
        showErrorMessage();
        console.error('Form error:', error);
        return false;
    } finally {
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Отправка в Telegram (дополнительно)
async function sendToTelegram(formData) {
    const data = new URLSearchParams(formData);
    const message = `Новая заявка с сайта:\n${Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
    
    return fetch(`https://api.telegram.org/bot${FORM_CONFIG.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: FORM_CONFIG.chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
}

// Показать сообщение об успехе
function showSuccessMessage(formType) {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Автозакрытие через 5 секунд
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 5000);
    } else {
        alert('Спасибо! Мы свяжемся с вами в течение 15 минут.');
    }
    
    // Очистка формы
    document.querySelectorAll('form').forEach(form => form.reset());
}

// Показать сообщение об ошибке
function showErrorMessage() {
    const errorModal = document.getElementById('error-modal') || 
        (() => {
            const modal = document.createElement('div');
            modal.className = 'modal modal--error';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Ошибка отправки</h3>
                    <p>Попробуйте еще раз или свяжитесь с нами по телефону.</p>
                    <button class="btn btn--primary modal-close">OK</button>
                </div>
            `;
            document.body.appendChild(modal);
            return modal;
        })();
    
    errorModal.style.display = 'flex';
}

// Инициализация всех форм на странице
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const formType = this.id.replace('-form', '') || 'default';
            
            // Добавляем дополнительную информацию
            formData.append('page_url', window.location.href);
            formData.append('timestamp', new Date().toISOString());
            
            await submitForm(formData, formType);
        });
    });
});
