# GoNexus - Go Code Quality & Analysis

GoNexus is a VSCode extension that helps you maintain high-quality Go code by analyzing your codebase for best practices, potential issues, and security vulnerabilities.

## Features

- **Code Quality Analysis**: Identifies best practices and formatting issues in your Go code
- **Issue Detection**: Finds potential bugs and runtime issues before they occur
- **Security Analysis**: Detects security vulnerabilities in your Go code
- **Organized Results**: Issues are categorized for easy navigation
- **Quick Fixes**: Automatically fix common formatting issues

## Requirements

GoNexus uses industry-standard Go tools for analysis. For the best experience, make sure you have installed:

- Go 1.16+
- The following tools (GoNexus can help you install them):
  - golint
  - staticcheck
  - gosec

## Getting Started

1. Open a Go project in VSCode
2. Click the GoNexus icon in the Activity Bar
3. Use the "Refresh" button to analyze your code
4. Review the issues found in the "Best Practices" and "Issues" tabs
5. Click on any issue to navigate to the problematic code
6. Use the "Fix" context menu option for fixable issues

## Extension Settings

GoNexus contributes the following settings:

* `gonexus.enableBestPractices`: Enable/disable best practices analysis
* `gonexus.enableIssueDetection`: Enable/disable issue detection
* `gonexus.enableSecurityChecks`: Enable/disable security checks

## Known Issues

- Some analysis tools may require additional configuration for monorepos or non-standard project layouts

## Release Notes

### 1.0.0

Initial release of GoNexus with support for:
- Go best practices detection using golint and go vet
- Issue detection with staticcheck
- Security vulnerability scanning with gosec
- Automatic formatting fixes with gofmt

## Feedback and Contributions

If you have any feedback or would like to contribute to GoNexus, please visit our [GitHub repository](https://github.com/pramithamj/gonexus).

---

**Enjoy coding with confidence!**