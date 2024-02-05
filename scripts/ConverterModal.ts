import { App, Modal, Editor, TFile } from "obsidian";
const UTIF = require('utif');
const PNG = require('pngjs').PNG;


export class ConverterModal extends Modal {
    editor: Editor;

    constructor(app: App, editor: Editor) {
        super(app);
        this.editor = editor;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: "Converting Tiff to Png..." });

        // progress bar
        const progressBar = this.createProgressBar(contentEl);
        
        const editorContent = this.editor.getValue();
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            console.error('No active file');
            return;
        }
        
        const tiffFileRegex = /!\[\[(.*\.tif{1,2})\]\]/gi;
        const matches = editorContent.match(tiffFileRegex);
        
        if (matches && matches.length > 0) {
            // The editor contains a .tiff file
            // Perform your operation here

            console.log('found tiff files', matches);
            const conversionPromises = matches.map(match => {
                const tiffFile = match.replace('![[', '').replace(']]', '');
                const tiffFilePath = tiffFile.replace(/\\/g, '/');
                
                return new Promise<void>((resolve, reject) => {
                    this.convertTiffToPngWrapper(tiffFilePath)
                        .then(() => {
                            console.log('Successfully converted', tiffFile);
                            this.updateProgressBar(progressBar, this.getCurrentProgress(progressBar)+100/matches.length);
                            resolve();
                        })
                        .catch(err => {
                            console.error(`Failed to convert ${tiffFile}`);
                            const error = new Error(`\n\tFailed to convert ${tiffFile}:\n\t -> ${err.message}`);
                            reject(error);
                        });

                });
            });

            Promise.allSettled(conversionPromises)
                .then(results => {
                    let errors: Array<String> = [];
                    results.forEach((result, i) => {
                        if (result.status === 'rejected') {
                            errors.push(`Conversion ${i + 1}: ${result.reason.message}`);
                        }
                    });
                
                    if (errors.length === 0) {
                        console.log('All conversions completed successfully');
                        this.addSuccessBox(contentEl, "All conversions completed successfully");
                    } else {
                        console.error('Errors occurred during conversions:\n', errors.join('\n'));
                        this.addErrorBox(contentEl, "Errors occurred during conversion:\n\t" +  errors.join('\n\t'));
                    }
                })


        }

    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }   

    private createProgressBar(contentEl: HTMLElement): HTMLProgressElement {

        const progressBar = contentEl.createEl('progress');
        progressBar.setAttribute('value', '0');
        progressBar.setAttribute('max', '100');
        progressBar.style.width = '100%';
        progressBar.style.display = 'block';
        progressBar.style.margin = '10px 0';
        return progressBar;
    }

    private addErrorBox(contentEl: HTMLElement, errorMessage: string) {
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

    private addSuccessBox(contentEl: HTMLElement, successMessage: string) {
        let successBox = contentEl.createEl('div');
        successBox.style.padding = '10px';
        successBox.style.marginTop = '10px';
        successBox.style.backgroundColor = '#d4edda';
        successBox.style.color = '#155724';
        successBox.style.border = '1px solid #c3e6cb';
        successBox.style.borderRadius = '4px';
        successBox.textContent = successMessage;
    }

    private getCurrentProgress(progressBar: HTMLProgressElement): number {
        const progress = progressBar.getAttribute('value');
        if (progress) {
            return parseInt(progress);
        }
        return 0;
    }

    private updateProgressBar(progressBar: HTMLProgressElement, progress: number) {
        //test if out of range
        if (progress < 0) {
            progress = 0;
        }
        if (progress > 100) {
            progress = 100;
        }
        progressBar.setAttribute('value', progress.toString());
    }

    private async convertTiffToPngWrapper(tiffFilePath: string): Promise<void> {
    
        return new Promise<void>(async (resolve, reject) => {

            console.log(`Converting ${tiffFilePath}`);

            // find the file in the vault
            const fileInVault = this.app.vault.getAbstractFileByPath(tiffFilePath);
            let tiffFileInVault = null;
            if (fileInVault instanceof TFile) {
                tiffFileInVault = fileInVault;
                console.log('tiffFilePath', tiffFileInVault);
            } else {
                // if file not found in vault, search for it
                const allFilesInVault = this.app.vault.getFiles();
                
                let foundFile = false;
                for (const file of allFilesInVault) {
                    if (file.name === tiffFilePath) {
                        foundFile = true;
                        tiffFileInVault = file;
                        console.log('tiffFilePath found in search', tiffFileInVault);
                        break;
                    }
                }
                
                if (!foundFile) {
                    const err = new Error(`File not found in vault: ${tiffFilePath}`);
                    reject(err);
                }
            }
            // create png file
            if (tiffFileInVault) {
                let pngFilePath = tiffFileInVault.path + '.png';

                const { vault } = this.app;
                // get directory path of open note
                
                const { adapter } = vault;

                const tiffFileData = await adapter.readBinary(tiffFileInVault.path)
                // convert tiff to png
                const pngFileData = await this.convertTiffToPng(tiffFileData);
                
                // create png file
                this.createFile(pngFilePath, pngFileData);
                
                // rename in editor
                const editorContent = this.editor.getValue();
                const newEditorContent = editorContent.replace(tiffFilePath, pngFilePath);
                this.editor.setValue(newEditorContent);

            }
            // everything went well
            resolve();
        });
    }

    private async convertTiffToPng(tiffFileData: ArrayBuffer): Promise<ArrayBuffer> {
        // Convert the tiff file data to png

        
        let ifds = UTIF.decode(tiffFileData);
        UTIF.decodeImage(tiffFileData, ifds[0]);
        let rgba = UTIF.toRGBA8(ifds[0]); 

        // Create a new PNG image and set its data
        let png = new PNG({
            width: ifds[0].width,
            height: ifds[0].height,
            filterType: -1
        });

        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                let idx = (png.width * y + x) << 2;
                let i = (ifds[0].width * y + x) << 2;
                png.data[idx] = rgba[i];
                png.data[idx+1] = rgba[i+1];
                png.data[idx+2] = rgba[i+2];
                png.data[idx+3] = rgba[i+3];
            }
        }

        // Write the PNG image to a buffer
        let pngFileData = PNG.sync.write(png);

        // const pngFileData = tiffFileData; // For now, we'll just simulate a conversion by returning the same data
        return pngFileData;
    }


    private async createFile(filePath: string, data: ArrayBuffer): Promise<void> {
        const { vault } = this.app;
        // get directory path of open note
        
        const { adapter } = vault;
        const fileExists = await adapter.exists(filePath);
        if (!fileExists) {
          return adapter.writeBinary(filePath, data);
        }
    }
}
