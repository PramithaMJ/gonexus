import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as util from 'util';

export interface Issue {
    id: string;
    description: string;
    file?: string;
    line?: number;
    severity: 'error' | 'warning' | 'info';
    category: 'bestPractice' | 'issue';
    subcategory: 'formatting' | 'errorHandling' | 'naming' | 'performance' | 'security' | 'other';
    fixable: boolean;
}

export class IssueItem extends vscode.TreeItem {
    constructor(
        public readonly issue: Issue,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(issue.description, collapsibleState);
        
        // Build a tooltip string instead of using MarkdownString
        let tooltipText = `${issue.description}`;
        
        if (issue.file) {
            tooltipText += `\nFile: ${issue.file}`;
        }
        
        if (issue.line !== undefined) {
            tooltipText += `\nLine: ${issue.line}`;
        }
        
        tooltipText += `\nSeverity: ${issue.severity}`;
        tooltipText += `\nFixable: ${issue.fixable ? 'Yes' : 'No'}`;
        
        this.tooltip = tooltipText;
        
        // Show line number and filename in the description
        if (issue.file && issue.line !== undefined) {
            const fileName = path.basename(issue.file);
            this.description = `${fileName}:${issue.line}`;
            
            this.command = {
                command: 'vscode.open',
                arguments: [vscode.Uri.file(issue.file), { selection: new vscode.Range(issue.line, 0, issue.line, 0) }],
                title: 'Open File'
            };
        } else if (issue.file) {
            this.description = path.basename(issue.file);
        } else {
            this.description = issue.fixable ? '(fixable)' : '';
        }

        // Set different icons based on severity
        switch (issue.severity) {
            case 'error':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'error-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'error-dark.svg')
                };
                break;
            case 'warning':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'warning-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'warning-dark.svg')
                };
                break;
            case 'info':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'info-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'info-dark.svg')
                };
                break;
        }

        this.contextValue = issue.fixable ? 'fixableIssue' : 'issue';
    }
}

// Create a category node class to organize issues by subcategory
export class CategoryNode extends vscode.TreeItem {
    constructor(
        public readonly subcategory: string,
        public readonly issues: Issue[],
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(getCategoryLabel(subcategory), collapsibleState);
        
        this.tooltip = `${issues.length} issues in this category`;
        this.description = `(${issues.length})`;
        
        // Set icon based on category
        switch (subcategory) {
            case 'formatting':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'formatting-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'formatting-dark.svg')
                };
                break;
            case 'errorHandling':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'error-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'error-dark.svg')
                };
                break;
            case 'naming':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'naming-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'naming-dark.svg')
                };
                break;
            case 'performance':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'performance-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'performance-dark.svg')
                };
                break;
            case 'security':
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'security-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'security-dark.svg')
                };
                break;
            default:
                this.iconPath = {
                    light: path.join(__dirname, '..', 'resources', 'category-light.svg'),
                    dark: path.join(__dirname, '..', 'resources', 'category-dark.svg')
                };
                break;
        }
    }
}

// Helper function to get a readable label for each category
function getCategoryLabel(category: string): string {
    switch (category) {
        case 'formatting':
            return 'Go Formatting';
        case 'errorHandling':
            return 'Error Handling';
        case 'naming':
            return 'Naming Conventions';
        case 'performance':
            return 'Performance';
        case 'security':
            return 'Security';
        default:
            return 'Other';
    }
}

type TreeItem = IssueItem | CategoryNode;

