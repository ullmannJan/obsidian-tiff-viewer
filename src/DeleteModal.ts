import { App, Editor, normalizePath } from "obsidian";
import { SuperModal } from "./SuperModal";
import { normalize } from "path";

export class DeleteModal extends SuperModal {
    progressbar: HTMLProgressElement;

    constructor(app: App, editor: Editor) {
        super(app, editor);
    }

    onOpen() {
        this.contentEl.createEl("h1", { text: "Deleting tif(f).png" });

        // progress bar
        this.progressbar = this.createProgressBar(this.contentEl);
        
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            console.error('No active file');
            return;
        }
        
        this.deleteTiffPNGFilesInEditor()
    }

    private deleteTiffPNGFilesInEditor() {
        const tiffPngRegex = /!\[\[(.*\.tif{1,2}\.png)\]\]/gi;
        const matches = this.editor.getValue().match(tiffPngRegex);
        
        if (matches && matches.length > 0) {
            // The editor contains a .tiff file
            // Perform your operation here

            console.log('found .tiff.png files', matches);
            const conversionPromises = matches.map(match => {
                const tiffPngFile = match.replace('![[', '').replace(']]', '');
                const tiffPngFilePath = normalizePath(tiffPngFile);
                
                return new Promise<void>((resolve, reject) => {
                    this.deleteTiffPngFileInEditor(tiffPngFilePath)
                        .then(() => {
                            console.log('Successfully converted and deleted', tiffPngFile);
                            this.updateProgressBar(this.progressbar, this.getCurrentProgress(this.progressbar)+100/matches.length);
                            resolve();
                        })
                        .catch(err => {
                            console.error(`Failed to convert and delete ${tiffPngFile}`);
                            const error = new Error(`\n\tFailed to convert ${tiffPngFile}:\n\t -> ${err.message}`);
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
                        this.addSuccessBox(this.contentEl, "All conversions completed successfully");
                    } else {
                        console.error('Errors occurred during conversions:\n', errors.join('\n'));
                        this.addErrorBox(this.contentEl, "Errors occurred during conversion:\n\t" +  errors.join('\n\t'));
                    }
                });
           }
        }

    private async deleteTiffPngFileInEditor(filePath: string): Promise<void> {

        // rename file in editor
        const editorContent = this.editor.getValue();
        // remove .png from file name
        const newEditorContent = editorContent.replace(filePath, filePath.slice(0, -4));
        this.editor.setValue(newEditorContent);
        
        // delete file
        const file = await this.findFileInVault(filePath);
        if (file) {
            this.app.vault.delete(file);
        }
        
    } 
}
