export class SimpleChatView extends EventTarget {
    constructor() {
        super();
        this.dom = {};
        this.debug = false;
    }

    render(containerSelector) {
        const host = document.querySelector(containerSelector);

        host.innerHTML = `
            <div id="chat-box">
                <div id="chat-box-header-container">
                    <h1 id="chat-box-title">Chat Assistant</h1>
                    <h3 id="chat-box-desc">MVC Added</h3>
                </div>
                <ul id="message-container"></ul>
                <div id="user-input-container">
                    <textarea id="user-input" placeholder="Type a message..."></textarea>
                    <button id="send-btn" type="submit">Send</button>
                </div>
                <div id="chat-box-footer">
                    <div id="chat-box-functions-container">
                        <button id="export-chat-btn">⬆️ Export Chat</button>
                        <button id="import-chat-btn">⬇️ Import Chat</button>
                        <button id="clear-chat-btn">🔥 Clear Chat</button>
                    </div>
                    <p id="chat-box-footer-text">
                        <span id="name_date_class";</span>Gable Krich 2025 - Comp 305 Lab 7
                    </p>
                </div>
            </div>
        `;

        this.init();
    }

    init() {
        this.mapDom();
        this.updateSendButtonState();
        this.bindEvents();
    }

    mapDom() {
        this.dom = {
            root: document.getElementById("chat-box"),
            messageContainer: document.getElementById("message-container"),
            userInput: document.getElementById("user-input"),
            sendButton: document.getElementById("send-btn"),
            exportChatButton: document.getElementById("export-chat-btn"),
            importChatButton: document.getElementById("import-chat-btn"),
            clearChatButton: document.getElementById("clear-chat-btn")
        };
    }

    bindEvents() {
        const {
            sendButton,
            userInput,
            exportChatButton,
            importChatButton,
            clearChatButton,
            messageContainer
        } = this.dom;

        sendButton.addEventListener("click", () => this.handleSendClick());
        exportChatButton.addEventListener("click", () => this.dispatchExportChat());
        importChatButton.addEventListener("click", () => this.openFileImportDialog());

        if (clearChatButton) {
            clearChatButton.addEventListener("click", () => this.handleClearClick());
        }

        userInput.addEventListener("input", () => this.updateSendButtonState());
        userInput.addEventListener("keypress", (evt) => this.onInputKeypress(evt));

        messageContainer.addEventListener("click", (evt) => this.onMessageContainerClick(evt));
    }

    handleSendClick() {
        const message = this.processUserMessage(this.dom.userInput.value);

        if (!message) {
            alert("Please enter a valid message.");
            return;
        }

        this.dispatchSendMessage(message);
        this.dom.userInput.value = "";
        this.updateSendButtonState();
    }

    handleClearClick() {
        if (confirm("Are you sure you want to clear all chat messages? This cannot be undone.")) {
            this.dispatchClearChat();
        }
    }

    onInputKeypress(evt) {
        if (evt.key === "Enter" && !evt.shiftKey) {
            evt.preventDefault();
            this.dom.sendButton.click();
        }
    }

    onMessageContainerClick(evt) {
        const actionBtn = evt.target.closest(".message-action-btn");

        if (!actionBtn) {
            return;
        }

        const messageId = actionBtn.getAttribute("data-message-id");
        const action = actionBtn.getAttribute("data-action");

        if (action === "delete") {
            if (confirm("Are you sure you want to delete this message?")) {
                this.dispatchDeleteMessage(messageId);
            }
            return;
        }

        if (action === "edit") {
            this.startEditingMessage(messageId);
        }
    }

    startEditingMessage(messageId) {
        const target = this.dom.messageContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!target) return;

        const textNode = target.querySelector(".message-text");
        if (!textNode) return;

        const currentText = textNode.textContent;
        const editor = document.createElement("textarea");
        editor.value = currentText;
        editor.classList.add("edit-textarea");
        editor.rows = Math.max(2, Math.ceil(currentText.length / 40));

        const controls = document.createElement("div");
        controls.classList.add("edit-controls");

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "✓";
        saveBtn.classList.add("edit-save-btn");
        saveBtn.title = "Save changes";

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "✗";
        cancelBtn.classList.add("edit-cancel-btn");
        cancelBtn.title = "Cancel editing";

        controls.append(saveBtn, cancelBtn);

        textNode.style.display = "none";
        textNode.parentNode.append(editor, controls);
        editor.focus();
        editor.select();

        const saveEdit = () => {
            const updated = editor.value.trim();
            if (!updated) {
                alert("Message cannot be empty");
                return;
            }

            if (updated !== currentText) {
                this.dispatchEditMessage(messageId, updated);
            }

            this.cancelEdit(target);
        };

        const cancelEdit = () => this.cancelEdit(target);

