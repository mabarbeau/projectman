import fs from "fs";
import os from "os";
import path from "path";
import figlet from "figlet";
import program from "commander";
import { terminal as term} from "terminal-kit";
import S from "string";
import prompts from 'prompts';
import { spawn } from "child_process";

interface SettingsData {
  projects: any[];
  scripts: any;
}

export default class App {
  protected settingsPath: string
  protected settings: SettingsData
  suggestFilter = (input: string, choices: any[]) => Promise.resolve(
    choices.filter((choice: { title: string; }) => choice.title.toLowerCase().includes(input.toLowerCase())),
  );
  onCancel = () => {
    term.red("See ya ('__') /");
    process.exit();
  };
  isURL = (str: string) => {
    return !/(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-/]))?/.test(str)
  }
  
  constructor({ settingsPath, setting }: { setting: SettingsData, settingsPath: any }) {
    this.settings = setting;
    this.settingsPath = settingsPath;
    try {
      if (!fs.existsSync(this.settingsPath)) {
        this.init(this.settings);
      } else {
        this.settings = require(settingsPath);
      }
      this.boot();
    } catch (err) {
      this.error(err);
    }
  }

  init(setting: SettingsData) {
    term(
      `${figlet.textSync("  Initialized", {
        horizontalLayout: "default",
        font: "JS Block Letters",
      })}\n\n`
    );
    term('    Add project with `pm add`');
    const settingsDir = path.join(os.homedir(), '.playbook');
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir);
    }
    fs.writeFileSync(
      this.settingsPath,
      `module.exports = ${JSON.stringify(setting, null, 4)}`,
      "utf8"
    );
  }

  boot() {
    if (process.env.npm_package_version) {
      program.version(process.env.npm_package_version);
    }

    program
      .command('add [projectDirectory]')
      .alias('save')
      .option('-u, --url [link]', 'Add a link to a repository to projects')
      .description('Save current directory as a project')
      .action(this.addProject);

    program
      .command('remove [projectName]')
      .description('Remove the project')
      .action(this.removeProject);

    program.action(async () => {
      if (!(await this.runProjectCommands())) {
        program.outputHelp();
      }
    });

    program.usage('<command>');

    if (process.argv.length <= 2) {
      this.runProjectCommands();
    }

    program.parse(process.argv);
  }

  async run() {
    const [, , projectName, scriptRaw, ...args] = process.argv;

    const selectedProject = await this.selectProject(projectName);
    if (!selectedProject) return false;

    const { script, remainingArgs } = await this.selectScript(selectedProject, [
      scriptRaw,
      ...args,
    ]);
    if (!script) return false;

    remainingArgs.unshift(selectedProject.path);

    const temp = `source ~/.playbook/index.bash; ${this.template(
      script,
      remainingArgs
    )}`;

    term("\n[")
      .bold.white(process.env.USER)
      .styleReset(":")
      .red(selectedProject.path)
      .styleReset(`]$ ${temp}`);

    return spawn(temp, [], {
      cwd: selectedProject.path,
      stdio: ["inherit", "inherit", "inherit"],
      shell: true,
    });
  }

  template(tpl: string, args: string[]) {
    return S(tpl).template({ '@': args.join(' '), ...args }, '${', '}').s;
  }

  error(err: any) {
    if (err.code === 'EACCES') {
      term.red('>>> ').styleReset('Access Denied!');
    } else {
      term
        .red('>>> ')
        .styleReset(
          'If you think it is my fault please create issue at https://github.com/saurabhdaware/projectman with below log\n',
        );
    }
    term.red('>>> ').styleReset('Err:');
    process.exit();
  }

  async selectProject(projectName: string, customFilter = () => true) {
    let selectedProject;
    if (!projectName) {
      // Ask which project he wants to open
      ({ selectedProject } = await prompts(
        [
          {
            type: "autocomplete",
            message: "Select project:",
            name: "selectedProject",
            choices: this.getChoices(customFilter),
            limit: 40,
            suggest: this.suggestFilter,
          },
        ],
        { onCancel: this.onCancel }
      )); // Redirecting to stderr in order for it to be used with command substitution
    } else {
      // If project name is mentioned then open directly
      selectedProject = this.settings.projects.find(
        (project: { name: string; }) => project.name.toLowerCase() === projectName.toLowerCase(),
      );
    }
    return selectedProject;
  }

  getChoices(customFilter = () => true) {
    return [...this.settings.projects].filter(customFilter).map((project) => ({
      title: project.name,
      value: project,
      description: project.path || undefined,
    }));
  }

  async selectScript(
    project: { scripts: any; name: any; },
    args: string[] | [any, ...any[]],
    scripts = {
      ...('scripts' in this.settings ? this.settings.scripts : {}),
      ...('scripts' in project ? project.scripts : {}),
    },
  ) : Promise<{ script: any, remainingArgs: any }> {
    const [arg, ...remainingArgs] = args;
    if (arg in scripts) {
      return typeof scripts[arg] === 'string'
        ? { script: scripts[arg], remainingArgs }
        : this.selectScript(project, remainingArgs, scripts[arg]);
    }
    // const { script } = await prompts(
    //   [
    //     {
    //       type: "autocomplete",
    //       message: `Select script to run for ${project.name}:`,
    //       name: "script",
    //       choices: Object.entries(scripts).map(([title, value]) => ({
    //         title,
    //         value,
    //         description:
    //           typeof value === "object" && value
    //             ? `Select from: [${Object.keys(value).join(", ")}]`
    //             : value,
    //       })),
    //       limit: 40,
    //       suggest: this.suggestFilter,
    //     },
    //   ],
    //   { onCancel: this.onCancel }
    // );
    const script = '';
    return typeof script === "string"
      ? { script, remainingArgs }
      : this.selectScript(project, args, script);
  }

  async addProject(projectDirectory = '.', cmdObj = undefined) {
    // const newProject = {};
    // let name;
    // let enteredUrl;

    // if (cmdObj.url) {
    //   if (projectDirectory !== '.') {
    //     term.yellow(
    //       "Project's local directory value will be ignore when --url flag is on",
    //     );
    //   }

    //   if (cmdObj.url === true) {
    //     ({ enteredUrl } = await prompts(
    //       [
    //         {
    //           type: 'text',
    //           message: 'Project URL :',
    //           name: 'enteredUrl',
    //           initial: 'https://github.com/',
    //           validate: (url: any) => (this.isURL(url) ? true : 'Not a valid URL'),
    //         },
    //       ],
    //       { onCancel },
    //     ));
    //     name = enteredUrl.split('/').pop(); // Get last route of URL to set default name
    //     newProject.path = enteredUrl;
    //   } else {
    //     if (!this.isURL(cmdObj.url)) {
    //       term.red('>>> ').styleReset('Not a valid URL');
    //       term.yellow('>>> ').styleReset(
    //         `A valid URL looks something like ${term.str.yellow('https://github.com/saurabhdaware/projectman')}`,
    //       );
    //       return false;
    //     }
    //     name = cmdObj.url.split('/').pop(); // Get last route of URL to set default name
    //     newProject.path = cmdObj.url;
    //   }
    // } else {
    //   newProject.path = path.resolve(projectDirectory);
    //   name = newProject.path.split(path.sep).pop();
    // }

    // ({ finalName: newProject.name } = await prompts(
    //   [
    //     {
    //       type: 'text',
    //       message: 'Project Name :',
    //       name: 'finalName',
    //       initial: name,
    //     },
    //   ],
    //   { onCancel },
    // ));

    // if (
    //   this.settings.projects.some(
    //     (project) =>
    //       project.name.toLowerCase() === newProject.name.toLowerCase()
    //   )
    // ) {
    //   term.red(">>> ").styleReset("Project with this name already exists");
    //   return false;
    // }

    // this.settings.projects.push(newProject);

    // this.writeSettings(this.settings, "add", "Project Added");

    // return newProject;
  }

  async removeProject(projectName: string) {
    const { name: selectedProjectName } = await this.selectProject(projectName);

    if (!selectedProjectName) {
      term.red('>>> ').styleReset(
        `Project with name ${selectedProjectName} does not exist. Try ${term.str.yellow(
          'pm remove',
        )} and select the project you want to remove`,
      );
      return;
    }
    // removing project
    this.settings.projects = this.settings.projects.filter(
      (project) => project.name.toLowerCase() !== selectedProjectName.toLowerCase(),
    );

    this.writeSettings(this.settings, 'remove', 'Project Removed');
  }

  writeSettings(
    data: any,
    command = '<command>',
    successMessage = 'Settings updated :D !',
  ) {
    fs.writeFile(
      this.settingsPath,
      `module.exports = ${JSON.stringify(data, null, 4)}`,
      (err: any) => {
        if (err) {
          if (err.code === 'EACCES') {
            const errCmd = process.platform === 'win32'
              ? 'an admin'
              : `a super user ${term.str.yellow(`sudo pm ${command}`)}`;
            term
              .red('>>> ')
              .styleReset(`Access Denied! please try again as ${errCmd}`);
            return;
          }
          term
            .red('>>> ')
            .styleReset(
              'If you think it is my fault please create issue at https://github.com/saurabhdaware/projectman with below log',
            );
          term.red('>>> ').styleReset('Err:');
          term(err);
          return;
        }
        term.green('>>> ').styleReset(successMessage).green(' ✔');
      },
    );
  }
  async runProjectCommands() {
    const [, , projectName, scriptRaw, ...args] = process.argv;

    const selectedProject = await this.selectProject(projectName);
    if (!selectedProject) return false;

    const { script, remainingArgs } = await this.selectScript(selectedProject, [
      scriptRaw,
      ...args,
    ]);
    if (!script) return false;

    remainingArgs.unshift(selectedProject.path);

    const temp = `source ~/.playbook/index.bash; ${this.template(
      script,
      remainingArgs
    )}`;

    term('\n[')
      .bold.white(process.env.USER)
      .styleReset(':')
      .red(selectedProject.path)
      .styleReset(`]$ ${temp}`);

    return spawn(temp, [], {
      cwd: selectedProject.path,
      stdio: ['inherit', 'inherit', 'inherit'],
      shell: true,
    });
  }
}
