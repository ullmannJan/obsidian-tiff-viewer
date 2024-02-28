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
        progressBar.classList.add('tiff-viewer-progress-bar');
        return progressBar;
    }

    protected addErrorBox(contentEl: HTMLElement, errorMessage: string) {
        let errorBox = contentEl.createEl('div');
        errorBox.classList.add('tiff-viewer-error-box');
        errorBox.textContent = errorMessage;
    }

    protected addSuccessBox(contentEl: HTMLElement, successMessage: string) {
        let successBox = contentEl.createEl('div');
        successBox.classList.add('tiff-viewer-success-box');
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
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile === null) {
              const err = new Error('No active file');
              reject(err);
            }
            else{

                const fileInVault = this.app.metadataCache.getFirstLinkpathDest(tiffFilePath, activeFile.path);
                
                if (fileInVault instanceof TFile) {
                    resolve(fileInVault);
                } else {
                    const err = new Error(`File not found in vault: ${tiffFilePath}`);
                    reject(err);
                }
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
