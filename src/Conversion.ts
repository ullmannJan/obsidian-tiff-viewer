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