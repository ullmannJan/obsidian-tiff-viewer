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
        const tiffPngRegex = /!\[\[(.*?\.tif{1,2}\.png)\]\]/gi;
        let match;
        let matches: string[] = [];
        let lineIndices: number[] = [];
        let editorValue = this.editor.getValue();
        while ((match = tiffPngRegex.exec(editorValue)) !== null) {
            matches.push(match[0]);
            let lineNumber = (editorValue.substring(0, match.index).match(/\n/g) || []).length;
            lineIndices.push(lineNumber);
        }

        if (matches && matches.length > 0) {
            // The editor contains a .tiff file
            // Perform your operation here

            console.log('found .tiff.png files', matches, "in lines", lineIndices);
            const conversionPromises = matches.map(async (match, index) => {
                const tiffPngFile = match.replace('![[', '').replace(']]', '');
                const tiffPngFilePath = normalizePath(tiffPngFile);
                const line = lineIndices[index]; 
                
                return await new Promise<void>((resolve, reject) => {
                    this.deleteTiffPngFileInEditor(tiffPngFilePath, line)
                        .then(() => {
                            console.log('Successfully converted and deleted', tiffPngFile);
                            resolve();
                        })
                        .catch(err => {
                            console.error(`Failed to convert and delete ${tiffPngFile}`);
                            const error = new Error(`\n\tFailed to convert ${tiffPngFile}:\n\t -> ${err.message}`);
                            reject(error);
                        })
                        .finally(() => {
                            const progress = Math.ceil(this.getCurrentProgress(this.progressbar)+100/matches.length);
                            this.updateProgressBar(this.progressbar, progress);
                            resolve();
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
           } else {
                this.progressbar.setAttribute('value', '100');
                this.addErrorBox(this.contentEl, "No .tif(f).png files found in editor");
           }
        }

    private async deleteTiffPngFileInEditor(filePath: string, line: number): Promise<void> {

        // filePath is something/like/this/file.tif.png
        // rename file in editor
        // remove .png from file name
        const lineContent = this.editor.getLine(line);
        this.editor.setLine(line, lineContent.replace(filePath+"]]", filePath.slice(0,-4)+"]]"));
        
        // delete file
        await this.deleteFile(filePath);
        
    } 
}
