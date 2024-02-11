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
                    this.convertTiffToPng(tiffFilePath, line)
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
                            errors.push(`\nConversion ${i + 1}: ${result.reason.message}`);
                        }
                    });
                
                    if (errors.length === 0) {
                        this.addSuccessBox(this.contentEl, "All conversions completed successfully");
                    } else {
                        // console.error('Errors occurred during conversions:\n', errors.join('\n'));
                        this.addErrorBox(this.contentEl, "Errors occurred during conversion:\n" +  errors.join('\n'));
                    }
                });

        }else {
             this.progressbar.setAttribute('value', '100');
             this.addErrorBox(this.contentEl, "No .tif(f).png files found in editor");
        }
    }

    private async convertTiffToPng(tiffFilePath: string, line: number): Promise<void> {
                
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
        
        // rename file link in editor
        const lineContent = this.editor.getLine(line);
        this.editor.setLine(line, lineContent.replace(tiffFilePath+"]]", pngFilePath+"]]"));
        
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
