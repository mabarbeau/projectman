// external dependencies
const prompts = require('prompts');
const S = require('string');

// internal modules
const path = require('path');
const { spawn } = require('child_process');
const term = require('terminal-kit').terminal;

const {
  settings,
  writeSettings,
  isURL,
  onCancel,
  selectProject,
  selectScript,
} = require('./helper.js');

async function addProject(projectDirectory = '.', cmdObj = undefined) {
  const newProject = {};
  let name;
  let enteredUrl;

  if (cmdObj.url) {
    if (projectDirectory !== '.') {
      term.yellow(
        "Project's local directory value will be ignore when --url flag is on",
      );
    }

    if (cmdObj.url === true) {
      ({ enteredUrl } = await prompts(
        [
          {
            type: 'text',
            message: 'Project URL :',
            name: 'enteredUrl',
            initial: 'https://github.com/',
            validate: (url) => (isURL(url) ? true : 'Not a valid URL'),
          },
        ],
        { onCancel },
      ));
      name = enteredUrl.split('/').pop(); // Get last route of URL to set default name
      newProject.path = enteredUrl;
    } else {
      if (!isURL(cmdObj.url)) {
        term.red('>>> ').styleReset('Not a valid URL');
        term.yellow('>>> ').styleReset(
          `A valid URL looks something like ${term.str.yellow('https://github.com/saurabhdaware/projectman')}`,
        );
        return false;
      }
      name = cmdObj.url.split('/').pop(); // Get last route of URL to set default name
      newProject.path = cmdObj.url;
    }
  } else {
    newProject.path = path.resolve(projectDirectory);
    name = newProject.path.split(path.sep).pop();
  }

  ({ finalName: newProject.name } = await prompts(
    [
      {
        type: 'text',
        message: 'Project Name :',
        name: 'finalName',
        initial: name,
      },
    ],
    { onCancel },
  ));

  if (
    settings.projects.some(
      (project) => project.name.toLowerCase() === newProject.name.toLowerCase(),
    )
  ) {
    term.red('>>> ').styleReset('Project with this name already exists');
    return false;
  }

  settings.projects.push(newProject);

  writeSettings(settings, 'add', 'Project Added');

  return newProject;
}

async function removeProject(projectName) {
  const { name: selectedProjectName } = await selectProject(
    projectName,
    'remove',
  );

  if (!selectedProjectName) {
    term.red('>>> ').styleReset(
      `Project with name ${selectedProjectName} does not exist. Try ${term.str.yellow(
        'pm remove',
      )} and select the project you want to remove`,
    );
    return;
  }
  // removing project
  settings.projects = settings.projects.filter(
    (project) => project.name.toLowerCase() !== selectedProjectName.toLowerCase(),
  );

  writeSettings(settings, 'remove', 'Project Removed');
}

function template(tpl, args) {
  return S(tpl).template({ '@': args.join(' '), ...args }, '${', '}').s;
}

async function runProjectCommands() {
  const [, , projectName, scriptRaw, ...args] = process.argv;

  const selectedProject = await selectProject(projectName);
  if (!selectedProject) return false;

  const { script, remainingArgs } = await selectScript(selectedProject, [
    scriptRaw,
    ...args,
  ]);
  if (!script) return false;

  remainingArgs.unshift(selectedProject.path);

  const temp = `source ~/.projectman/index.bash; ${template(script, remainingArgs)}`;

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

module.exports = {
  addProject,
  removeProject,
  runProjectCommands,
};
