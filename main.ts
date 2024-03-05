/**
 * Plugin for viewing and manipulating TIFF files in Obsidian.
 */
import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { ConverterModal } from './src/ConverterModal';
import { DeleteModal } from './src/DeleteModal';
import { ConfirmationModal } from './src/ConfirmationModal';
import { convertTiffDataToPng } from './src/Conversion';

interface TiffViewerSettings {
	automaticConversion: boolean;
}


const DEFAULT_SETTINGS: TiffViewerSettings = {
	automaticConversion: false
}

export default class TiffViewerPlugin extends Plugin {
	settings: TiffViewerSettings;

	/**
	 * Called when the plugin is loaded.
	 */
	async onload() {
		await this.loadSettings();
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TiffSettingTab(this.app, this));

		// Add event listener for active leaf change
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile instanceof TFile
					&& this.settings.automaticConversion
					&& activeFile.extension === 'md') {

					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (activeView) {
						const editor = activeView.editor;
						new ConverterModal(this.app, editor, true).open();
					}
				}
			})
		);

		// add command to convert to png by hand
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file: TFile, source: string, leaf: WorkspaceLeaf) => {
				if (file.extension === 'tiff' || file.extension === 'tif') {
					menu.addItem((item) => {
						item.setTitle('Create PNG Copy')
							.setIcon('your-icon')
							.onClick(async () => {

								// pngPath = file.path + '.png';
								const pngFilePath = file.path + '.png';

								// read tiff file
								const tiffFileData = await this.app.vault.adapter.readBinary(file.path);
								// convert tiff to png
								const pngFileData = await convertTiffDataToPng(tiffFileData);
								// create png file
								const fileExists = await this.app.vault.adapter.exists(pngFilePath);
								if (fileExists) {
									const confirmModal = new ConfirmationModal(this.app,
										'Confirmation',
										`Do you want to overwrite "${pngFilePath}"?`,
										(confirmed: boolean) => {
											if (confirmed) {
												ConverterModal.createFile(pngFilePath, pngFileData, this.app, true);
											}
										});
									confirmModal.open();
								} else {
									ConverterModal.createFile(pngFilePath, pngFileData, this.app);
								}
							});
					});
				}
			})
		);
	}


	async onunload() {
		// console.log('unloading tiff-viewer-plugin')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class TiffSettingTab extends PluginSettingTab {
	plugin: TiffViewerPlugin;

	constructor(app: App, plugin: TiffViewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Automatic conversion to PNG')
			.setDesc("Convert all TIFF files to PNG automatically when opening a note or when drag'n'dropping a tiff file into the editor.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.automaticConversion)
				.onChange(async (value) => {
					this.plugin.settings.automaticConversion = value;
					await this.plugin.saveSettings();
				}));
	}
}