        saveBtn.addEventListener("click", saveEdit);
        cancelBtn.addEventListener("click", cancelEdit);
        editor.addEventListener("keydown", (evt) => {
            if (evt.key === "Enter" && !evt.shiftKey) {
                evt.preventDefault();
                saveEdit();
            }

            if (evt.key === "Escape") {
                evt.preventDefault();
                cancelEdit();
            }
        });
    }

    cancelEdit(messageElement) {
        const editor = messageElement.querySelector(".edit-textarea");
        const controls = messageElement.querySelector(".edit-controls");
        const textNode = messageElement.querySelector(".message-text");

        if (editor) editor.remove();
        if (controls) controls.remove();
        if (textNode) textNode.style.display = "";
    }

    openFileImportDialog() {
        const picker = document.createElement("input");
        picker.type = "file";
        picker.accept = ".txt,.json";
        picker.style.display = "none";

        picker.addEventListener("change", (evt) => {
            const file = evt.target.files?.[0];
            if (file) {
                this.readImportFile(file);
            }
        });

        document.body.appendChild(picker);
        picker.click();
        document.body.removeChild(picker);
    }

    readImportFile(file) {
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const payload = JSON.parse(evt.target.result);
                this.dispatchImportChat(payload);
            } catch (err) {
                alert("Error reading file: Invalid JSON format");
                console.error("Import error:", err);
            }
        };

        reader.readAsText(file);
    }

    appendMessageToChat(messageObj, isUser) {
        const item = document.createElement("li");
        item.dataset.messageId = messageObj.id;
        item.classList.add(isUser ? "user-message" : "bot-output");

        const content = document.createElement("div");
        content.classList.add("message-content");

        const textNode = document.createElement("span");
        textNode.classList.add("message-text");
        textNode.textContent = messageObj.message;

        content.appendChild(textNode);
        item.appendChild(content);

        if (isUser) {
            item.classList.add("user-message-interactive");

            const actions = document.createElement("div");
            actions.classList.add("message-actions");

            const editBtn = document.createElement("button");
            editBtn.classList.add("message-action-btn");
            editBtn.dataset.action = "edit";
            editBtn.dataset.messageId = messageObj.id;
            editBtn.title = "Edit message";
            editBtn.textContent = "✍️"; //icon for edit message

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("message-action-btn");
            deleteBtn.dataset.action = "delete";
            deleteBtn.dataset.messageId = messageObj.id;
            deleteBtn.title = "Delete message";
            deleteBtn.textContent = "🗑"; //icon for delete message

            actions.append(editBtn, deleteBtn);
            item.appendChild(actions);
        }

        this.dom.messageContainer.appendChild(item);
        this.dom.messageContainer.scrollTop = this.dom.messageContainer.scrollHeight;
    }

    clearChatMessages() {
        this.dom.messageContainer.querySelectorAll("li").forEach((node) => node.remove());
    }

    displayImportedMessages(messages) {
        this.clearChatMessages();
        messages.forEach((message) => this.appendMessageToChat(message, message.isUser));
    }

    processUserMessage(raw) {
        const cleaned = raw.trim();
        return cleaned === "" ? false : cleaned;
    }

    removeMessageFromChat(messageId) {
        const target = this.dom.messageContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!target) return;

        let current = target;
        while (current) {
            const next = current.nextElementSibling;
            current.remove();
            current = next;
        }
    }

    updateMessageInChat(messageId, newText) {
        const target = this.dom.messageContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!target) return;

        const textNode = target.querySelector(".message-text");
        if (!textNode) return;

        textNode.textContent = newText;

        const isUserMessage = target.classList.contains("user-message");
        const indicator = target.querySelector(".edited-indicator");

        if (isUserMessage) {
            let edited = indicator;
            if (!edited) {
                edited = document.createElement("span");
                edited.classList.add("edited-indicator");
                textNode.appendChild(edited);
            }
            edited.textContent = " (edited)";
        } else if (indicator) {
            indicator.remove();
        }
    }

    updateSendButtonState() {
        const { userInput, sendButton } = this.dom;
        const hasText = userInput.value.trim() !== "";

        if (hasText) {
            sendButton.classList.add("hasContent");
            return;
        }

        sendButton.classList.remove("hasContent");
    }

    dispatchSendMessage(message) {
        this.dispatchEvent(new CustomEvent("sendMessage", {
            detail: { message, isUser: true }
        }));
    }

    dispatchClearChat() {
        this.dispatchEvent(new CustomEvent("clearChat", { detail: {} }));
    }

    dispatchDeleteMessage(messageId) {
        this.dispatchEvent(new CustomEvent("deleteMessage", {
            detail: { messageId }
        }));
    }

    dispatchEditMessage(messageId, newText) {
        this.dispatchEvent(new CustomEvent("editMessage", {
            detail: { messageId, newText }
        }));
    }

    dispatchExportChat() {
        this.dispatchEvent(new CustomEvent("exportChat", { detail: {} }));
    }

    dispatchImportChat(importedData) {
        this.dispatchEvent(new CustomEvent("importChat", {
            detail: { importedData }
        }));
    }
}
