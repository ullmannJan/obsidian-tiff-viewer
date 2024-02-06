import { App, Modal } from 'obsidian';

export class ConfirmationModal extends Modal {
    title: string;
    question: string;
    yesButton: HTMLElement;
    noButton: HTMLElement;
    confirmed: boolean;
    callback: (confirmed: boolean) => void;

    constructor(app: App,
        title: string,
        question: string,
        callback: (confirmed: boolean) => void) {
        super(app);
        this.title = title;
        this.question = question;
        this.confirmed = false; // Initialize confirmed as false
        this.callback = callback;
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.question });

        const buttonGroup = contentEl.createEl('div', { attr: { 'role': 'radiogroup' } });

        this.yesButton = buttonGroup.createEl('button', { text: 'Yes', attr: { 'role': 'radio', 'aria-checked': 'true' } });
        this.yesButton.addEventListener('click', () => {
            // Handle yes click
            this.handleButtonClick('yes');
        });
        this.yesButton.style.marginRight = '10px'; // add some space between the buttons

        this.noButton = buttonGroup.createEl('button', { text: 'No', attr: { 'role': 'radio', 'aria-checked': 'false' } });
        this.noButton.addEventListener('click', () => {
            // Handle no click
            this.handleButtonClick('no');
        });

        // Add keyboard event listener
        this.modalEl.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Set initial focus to the yes button
        this.yesButton.focus();
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
        console.log('confirmed', this.confirmed);
    }

    handleKeyDown(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                this.noButton.focus();
                this.noButton.setAttribute('aria-checked', 'true');
                this.yesButton.setAttribute('aria-checked', 'false');
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                this.yesButton.focus();
                this.yesButton.setAttribute('aria-checked', 'true');
                this.noButton.setAttribute('aria-checked', 'false');
                break;
            case 'Enter':
                if (document.activeElement === this.yesButton) {
                    this.handleButtonClick('yes');
                } else if (document.activeElement === this.noButton) {
                    this.handleButtonClick('no');
                }
                break;
        }
    }

    handleButtonClick(button: 'yes' | 'no') {
        if (button === 'yes') {
            this.confirmed = true;
        }
        this.close();
        this.callback(this.confirmed);
    }
}