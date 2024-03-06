import { App, Editor, normalizePath } from "obsidian";
import { SuperModal } from "./SuperModal";
import { convertTiffToPng, replaceTiffLink } from "./Conversion";


export class ConverterModal extends SuperModal {
    progressbar: HTMLProgressElement;
    silent: boolean;

    /**
     * Creates an instance of the ConverterModal class.
     * @param app The Obsidian App instance.
     * @param editor The Obsidian Editor instance.
     * @param silent Optional. Indicates whether to show a modal when there are no tiff files. Default is false.
     */
    constructor(app: App, editor: Editor, silent: boolean = false) {

        super(app, editor);
        this.silent = silent;
    }

    onOpen() {
        this.contentEl.createEl("h1", { text: "Converting .tiff to .tiff.png" });

        // progress bar
        this.progressbar = this.createProgressBar(this.contentEl);

        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            console.error('No active file');
            return;
        }

        this.convertTiffFilesToPng()

    }

    private convertTiffFilesToPng() {

        const tiffFileRegex = /!\[\[(.*?\.tif{1,2})\]\]/gi;
        let match;
        let matches: string[] = [];
        let lineIndices: number[] = [];
        let editorValue = this.editor.getValue();
        while ((match = tiffFileRegex.exec(editorValue)) !== null) {
            matches.push(match[0]);
            let lineNumber = (editorValue.substring(0, match.index).match(/\n/g) || []).length;
            lineIndices.push(lineNumber);
        }

        if (matches && matches.length > 0) {
            // The editor contains a .tif(f) file

            // console.log('found tiff files', matches, "in lines", lineIndices);
            const conversionPromises = matches.map(async (match, index) => {
                const tiffFile = match.replace('![[', '').replace(']]', '');
                const tiffFilePath = normalizePath(tiffFile);
                const line = lineIndices[index];

                return await new Promise<void>((resolve, reject) => {
                    this.convertTiffToPngInEditor(tiffFilePath, line)
                        .then(() => {
                            // console.log('Successfully converted', tiffFile);
                            resolve();
                        })
                        .catch(err => {
                            // console.error(`Failed to convert ${tiffFile}, ${err.message}`);
                            const error = new Error(`Failed to convert ${tiffFile} :\n -> ${err.message}`);
                            reject(error);
                        })
                        .finally(() => {
                            const progress = Math.ceil(this.getCurrentProgress(this.progressbar) + 100 / matches.length);
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
                            errors.push(`\nConversion ${i + 1}: ${result.reason.message}`);
                        }
                    });

                    if (errors.length === 0) {
                        this.addSuccessBox(this.contentEl, "All conversions completed successfully");
                    } else {
                        // console.error('Errors occurred during conversions:\n', errors.join('\n'));
                        this.addErrorBox(this.contentEl, "Errors occurred during conversion:\n" + errors.join('\n'));
                    }
                });

        } else {
            if (this.silent) {
                this.close();
            }else{
                this.progressbar.setAttribute('value', '100');
                this.addErrorBox(this.contentEl, "No .tif(f).png files found in editor");
            }
        }
    }

    private async convertTiffToPngInEditor(tiffFilePath: string, line: number): Promise<void> {

        // find the file in the vault
        const tiffFileInVault = await this.findFileInVault(tiffFilePath)

        convertTiffToPng(tiffFileInVault.path, this.app, false);
        // rename file link in editor
        replaceTiffLink(this.editor, tiffFilePath, line);

    }
}
