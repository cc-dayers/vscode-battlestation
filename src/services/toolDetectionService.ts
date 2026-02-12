import * as vscode from "vscode";
import type { Action } from "../types";

export type DetectionMethod = "file" | "command" | "hybrid";

export interface DetectionOptions {
  docker?: boolean;
  dockerCompose?: boolean;
  python?: boolean;
  go?: boolean;
  rust?: boolean;
  make?: boolean;
  gradle?: boolean;
  maven?: boolean;
  cmake?: boolean;
  git?: boolean;
}

/**
 * Service for detecting installed tools and generating appropriate actions.
 * Supports file-based, command-based, and hybrid detection methods.
 */
export class ToolDetectionService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /* ─── Workspace helpers ─── */

  private getWorkspaceRoot(): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri;
  }

  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  private async readText(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString("utf-8");
  }

  private async fileExistsInWorkspace(relativePath: string): Promise<boolean> {
    const root = this.getWorkspaceRoot();
    if (!root) return false;
    return this.fileExists(vscode.Uri.joinPath(root, relativePath));
  }

  /* ─── File-based detection methods (fast) ─── */

  async hasDockerfile(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("Dockerfile")) ||
      (await this.fileExistsInWorkspace(".dockerignore")) ||
      (await this.findFilesByPattern("*.dockerfile"))
    );
  }

  async hasDockerCompose(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("docker-compose.yml")) ||
      (await this.fileExistsInWorkspace("docker-compose.yaml")) ||
      (await this.fileExistsInWorkspace("compose.yml")) ||
      (await this.fileExistsInWorkspace("compose.yaml"))
    );
  }

  async hasPython(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("requirements.txt")) ||
      (await this.fileExistsInWorkspace("pyproject.toml")) ||
      (await this.fileExistsInWorkspace("setup.py")) ||
      (await this.findFilesByPattern("*.py"))
    );
  }

  async hasGo(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("go.mod")) ||
      (await this.fileExistsInWorkspace("go.sum")) ||
      (await this.findFilesByPattern("*.go"))
    );
  }

  async hasRust(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("Cargo.toml")) ||
      (await this.fileExistsInWorkspace("Cargo.lock")) ||
      (await this.findFilesByPattern("*.rs"))
    );
  }

  async hasMakefile(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("Makefile")) ||
      (await this.fileExistsInWorkspace("makefile")) ||
      (await this.fileExistsInWorkspace("GNUmakefile"))
    );
  }

  async hasGradle(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("build.gradle")) ||
      (await this.fileExistsInWorkspace("build.gradle.kts")) ||
      (await this.fileExistsInWorkspace("gradlew"))
    );
  }

  async hasMaven(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("pom.xml")) ||
      (await this.fileExistsInWorkspace("mvnw"))
    );
  }

  async hasCMake(): Promise<boolean> {
    return (
      (await this.fileExistsInWorkspace("CMakeLists.txt")) ||
      (await this.findFilesByPattern("*.cmake"))
    );
  }

  async hasGit(): Promise<boolean> {
    return await this.fileExistsInWorkspace(".git");
  }

  /* ─── Helper: Find files by pattern ─── */

  private async findFilesByPattern(pattern: string): Promise<boolean> {
    const root = this.getWorkspaceRoot();
    if (!root) return false;

    try {
      const files = await vscode.workspace.findFiles(
        pattern,
        "**/node_modules/**",
        1 // Only need to find one file
      );
      return files.length > 0;
    } catch {
      return false;
    }
  }

  /* ─── Command-based detection (check if command exists) ─── */

  private async commandExists(command: string): Promise<boolean> {
    // For command detection, we'll use a simpler approach:
    // Check common installation paths or use which/where command
    const isWindows = process.platform === "win32";
    const checkCmd = isWindows ? `where ${command}` : `which ${command}`;
    
    try {
      const { exec } = require("child_process");
      return await new Promise<boolean>((resolve) => {
        exec(checkCmd, (error: any) => {
          resolve(error === null);
        });
      });
    } catch {
      return false;
    }
  }

  async hasDockerCommand(): Promise<boolean> {
    return this.commandExists("docker");
  }

  async hasDockerComposeCommand(): Promise<boolean> {
    return this.commandExists("docker-compose") || this.commandExists("docker");
  }

  async hasPythonCommand(): Promise<boolean> {
    const hasPython = await this.commandExists("python");
    const hasPython3 = await this.commandExists("python3");
    return hasPython || hasPython3;
  }

  async hasGoCommand(): Promise<boolean> {
    return this.commandExists("go");
  }

  async hasRustCommand(): Promise<boolean> {
    return this.commandExists("cargo");
  }

  async hasMakeCommand(): Promise<boolean> {
    return this.commandExists("make");
  }

  async hasGradleCommand(): Promise<boolean> {
    return this.commandExists("gradle");
  }

  async hasMavenCommand(): Promise<boolean> {
    return this.commandExists("mvn");
  }

  async hasCMakeCommand(): Promise<boolean> {
    return this.commandExists("cmake");
  }

  async hasGitCommand(): Promise<boolean> {
    return this.commandExists("git");
  }

  /* ─── Hybrid detection (combines file and command detection) ─── */

  async detectToolAvailability(method: DetectionMethod): Promise<{
    docker: boolean;
    dockerCompose: boolean;
    python: boolean;
    go: boolean;
    rust: boolean;
    make: boolean;
    gradle: boolean;
    maven: boolean;
    cmake: boolean;
    git: boolean;
  }> {
    switch (method) {
      case "file":
        return {
          docker: await this.hasDockerfile(),
          dockerCompose: await this.hasDockerCompose(),
          python: await this.hasPython(),
          go: await this.hasGo(),
          rust: await this.hasRust(),
          make: await this.hasMakefile(),
          gradle: await this.hasGradle(),
          maven: await this.hasMaven(),
          cmake: await this.hasCMake(),
          git: await this.hasGit(),
        };
      
      case "command":
        return {
          docker: await this.hasDockerCommand(),
          dockerCompose: await this.hasDockerComposeCommand(),
          python: await this.hasPythonCommand(),
          go: await this.hasGoCommand(),
          rust: await this.hasRustCommand(),
          make: await this.hasMakeCommand(),
          gradle: await this.hasGradleCommand(),
          maven: await this.hasMavenCommand(),
          cmake: await this.hasCMakeCommand(),
          git: await this.hasGitCommand(),
        };
      
      case "hybrid":
        // For hybrid, both file AND command must be present
        const fileResults = await this.detectToolAvailability("file");
        const cmdResults = await this.detectToolAvailability("command");
        return {
          docker: fileResults.docker && cmdResults.docker,
          dockerCompose: fileResults.dockerCompose && cmdResults.dockerCompose,
          python: fileResults.python && cmdResults.python,
          go: fileResults.go && cmdResults.go,
          rust: fileResults.rust && cmdResults.rust,
          make: fileResults.make && cmdResults.make,
          gradle: fileResults.gradle && cmdResults.gradle,
          maven: fileResults.maven && cmdResults.maven,
          cmake: fileResults.cmake && cmdResults.cmake,
          git: fileResults.git && cmdResults.git,
        };
    }
  }

  /* ─── Tool detection with action generation ─── */

  async detectDocker(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasDockerfile();
    if (!hasFiles && method === "file") return [];

    // For command-based or hybrid, we could check if docker is installed
    // but for now we'll rely on file-based detection
    if (!hasFiles) return [];

    const actions: Action[] = [];

    if (await this.hasDockerfile()) {
      actions.push(
        { name: "Docker Build", command: "docker build -t myapp .", type: "docker" },
        { name: "Docker Run", command: "docker run -p 8080:8080 myapp", type: "docker" },
        { name: "Docker PS", command: "docker ps", type: "docker" },
        { name: "Docker Stop All", command: "docker stop $(docker ps -q)", type: "docker" }
      );
    }

    return actions;
  }

  async detectDockerCompose(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasDockerCompose();
    if (!hasFiles) return [];

    return [
      { name: "Docker Compose Up", command: "docker-compose up", type: "docker-compose" },
      { name: "Docker Compose Up (Detached)", command: "docker-compose up -d", type: "docker-compose" },
      { name: "Docker Compose Down", command: "docker-compose down", type: "docker-compose" },
      { name: "Docker Compose Logs", command: "docker-compose logs -f", type: "docker-compose" },
      { name: "Docker Compose Build", command: "docker-compose build", type: "docker-compose" }
    ];
  }

  async detectPython(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasPython();
    if (!hasFiles) return [];

    const actions: Action[] = [
      { name: "Python Run", command: "python main.py", type: "python" },
    ];

    if (await this.fileExistsInWorkspace("requirements.txt")) {
      actions.push({ name: "Pip Install", command: "pip install -r requirements.txt", type: "python" });
    }

    if (await this.fileExistsInWorkspace("setup.py")) {
      actions.push({ name: "Python Install", command: "pip install -e .", type: "python" });
    }

    actions.push(
      { name: "Python Tests", command: "python -m pytest", type: "python" },
      { name: "Python Lint", command: "pylint .", type: "python" }
    );

    return actions;
  }

  async detectGo(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasGo();
    if (!hasFiles) return [];

    return [
      { name: "Go Build", command: "go build", type: "go" },
      { name: "Go Run", command: "go run .", type: "go" },
      { name: "Go Test", command: "go test ./...", type: "go" },
      { name: "Go Mod Tidy", command: "go mod tidy", type: "go" },
      { name: "Go Fmt", command: "go fmt ./...", type: "go" }
    ];
  }

  async detectRust(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasRust();
    if (!hasFiles) return [];

    return [
      { name: "Cargo Build", command: "cargo build", type: "rust" },
      { name: "Cargo Build (Release)", command: "cargo build --release", type: "rust" },
      { name: "Cargo Run", command: "cargo run", type: "rust" },
      { name: "Cargo Test", command: "cargo test", type: "rust" },
      { name: "Cargo Check", command: "cargo check", type: "rust" },
      { name: "Cargo Fmt", command: "cargo fmt", type: "rust" }
    ];
  }

  async detectMake(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasMakefile();
    if (!hasFiles) return [];

    // Parse Makefile to find targets
    const targets = await this.parseMakefileTargets();

    if (targets.length > 0) {
      return targets.map((target) => ({
        name: `Make: ${target}`,
        command: `make ${target}`,
        type: "build"
      }));
    }

    // Default make targets if parsing fails
    return [
      { name: "Make: all", command: "make all", type: "build" },
      { name: "Make: clean", command: "make clean", type: "build" },
      { name: "Make: test", command: "make test", type: "test" }
    ];
  }

  async detectGradle(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasGradle();
    if (!hasFiles) return [];

    const gradleCmd = (await this.fileExistsInWorkspace("gradlew")) ? "./gradlew" : "gradle";

    return [
      { name: "Gradle Build", command: `${gradleCmd} build`, type: "build" },
      { name: "Gradle Clean", command: `${gradleCmd} clean`, type: "build" },
      { name: "Gradle Test", command: `${gradleCmd} test`, type: "test" },
      { name: "Gradle Run", command: `${gradleCmd} run`, type: "build" }
    ];
  }

  async detectMaven(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasMaven();
    if (!hasFiles) return [];

    const mvnCmd = (await this.fileExistsInWorkspace("mvnw")) ? "./mvnw" : "mvn";

    return [
      { name: "Maven Build", command: `${mvnCmd} clean install`, type: "build" },
      { name: "Maven Package", command: `${mvnCmd} package`, type: "build" },
      { name: "Maven Test", command: `${mvnCmd} test`, type: "test" },
      { name: "Maven Clean", command: `${mvnCmd} clean`, type: "build" }
    ];
  }

  async detectCMake(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasCMake();
    if (!hasFiles) return [];

    return [
      { name: "CMake Configure", command: "cmake -B build", type: "build" },
      { name: "CMake Build", command: "cmake --build build", type: "build" },
      { name: "CMake Clean", command: "cmake --build build --target clean", type: "build" }
    ];
  }

  async detectGit(method: DetectionMethod): Promise<Action[]> {
    const hasFiles = await this.hasGit();
    if (!hasFiles) return [];

    return [
      { name: "Git Status", command: "git status", type: "git" },
      { name: "Git Pull", command: "git pull", type: "git" },
      { name: "Git Push", command: "git push", type: "git" },
      { name: "Git Fetch", command: "git fetch", type: "git" },
      { name: "Git Log", command: "git log --oneline -10", type: "git" }
    ];
  }

  /* ─── Main scanning entry point ─── */

  async scanEnhanced(
    options: DetectionOptions,
    method: DetectionMethod
  ): Promise<Action[]> {
    const actions: Action[] = [];

    if (options.docker) {
      actions.push(...(await this.detectDocker(method)));
    }

    if (options.dockerCompose) {
      actions.push(...(await this.detectDockerCompose(method)));
    }

    if (options.python) {
      actions.push(...(await this.detectPython(method)));
    }

    if (options.go) {
      actions.push(...(await this.detectGo(method)));
    }

    if (options.rust) {
      actions.push(...(await this.detectRust(method)));
    }

    if (options.make) {
      actions.push(...(await this.detectMake(method)));
    }

    if (options.gradle) {
      actions.push(...(await this.detectGradle(method)));
    }

    if (options.maven) {
      actions.push(...(await this.detectMaven(method)));
    }

    if (options.cmake) {
      actions.push(...(await this.detectCMake(method)));
    }

    if (options.git) {
      actions.push(...(await this.detectGit(method)));
    }

    return actions;
  }

  /* ─── Private helpers ─── */

  private async parseMakefileTargets(): Promise<string[]> {
    const root = this.getWorkspaceRoot();
    if (!root) return [];

    try {
      let makefileUri: vscode.Uri | undefined;

      if (await this.fileExistsInWorkspace("Makefile")) {
        makefileUri = vscode.Uri.joinPath(root, "Makefile");
      } else if (await this.fileExistsInWorkspace("makefile")) {
        makefileUri = vscode.Uri.joinPath(root, "makefile");
      } else if (await this.fileExistsInWorkspace("GNUmakefile")) {
        makefileUri = vscode.Uri.joinPath(root, "GNUmakefile");
      }

      if (!makefileUri) return [];

      const content = await this.readText(makefileUri);
      const lines = content.split("\n");
      const targets: string[] = [];

      for (const line of lines) {
        // Match target definitions (lines that start with word chars followed by :)
        const match = line.match(/^([a-zA-Z0-9_-]+):/);
        if (match) {
          const target = match[1];
          // Skip special targets and those starting with .
          if (!target.startsWith(".") && !target.startsWith("%")) {
            targets.push(target);
          }
        }
      }

      return targets;
    } catch {
      return [];
    }
  }
}
