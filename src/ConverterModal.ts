import { App, Editor, normalizePath } from "obsidian";
import { SuperModal } from "./SuperModal";
const UTIF = require('utif');
const PNG = require('pngjs').PNG;


export class ConverterModal extends SuperModal {
    progressbar: HTMLProgressElement;

    constructor(app: App, editor: Editor) {
        super(app, editor);
    }

    onOpen() {
        this.contentEl.createEl("h1", { text: "Converting Tiff to Png..." });

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

        const tiffFileRegex = /!\[\[(.*\.tif{1,2})\]\]/gi;
        const matches = this.editor.getValue().match(tiffFileRegex);
        
        if (matches && matches.length > 0) {
            // The editor contains a .tiff file
            // Perform your operation here

            console.log('found tiff files', matches);
            const conversionPromises = matches.map(match => {
                const tiffFile = match.replace('![[', '').replace(']]', '');
                const tiffFilePath = normalizePath(tiffFile);
                
                return new Promise<void>((resolve, reject) => {
                    this.convertTiffToPng(tiffFilePath)
                        .then(() => {
                            console.log('Successfully converted', tiffFile);
                            this.updateProgressBar(this.progressbar, this.getCurrentProgress(this.progressbar)+100/matches.length);
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
                        this.addSuccessBox(this.contentEl, "All conversions completed successfully");
                    } else {
                        console.error('Errors occurred during conversions:\n', errors.join('\n'));
                        this.addErrorBox(this.contentEl, "Errors occurred during conversion:\n\t" +  errors.join('\n\t'));
                    }
                });

        }
    }

    private async convertTiffToPng(tiffFilePath: string): Promise<void> {
    
        console.log(`Converting ${tiffFilePath}`);
            
        // find the file in the vault
        const tiffFileInVault = await this.findFileInVault(tiffFilePath)
        
        // create png file path
        let pngFilePath = tiffFileInVault.path + '.png';
        
        // read tiff file
        const tiffFileData = await this.app.vault.adapter.readBinary(tiffFileInVault.path)
        
        // convert tiff to png
        const pngFileData = await this.convertTiffDataToPng(tiffFileData)
        
        // create png file
        this.createFile(pngFilePath, pngFileData);
        
        // rename in editor
        const editorContent = this.editor.getValue();
        const newEditorContent = editorContent.replace(tiffFilePath, pngFilePath);
        this.editor.setValue(newEditorContent);
        return;
                

    }

    private async convertTiffDataToPng(tiffFileData: ArrayBuffer): Promise<ArrayBuffer> {
        // Convert the tiff file data to png

        const ifds = await UTIF.decode(tiffFileData);
        UTIF.decodeImage(tiffFileData, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]); 

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
        const pngFileData = PNG.sync.write(png);

        // const pngFileData = tiffFileData; // For now, we'll just simulate a conversion by returning the same data
        return pngFileData;
    }
}
