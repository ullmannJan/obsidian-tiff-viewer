# Obsidian Tiff Viewer

This plugin creates copies of all `.tif(f)` files in the currently opened file and converts them to `.tif(f).png` where ever they are saved. This allows for `tif(f)` images to be displayed in obsidian. 

## Functionality

The plugin consists of 4 commands.

- `Tiff Viewer: Convert .tif(f) to .tif(f).png in editor`
    - Creates a copy of all **.tif(f)** files that are linked in the current editor and converts them to **.tif(f).png** and renames the file links.
- `Tiff Viewer: Delete all .tif(f).png files in vault`
    - deletes all files in the vault, that end on **.tif(f).png**.
- `Tiff Viewer: Delete .tif(f).png files in editor`
    - renames file links in the editor from **.tif(f).png** to **.tif(f)**. Then, it deletes the corresponding **.tif(f).png** files.
- `Tiff Viewer: Rename .tif(f).png to .tif(f) in editor`
    - Renames all **.tif(f).png** file links in the opened editor back to **.tif(f)**


