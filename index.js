/**
 * Dify2MD - Dify Chat History to Markdown Converter
 * JavaScript functions for converting JSON chat data to Markdown format
 */

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Hide success message
    hideMessage();
    
    // Show error message
    errorDiv.textContent = message;
    errorDiv.className = 'error-message'; // Reset any fade-out class
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        fadeOutMessage(errorDiv);
    }, 2000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');
    
    // Hide error message
    hideMessage();
    
    // Show success message
    successDiv.textContent = message;
    successDiv.className = 'success-message'; // Reset any fade-out class
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        fadeOutMessage(successDiv);
    }, 2000);
}

function fadeOutMessage(messageDiv) {
    messageDiv.classList.add('fade-out');
    
    // Listen for animation end to hide the element
    const handleAnimationEnd = () => {
        messageDiv.style.display = 'none';
        messageDiv.classList.remove('fade-out');
        messageDiv.removeEventListener('animationend', handleAnimationEnd);
    };
    
    messageDiv.addEventListener('animationend', handleAnimationEnd);
    
    // Fallback in case animation event doesn't fire
    setTimeout(() => {
        if (messageDiv.classList.contains('fade-out')) {
            messageDiv.style.display = 'none';
            messageDiv.classList.remove('fade-out');
        }
    }, 350);
}

function hideMessage() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    errorDiv.classList.remove('fade-out');
    successDiv.classList.remove('fade-out');
}

function buildMessageMap(messages) {
    const messageMap = {};
    messages.forEach(msg => {
        messageMap[msg.id] = msg;
    });
    return messageMap;
}

function findConversationChain(messages, startMessageId = null) {
    if (!messages || messages.length === 0) {
        return [];
    }

    const messageMap = buildMessageMap(messages);
    
    // If a specific message ID is provided, use it as the starting point
    let startMessage;
    if (startMessageId && startMessageId.trim()) {
        startMessage = messageMap[startMessageId.trim()];
        if (!startMessage) {
            throw new Error(`Message with ID "${startMessageId}" not found`);
        }
    } else {
        // Use the last message as default
        startMessage = messages[messages.length - 1];
    }
    
    const conversation = [];
    let currentMessage = startMessage;

    while (currentMessage) {
        conversation.push(currentMessage);
        const parentId = currentMessage.parent_message_id;
        if (parentId && messageMap[parentId]) {
            currentMessage = messageMap[parentId];
        } else {
            currentMessage = null;
        }
    }

    return conversation.reverse();
}

function formatMessageToMarkdown(message, userLabel, aiLabel) {
    const formattedParts = [];

    if (message.query && message.query.trim()) {
        const queryContent = message.query.trim();
        formattedParts.push(`**${userLabel}:**\n\n${queryContent}`);
    }

    if (message.answer && message.answer.trim()) {
        const answerContent = message.answer.trim();
        formattedParts.push(`**${aiLabel}:**\n\n${answerContent}`);
    }

    return formattedParts.join('\n\n');
}

function convertToMarkdown() {
    const jsonInput = document.getElementById('jsonInput').value.trim();
    const markdownOutput = document.getElementById('markdownOutput');
    const copyBtn = document.getElementById('copyBtn');

    if (!jsonInput) {
        showError('Please enter JSON data');
        return;
    }

    try {
        const chatData = JSON.parse(jsonInput);
        
        if (!chatData.data || !Array.isArray(chatData.data)) {
            showError('JSON format error: missing data array');
            return;
        }

        const messages = chatData.data;
        if (messages.length === 0) {
            showError('No chat messages found');
            return;
        }

        // Get custom names and starting message ID
        const userNameInput = document.getElementById('userName');
        const aiNameInput = document.getElementById('aiName');
        const messageIdInput = document.getElementById('messageId');
        const userLabel = userNameInput.value.trim() || 'User';
        const aiLabel = aiNameInput.value.trim() || 'AI';
        const startMessageId = messageIdInput.value.trim();

        // Convert to markdown
        const conversation = findConversationChain(messages, startMessageId);
        
        if (conversation.length === 0) {
            showError('Unable to build valid conversation chain');
            return;
        }

        const markdownParts = ['# Chat History\n'];

        conversation.forEach(message => {
            const formattedMessage = formatMessageToMarkdown(message, userLabel, aiLabel);
            if (formattedMessage) {
                markdownParts.push(formattedMessage);
            }
        });

        // Join without separators (no --- lines)
        const markdownContent = markdownParts.join('\n\n');
        
        // Convert markdown to HTML for display
        const htmlContent = markdownToHtml(markdownContent);
        markdownOutput.innerHTML = htmlContent;
        
        // Store the raw markdown for copying
        markdownOutput.dataset.markdown = markdownContent;
        
        copyBtn.style.display = 'block';
        showSuccess(`Successfully converted ${conversation.length} messages`);

    } catch (error) {
        showError('JSON parsing error: ' + error.message);
    }
}

function markdownToHtml(markdown) {
    return markdown
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
        .replace(/<p><\/p>/g, '');
}

function copyToClipboard() {
    const markdownOutput = document.getElementById('markdownOutput');
    const markdownContent = markdownOutput.dataset.markdown;
    
    if (!markdownContent) {
        showError('No content to copy');
        return;
    }

    navigator.clipboard.writeText(markdownContent).then(() => {
        showSuccess('Markdown content copied to clipboard');
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = markdownContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Markdown content copied to clipboard');
    });
}

function swapNames() {
    const userNameInput = document.getElementById('userName');
    const aiNameInput = document.getElementById('aiName');
    
    // Swap the values
    const temp = userNameInput.value;
    userNameInput.value = aiNameInput.value;
    aiNameInput.value = temp;
    
    // Clear previous output to indicate re-conversion is needed
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.style.display = 'none';
}

function clearMessageId() {
    const messageIdInput = document.getElementById('messageId');
    messageIdInput.value = '';
    
    // Clear previous output to indicate re-conversion is needed
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.style.display = 'none';
}

// Event listeners to be attached when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Allow Ctrl+Enter to trigger conversion
    document.getElementById('jsonInput').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            convertToMarkdown();
        }
    });

    // Clear outputs when input changes
    document.getElementById('jsonInput').addEventListener('input', function() {
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.style.display = 'none';
    });

    // Clear outputs when names change
    document.getElementById('userName').addEventListener('input', function() {
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.style.display = 'none';
    });

    document.getElementById('aiName').addEventListener('input', function() {
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.style.display = 'none';
    });

    // Clear outputs when message ID changes
    document.getElementById('messageId').addEventListener('input', function() {
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.style.display = 'none';
    });
});
