
'use strict';

import * as vscode from 'vscode';
import { workspace } from 'vscode';
const findGitRoot = require('find-git-root');
import * as cp from 'child_process';
import { getVSCodeDownloadUrl } from 'vscode-test/out/util';
const gitLsFiles = require('git-ls-files');

let projects: any = {};

export function activate(context: vscode.ExtensionContext) {
    const stateKey = "projectile";
    const stateKeyCurrentProject = "current-project";

    projects = context.globalState.get(stateKey) ? context.globalState.get(stateKey) : {};
    context.globalState.setKeysForSync([stateKey]);

    const openProjectFiles = (cwd: any) => {
        const files = gitLsFiles({ cwd });
        const projectFiles = vscode.window.createQuickPick();
        projectFiles.items = files.all.map((label: any) => ({ label }));
        projectFiles.canSelectMany = false;
        projectFiles.onDidChangeSelection(async (fileItem) => {
            const file = fileItem[0].label;
            projectFiles.hide();
            const doc = await vscode.workspace.openTextDocument(`${cwd}/${file}`);
            vscode.window.showTextDocument(doc);
        });
        projectFiles.show();

    };
    vscode.commands.registerCommand('projectile.projectFiles', async () => {
        const root = vscode.window.activeTextEditor ? 
            findGitRoot(vscode.window.activeTextEditor.document.fileName).replace(/\/\.git$/, "") : 
            context.workspaceState.get(stateKeyCurrentProject);
        if (root) {
            openProjectFiles(root);
        }
    });

    vscode.commands.registerCommand('projectile.projects', async () => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = Object.keys(projects).map(label => ({ label }));
        quickPick.canSelectMany = false;
        quickPick.onDidChangeSelection((e) => {
            context.workspaceState.update(stateKeyCurrentProject, e[0].label);
            openProjectFiles(e[0].label);
            quickPick.hide();
        });

        quickPick.show();
    });

    vscode.workspace.onDidOpenTextDocument(async (doc: vscode.TextDocument) => {
        if (doc.fileName) {
            try {
                const root = findGitRoot(doc.fileName).replace(/\/\.git$/, "");
                projects[root] = true;
                context.globalState.update(stateKey, projects);
                context.workspaceState.update(stateKeyCurrentProject, root);
                workspace.updateWorkspaceFolders(workspace.workspaceFolders ? workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.file(root) });
            } catch (e) {
            }
        }
    });
}
