import { App, Editor, MarkdownView, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ConverterModal } from './src/ConverterModal';
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class TiffViewerPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading plugin')
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// add modal
		this.addCommand({
			id: 'convert-to-png',
			name: 'Convert to png',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				
				if (view && editor) {
				  if (!checking) {
					new ConverterModal(this.app, editor).open();
				  }
			
				  return true
				}
			
				return false;
			  },
		});

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'delete_tiff_png',
			name: 'Delete all .tif.png and .tiff.png in vault',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						
						const allFilesInVault = this.app.vault.getFiles();

						const tiffPngFiles = allFilesInVault.filter(file => {
							return file.path.endsWith('.tif.png') || file.path.endsWith('.tiff.png');
						});

						tiffPngFiles.forEach(file => {
							this.app.vault.delete(file);
						});
				
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'convert_png_to_tiff',
			name: 'Convert all .tiff.png/.tif.png to .tiff/.tif in the editor',
			editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						
						const tiffPngRegex = /!\[\[(.*\.tif{1,2}\.png)\]\]/gi;
						const matches = editor.getValue().match(tiffPngRegex);
						if (matches && matches.length > 0) {
							console.log('matches', matches);
							matches.forEach(match => {
								
								const editorContent = editor.getValue();
								const newEditorContent = editorContent.replace(match, match.replace('.png', ''));
								editor.setValue(newEditorContent);
							});
						}
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	async onunload() {
		console.log('unloading plugin')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: TiffViewerPlugin;

	constructor(app: App, plugin: TiffViewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Tiff Viewer Setting')
			.setDesc('There are no settings for this plugin yet.')
			.addText(text => text
				.setPlaceholder('Do what you want with this!')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
