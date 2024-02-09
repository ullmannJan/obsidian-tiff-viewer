import { App, Modal, Editor, TFile } from "obsidian";


export class SuperModal extends Modal {
    editor: Editor;

    constructor(app: App, editor: Editor) {
        super(app);
        this.editor = editor;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }   

    protected createProgressBar(contentEl: HTMLElement): HTMLProgressElement {

        const progressBar = contentEl.createEl('progress');
        progressBar.setAttribute('value', '0');
        progressBar.setAttribute('max', '100');
        progressBar.style.width = '100%';
        progressBar.style.display = 'block';
        progressBar.style.margin = '10px 0';
        return progressBar;
    }

    protected addErrorBox(contentEl: HTMLElement, errorMessage: string) {
        let errorBox = contentEl.createEl('div');
        errorBox.style.padding = '10px';
        errorBox.style.whiteSpace = 'pre-wrap';
        errorBox.style.marginTop = '10px';
        errorBox.style.backgroundColor = '#f8d7da';
        errorBox.style.color = '#721c24';
        errorBox.style.border = '1px solid #f5c6cb';
        errorBox.style.borderRadius = '4px';
        errorBox.textContent = errorMessage;
    }

    protected addSuccessBox(contentEl: HTMLElement, successMessage: string) {
        let successBox = contentEl.createEl('div');
        successBox.style.padding = '10px';
        successBox.style.marginTop = '10px';
        successBox.style.backgroundColor = '#d4edda';
        successBox.style.color = '#155724';
        successBox.style.border = '1px solid #c3e6cb';
        successBox.style.borderRadius = '4px';
        successBox.textContent = successMessage;
    }

    protected getCurrentProgress(progressBar: HTMLProgressElement): number {
        const progress = progressBar.getAttribute('value');
        if (progress) {
            return parseInt(progress);
        }
        return 0;
    }

    protected updateProgressBar(progressBar: HTMLProgressElement, progress: number) {
        //test if out of range
        if (progress < 0) {
            progress = 0;
        }
        if (progress > 100) {
            progress = 100;
        }
        progressBar.setAttribute('value', progress.toString());
    }

    protected findFileInVault(tiffFilePath: string): Promise<TFile>{

        return new Promise((resolve, reject) => {
            const fileInVault = this.app.vault.getAbstractFileByPath(tiffFilePath);
            if (fileInVault instanceof TFile) {
                console.log('tiffFilePath', fileInVault)
                resolve(fileInVault);
            } else {
                // if file not found in vault, search for it in all Files
                const allFilesInVault = this.app.vault.getFiles();
                
                for (const file of allFilesInVault) {
                    if (file.name === tiffFilePath) {
                        console.log('tiffFilePath found in search', file);
                        resolve(file);
                    }
                } 
                const err = new Error(`File not found in vault: ${tiffFilePath}`);
                reject(err)
            }
        });
    }

    protected async createFile(filePath: string, data: ArrayBuffer): Promise<void> {
        const { vault } = this.app;
        // get directory path of open note
        
        const { adapter } = vault;
        const fileExists = await adapter.exists(filePath);
        if (!fileExists) {
          return adapter.writeBinary(filePath, data);
        }
    }

    protected async deleteFile(filePath: string): Promise<void>{
            
        const file = await this.findFileInVault(filePath);
        if (file instanceof TFile) {
            this.app.vault.delete(file);
        }
    }
}