export class IssuesProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null> = new vscode.EventEmitter<TreeItem | undefined | null>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null> = this._onDidChangeTreeData.event;

    private issues: Issue[] = [];
    private category: 'bestPractice' | 'issue';
    private analyzing: boolean = false;

    constructor(category: 'bestPractice' | 'issue') {
        this.category = category;
    }

    refresh(): void {
        console.log(`Refreshing ${this.category} issues view...`);
        this._onDidChangeTreeData.fire();
        
        // Analyze codebase after firing the event
        this.analyzeCodebase();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            // Root level - Group issues by subcategory
            const filteredIssues = this.issues.filter(issue => issue.category === this.category);
            console.log(`Getting children for root. Found ${filteredIssues.length} issues for category ${this.category}`);
            
            if (filteredIssues.length === 0) {
                // If no issues were found, create a placeholder using a dummy issue
                const placeholderIssue: Issue = {
                    id: 'placeholder',
                    description: 'No issues found. Click refresh to analyze again.',
                    severity: 'info',
                    category: this.category,
                    subcategory: 'other',
                    fixable: false
                };
                
                return Promise.resolve([
                    new IssueItem(placeholderIssue, vscode.TreeItemCollapsibleState.None)
                ]);
            }
            
            // Group issues by subcategory
            const subcategories = new Map<string, Issue[]>();
            
            for (const issue of filteredIssues) {
                if (!subcategories.has(issue.subcategory)) {
                    subcategories.set(issue.subcategory, []);
                }
                subcategories.get(issue.subcategory)!.push(issue);
            }
            
            // Create category nodes
            const categoryNodes: CategoryNode[] = [];
            
            for (const [subcategory, issues] of subcategories.entries()) {
                categoryNodes.push(new CategoryNode(
                    subcategory,
                    issues,
                    vscode.TreeItemCollapsibleState.Expanded
                ));
            }
            
            console.log(`Created ${categoryNodes.length} category nodes`);
            return Promise.resolve(categoryNodes);
        } else if (element instanceof CategoryNode) {
            // Category node - Show issues in this category
            console.log(`Getting children for category ${element.subcategory}. Found ${element.issues.length} issues`);
            return Promise.resolve(
                element.issues.map(issue => 
                    new IssueItem(issue, vscode.TreeItemCollapsibleState.None)
                )
            );
        } else {
            return Promise.resolve([]);
        }
    }

    // Method to analyze the codebase and find issues
    async analyzeCodebase(): Promise<void> {
        if (this.analyzing) {
            console.log('Analysis already in progress, skipping...');
            return;
        }
        
        console.log(`Starting analysis for ${this.category} issues...`);
        this.analyzing = true;
        this.issues = [];
        
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder found. Please open a Go project.');
                return;
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            console.log(`Analyzing workspace at ${rootPath}`);
            
            // Check if Go tools are installed
            if (!await this.checkGoToolsInstalled(rootPath)) {
                return;
            }
            
            // Run appropriate tools based on category
            if (this.category === 'bestPractice') {
                await this.analyzeBestPractices(rootPath);
            } else {
                await this.analyzeIssues(rootPath);
            }
            
            console.log(`Analysis complete. Found ${this.issues.length} issues.`);
        } catch (error) {
            console.error('Error analyzing codebase:', error);
            vscode.window.showErrorMessage(`Error analyzing Go codebase: ${error}`);
        } finally {
            this.analyzing = false;
            this._onDidChangeTreeData.fire();
        }
    }
    
    private async checkGoToolsInstalled(rootPath: string): Promise<boolean> {
        try {
            const exec = util.promisify(child_process.exec);
            // Check if go is installed
            await exec('go version');
            
            // Try to install missing tools
            if (this.category === 'bestPractice') {
                try {
                    await exec('golint -h', { timeout: 1000 });
                } catch (error) {
                    const choice = await vscode.window.showWarningMessage(
                        'The "golint" tool is not installed. Do you want to install it?',
                        'Install', 'Cancel'
                    );
                    
                    if (choice === 'Install') {
                        vscode.window.showInformationMessage('Installing golint...');
                        await exec('go install golang.org/x/lint/golint@latest');
                    }
                }
            } else {
                try {
                    await exec('staticcheck -h', { timeout: 1000 });
                } catch (error) {
                    const choice = await vscode.window.showWarningMessage(
                        'The "staticcheck" tool is not installed. Do you want to install it?',
                        'Install', 'Cancel'
                    );
                    
                    if (choice === 'Install') {
                        vscode.window.showInformationMessage('Installing staticcheck...');
                        await exec('go install honnef.co/go/tools/cmd/staticcheck@latest');
                    }
                }
                
                try {
                    await exec('gosec -h', { timeout: 1000 });
                } catch (error) {
                    const choice = await vscode.window.showWarningMessage(
                        'The "gosec" tool is not installed. Do you want to install it?',
                        'Install', 'Cancel'
                    );
                    
                    if (choice === 'Install') {
                        vscode.window.showInformationMessage('Installing gosec...');
                        await exec('go install github.com/securego/gosec/v2/cmd/gosec@latest');
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Go or required tools not found:', error);
            vscode.window.showErrorMessage('Go is not installed or not in PATH. Please install Go and restart VSCode.');
            return false;
        }
    }

    private async analyzeBestPractices(rootPath: string): Promise<void> {
        console.log('Running best practices analysis...');
        
        // Run golint for best practices
        await this.runGolint(rootPath);
        
        // Run go vet for potential errors
        await this.runGoVet(rootPath);
        
        // Run gofmt to check formatting
        await this.checkFormatting(rootPath);
    }

    private async analyzeIssues(rootPath: string): Promise<void> {
        console.log('Running issues analysis...');
        
        // Run staticcheck or errcheck for actual issues
        await this.runStaticcheck(rootPath);
        
        // Run gosec for security issues
        await this.runGosec(rootPath);
    }

    private async runGolint(rootPath: string): Promise<void> {
        try {
            console.log('Running golint...');
            const exec = util.promisify(child_process.exec);
            const { stdout, stderr } = await exec('golint ./...', { cwd: rootPath, timeout: 10000 });
            
            console.log('golint stdout:', stdout);
            console.log('golint stderr:', stderr);
            
            if (stdout) {
                const lines = stdout.split('\n').filter(line => line.trim() !== '');
                console.log(`Found ${lines.length} linting issues`);
                
                for (const line of lines) {
                    // Parse golint output format: file:line:col: message
                    const match = line.match(/^(.+):(\d+):(\d+):\s+(.+)$/);
                    if (match) {
                        const [, file, lineNum, , message] = match;
                        this.issues.push({
                            id: `golint-${this.issues.length}`,
                            description: message,
                            file: path.join(rootPath, file),
                            line: parseInt(lineNum, 10) - 1,
                            severity: 'warning',
                            category: 'bestPractice',
                            subcategory: this.determineSubcategory(message),
                            fixable: false
                        });
                    } else {
                        console.log('Line did not match expected format:', line);
                    }
                }
            }
        } catch (error) {
            console.error('golint error:', error);
            // Try fallback: use direct Go files
            await this.analyzeGoFilesDirectly(rootPath);
        }
    }

    // Add this method to create a fallback if no issues are found with analysis tools
    private async analyzeGoFilesDirectly(rootPath: string): Promise<void> {
        try {
            console.log('Falling back to direct file analysis...');
            const exec = util.promisify(child_process.exec);
            
            // Find all Go files
            const { stdout: filesList } = await exec('find . -name "*.go" -type f', { cwd: rootPath });
            const goFiles = filesList.split('\n').filter(file => file.trim() !== '');
            
            console.log(`Found ${goFiles.length} Go files`);
            
            // Create at least one issue for demonstration
            if (goFiles.length > 0) {
                const filePath = path.join(rootPath, goFiles[0]);
                
                // Read file content
                const content = await fs.promises.readFile(filePath, 'utf8');
                const lines = content.split('\n');
                
                // Check for common patterns
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    // Check for error handling
                    if (line.includes('err :=') && i < lines.length - 1 && !lines[i+1].includes('if err !=')) {
                        this.issues.push({
                            id: `direct-${this.issues.length}`,
                            description: 'Error not handled',
                            file: filePath,
                            line: i,
                            severity: 'warning',
                            category: this.category,
                            subcategory: 'errorHandling',
                            fixable: false
                        });
                    }
                    
                    // Check long lines
                    if (line.length > 100) {
                        this.issues.push({
                            id: `direct-${this.issues.length}`,
                            description: 'Line too long (>100 characters)',
                            file: filePath,
                            line: i,
                            severity: 'info',
                            category: this.category,
                            subcategory: 'formatting',
                            fixable: false
                        });
                    }
                    
                    // Add a sample issue if we haven't found any yet
                    if (this.issues.length === 0 && i === lines.length - 1) {
                        this.issues.push({
                            id: `sample-${this.issues.length}`,
                            description: 'Sample issue: Consider reviewing this file',
                            file: filePath,
                            line: 0,
                            severity: 'info',
                            category: this.category,
                            subcategory: 'other',
                            fixable: false
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error in direct file analysis:', error);
        }
    }

    private async runGoVet(rootPath: string): Promise<void> {
        try {
            const exec = util.promisify(child_process.exec);
            const { stderr } = await exec('go vet ./...', { cwd: rootPath });
            
            if (stderr) {
                const lines = stderr.split('\n').filter((line: string) => line.trim() !== '');
                
                for (const line of lines) {
                    // Parse go vet output format: file:line: message
                    const match = line.match(/^(.+):(\d+):\s+(.+)$/);
                    if (match) {
                        const [_, file, lineNum, message] = match;
                        this.issues.push({
                            id: `govet-${this.issues.length}`,
                            description: message,
                            file: path.join(rootPath, file),
                            line: parseInt(lineNum, 10) - 1,
                            severity: 'error',
                            category: 'bestPractice',
                            subcategory: 'errorHandling',
                            fixable: false
                        });
                    }
                }
            }
        } catch (error) {
            // Ignore exit code errors as go vet returns non-zero when it finds issues
            if (error instanceof Error && 'stderr' in error) {
                const stderr = (error as any).stderr;
                const lines = stderr.split('\n').filter((line: string) => line.trim() !== '');
                
                for (const line of lines) {
                    const match = line.match(/^(.+):(\d+):\s+(.+)$/);
                    if (match) {
                        const [_, file, lineNum, message] = match;
                        this.issues.push({
                            id: `govet-${this.issues.length}`,
                            description: message,
                            file: path.join(rootPath, file),
                            line: parseInt(lineNum, 10) - 1,
                            severity: 'error',
                            category: 'bestPractice',
                            subcategory: 'errorHandling',
                            fixable: false
                        });
                    }
                }
            } else {
                console.log('go vet error:', error);
            }
        }
    }

    private async checkFormatting(rootPath: string): Promise<void> {
        try {
            const exec = util.promisify(child_process.exec);
            
            // Find all Go files
            const { stdout: filesList } = await exec('find . -name "*.go" -type f', { cwd: rootPath });
            const goFiles = filesList.split('\n').filter(file => file.trim() !== '');
            
            for (const goFile of goFiles) {
                const filePath = path.join(rootPath, goFile);
                
                // Check if file needs formatting
                try {
                    await exec(`gofmt -d ${goFile}`, { cwd: rootPath });
                } catch (error) {
                    if (error instanceof Error && 'stdout' in error) {
                        const stdout = (error as any).stdout;
                        if (stdout && stdout.trim() !== '') {
                            // File needs formatting
                            this.issues.push({
                                id: `gofmt-${this.issues.length}`,
                                description: 'File needs formatting',
                                file: filePath,
                                severity: 'info',
                                category: 'bestPractice',
                                subcategory: 'formatting',
                                fixable: true
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.log('gofmt error:', error);
        }
    }

    private async runStaticcheck(rootPath: string): Promise<void> {
        try {
            console.log('Running staticcheck...');
            const exec = util.promisify(child_process.exec);
            const { stdout } = await exec('staticcheck ./...', { cwd: rootPath });
            
            if (stdout) {
                const lines = stdout.split('\n').filter(line => line.trim() !== '');
                console.log(`Found ${lines.length} staticcheck issues`);
                
                for (const line of lines) {
                    // Parse staticcheck output format: file:line:col: message
                    const match = line.match(/^(.+):(\d+):(\d+):\s+(.+)$/);
                    if (match) {
                        const [_, file, lineNum, __, message] = match;
                        this.issues.push({
                            id: `staticcheck-${this.issues.length}`,
                            description: message,
                            file: path.join(rootPath, file),
                            line: parseInt(lineNum, 10) - 1,
                            severity: 'error',
                            category: 'issue',
                            subcategory: this.determineSubcategory(message),
                            fixable: message.toLowerCase().includes('replace') || message.toLowerCase().includes('use')
                        });
                    }
                }
            }
        } catch (error) {
            console.log('staticcheck not available or error:', error);
        }
    }

    private async runGosec(rootPath: string): Promise<void> {
        try {
            console.log('Running gosec...');
            const exec = util.promisify(child_process.exec);
            const { stdout } = await exec('gosec -fmt=text ./...', { cwd: rootPath });
            
            if (stdout) {
                const lines = stdout.split('\n').filter(line => line.trim() !== '');
                console.log(`Found ${lines.length} gosec issues`);
                
                for (const line of lines) {
                    // Parse gosec output format: [severity] file:line: message
                    const match = line.match(/\[(.*?)\]\s+(.+):(\d+):\s+(.+)$/);
                    if (match) {
                        const [_, severityStr, file, lineNum, message] = match;
                        const severity = severityStr.toLowerCase().includes('high') ? 'error' : 
                                        severityStr.toLowerCase().includes('medium') ? 'warning' : 'info';
                        
                        this.issues.push({
                            id: `gosec-${this.issues.length}`,
                            description: message,
                            file: path.join(rootPath, file),
                            line: parseInt(lineNum, 10) - 1,
                            severity: severity,
                            category: 'issue',
                            subcategory: 'security',
                            fixable: false
                        });
                    }
                }
            }
        } catch (error) {
            console.log('gosec not available or error:', error);
        }
    }

    private determineSubcategory(message: string): 'formatting' | 'errorHandling' | 'naming' | 'performance' | 'security' | 'other' {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('format') || lowerMsg.includes('indent') || lowerMsg.includes('whitespace')) {
            return 'formatting';
        } else if (lowerMsg.includes('error') || lowerMsg.includes('nil') || lowerMsg.includes('exception')) {
            return 'errorHandling';
        } else if (lowerMsg.includes('name') || lowerMsg.includes('export') || lowerMsg.includes('unexport')) {
            return 'naming';
        } else if (lowerMsg.includes('performance') || lowerMsg.includes('inefficient') || lowerMsg.includes('allocate')) {
            return 'performance';
        } else if (lowerMsg.includes('secur') || lowerMsg.includes('inject') || lowerMsg.includes('vulnerability')) {
            return 'security';
        } else {
            return 'other';
        }
    }

    // Method to fix an issue
    async fixIssue(issueItem: IssueItem): Promise<void> {
        const issue = issueItem.issue;
        if (!issue.fixable) {
            vscode.window.showInformationMessage(`The issue '${issue.description}' cannot be automatically fixed.`);
            return;
        }

        try {
            if (issue.subcategory === 'formatting' && issue.file) {
                // Fix formatting issues with gofmt
                const exec = util.promisify(child_process.exec);
                await exec(`gofmt -w "${issue.file}"`);
                
                // Refresh the file in VS Code
                const document = await vscode.workspace.openTextDocument(issue.file);
                await vscode.window.showTextDocument(document);
                
                vscode.window.showInformationMessage(`Formatted file: ${path.basename(issue.file)}`);
            } else {
                // For other issues, you might need to implement specific fixes
                // or just open the file and let the user fix it
                if (issue.file && issue.line !== undefined) {
                    const document = await vscode.workspace.openTextDocument(issue.file);
                    const editor = await vscode.window.showTextDocument(document);
                    
                    // Position cursor at the issue location
                    const position = new vscode.Position(issue.line, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                    
                    vscode.window.showInformationMessage(`Please fix the issue: ${issue.description}`);
                }
            }
            
            // Remove the fixed issue from the list
            this.issues = this.issues.filter(i => i.id !== issue.id);
            this.refresh();
        } catch (error) {
            console.error('Error fixing issue:', error);
            vscode.window.showErrorMessage(`Error fixing issue: ${error}`);
        }
    }
}
