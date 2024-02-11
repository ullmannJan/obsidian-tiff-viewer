/**
 * Plugin for viewing and manipulating TIFF files in Obsidian.
 */
import { Editor, MarkdownView, Plugin } from 'obsidian';
import { ConverterModal } from './src/ConverterModal';
import { DeleteModal } from './src/DeleteModal';
import { ConfirmationModal } from './src/ConfirmationModal';

interface TiffViewerSettings {
	mySetting: string;
}

export default class TiffViewerPlugin extends Plugin {
	settings: TiffViewerSettings;

	/**
	 * Called when the plugin is loaded.
	 */
	async onload() {
		// console.log('loading tiff-viewer-plugin')

		// Add command to convert TIFF to PNG in editor and rename links
		this.addCommand({
			id: 'convert-tiff-to-png-editor',
			name: 'Create .tif(f).png from .tif(f) in editor and rename links',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				// Check if editor and markdown view are available
				if (view && editor) {
					if (!checking) {
						new ConverterModal(this.app, editor).open();
					}
					return true;
				}
				return false;
			},
		});

		// Add command to delete all .tif(f).png files in vault
		this.addCommand({
			id: 'delete-tiff-png-vault',
			name: 'Debug: Delete all .tif(f).png files in vault (dangerous)',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				// Check if markdown view is available
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						// Raise confirmation window
						const confirmModal = new ConfirmationModal(this.app, 
							'Confirmation', 
							'Are you sure you want to delete all .tif(f).png files in the vault?',
							(confirmed: boolean) => {
								if (confirmed) {
									const allFilesInVault = this.app.vault.getFiles();
									const tiffPngFiles = allFilesInVault.filter(file => {
										return file.path.endsWith('.tif.png') || file.path.endsWith('.tiff.png');
									});
									tiffPngFiles.forEach(file => {
										this.app.vault.delete(file);
									});
								}
							});
						confirmModal.open();
					}
					return true;
				}
			}
		});

		// Add command to delete .tif(f).png files linked in editor and rename links
		this.addCommand({
			id: 'delete-tiff-png-editor',
			name: 'Delete .tif(f).png files linked in editor and rename links',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				// Check if markdown view is available
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new DeleteModal(this.app, editor).open();
					}
					return true;
				}
			}
		});

		// Add command to rename file links with .tif(f).png to .tif(f) in editor
		this.addCommand({
			id: 'convert-png-to-tiff',
			name: 'Debug: Rename file links with .tif(f).png to .tif(f) in editor',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				// Check if markdown view is available
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						
						const tiffPngRegex = /!\[\[(.*?\.tif{1,2}\.png)\]\]/gi;
						let match;
						let matches: string[] = [];
						let lineIndices: number[] = [];
						let editorValue = editor.getValue();
						while ((match = tiffPngRegex.exec(editorValue)) !== null) {
							matches.push(match[0]);
							let lineNumber = (editorValue.substring(0, match.index).match(/\n/g) || []).length;
							lineIndices.push(lineNumber);
						}
						if (matches && matches.length > 0) {
							// console.log('matches', matches, "in lines", lineIndices);
							matches.forEach((match, i) => {
								const lineContent = editor.getLine(lineIndices[i]);
								const newLineContent = lineContent.replace(match, match.replace('.png]]', ']]'));
								editor.setLine(lineIndices[i], newLineContent);
							});
						}
					}
					return true;
				}
			}
		});

	}

	async onunload() {
		// console.log('unloading tiff-viewer-plugin')
	}
}