import { SuperModal } from "./SuperModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { App, Editor } from "obsidian";

const UTIF = require('utif');
const PNG = require('pngjs').PNG;

export async function convertTiffDataToPng(tiffFileData: ArrayBuffer): Promise<ArrayBuffer> {
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
            png.data[idx + 1] = rgba[i + 1];
            png.data[idx + 2] = rgba[i + 2];
            png.data[idx + 3] = rgba[i + 3];
        }
    }

    // Write the PNG image to a buffer
    const pngFileData = PNG.sync.write(png);

    // const pngFileData = tiffFileData; // For now, we'll just simulate a conversion by returning the same data
    return pngFileData;
}

export async function convertTiffToPng(filePath: string, app: App, confirm:boolean = false): Promise<void> {
    const pngFilePath = filePath + '.png';

    // read tiff file
    const tiffFileData = await app.vault.adapter.readBinary(filePath);
    // convert tiff to png
    const pngFileData = await convertTiffDataToPng(tiffFileData);
    const fileExists = await app.vault.adapter.exists(pngFilePath);
    if (fileExists && confirm) {
        const confirmModal = new ConfirmationModal(app,
            'Confirmation',
            `Do you want to overwrite "${pngFilePath}"?`,
            (confirmed: boolean) => {
                if (confirmed) {
                    // create png file
                    SuperModal.createFile(pngFilePath, pngFileData, this.app, true);
                }
            });
        confirmModal.open();
    } else {
        // create png file
        SuperModal.createFile(pngFilePath, pngFileData, this.app);
    }
}

export async function replaceTiffLink(editor: Editor, tiffFilePath: string, line: number|null): Promise<void> {
    // Replace the tiff link with the png link
    if (line === null) {
        const editorValue = editor.getValue();
        editor.setValue(editorValue.split(tiffFilePath + "]]").join(tiffFilePath + ".png" + "]]"));
    }else{
        const lineContent = editor.getLine(line);
        const lineContentReplaced = lineContent.split(tiffFilePath + "]]").join(tiffFilePath + ".png" + "]]");
        editor.setLine(line, lineContentReplaced);
    }
}