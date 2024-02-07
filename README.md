# Obsidian Tiff Viewer

This plugin creates copies of all `.tif(f)` files in the currently opened file and converts them to `.tif(f).png` where ever they are saved. This allows for `tif(f)` images to be displayed in obsidian. 

# Use Case

In Science it is still common to use `.tif(f)` files. Today's browsers are not natively compatible with this picture format and thus, obsidian is not capable of displaying them. To address this issue this plugin allows to simplify the conversion process by running one command to convert the file links to `.tif(f).png` files. Furthermore, it creates a `.png` copy of this image in the same directory as source file. This picture can now be easily displayed in an obsidian note.

## Functionality

The plugin consists of 4 commands.

- `Tiff Viewer: Create .tif(f).png from .tif(f) in editor and rename links`
    - Creates a copy of all **.tif(f)** files that are linked in the current editor and converts them to **.tif(f).png** and renames the file links.
- `Tiff Viewer: Delete all .tif(f).png files in vault (dangerous)`
    - deletes all files in the vault, that end on **.tif(f).png**.
- `Tiff Viewer: Delete .tif(f).png files linked in editor and rename links`
    - renames file links in the editor from **.tif(f).png** to **.tif(f)**. Then, it deletes the corresponding **.tif(f).png** files.
- `Tiff Viewer: Rename file links with .tif(f).png to .tif(f) in editor`
    - Renames all **.tif(f).png** file links in the current editor back to **.tif(f)**. However, it does not delete anything.


