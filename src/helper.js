const prompts = require('prompts');
const term = require('terminal-kit').terminal;

const path = require('path');
const fs = require('fs');
const os = require('os');

const settingsData = {
  options: {
    '--grep': {
      alias: '-d',
      // eslint-disable-next-line no-template-curly-in-string
      command: '${0} | grep ${1}',
    },
  },
  scripts: {
    code: 'code .',
  },
  projects: [],
};

// Create settings.json if does not exist or just require it if it does exist
const settingsPath = path.join(os.homedir(), '.projectman', 'settings.js');

let settings;
try {
  // eslint-disable-next-line
  settings = require(settingsPath);
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    const settingsDir = path.join(os.homedir(), '.projectman');
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir);
    }
    fs.writeFileSync(
      settingsPath,
      `module.exports = ${JSON.stringify(settingsData, null, 4)}`,
      'utf8',
    );
    settings = settingsData;
  }
}

// Takes data as input and writes that data to settings.js
function writeSettings(
  data,
  command = '<command>',
  successMessage = 'Settings updated :D !',
) {
  fs.writeFile(settingsPath, JSON.stringify(data, null, 4), (err) => {
    if (err) {
      if (err.code === 'EACCES') {
        const errCmd = process.platform === 'win32'
          ? 'an admin'
          : `a super user ${term.str.yellow(`sudo pm ${command}`)}`;
        term.red('>>> ').styleReset(`Access Denied! please try again as ${errCmd}`);
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
  });
}

function isURL(str) {
  const regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
  if (!regex.test(str)) {
    return false;
  }
  return true;
}

const suggestFilter = (input, choices) => Promise.resolve(
  choices.filter((choice) => choice.title.toLowerCase().includes(input.toLowerCase())),
);

const onCancel = () => {
  term.red("See ya ('__') /");
  process.exit();
};

function getChoices(customFilter = () => true) {
  return [...settings.projects].filter(customFilter).map((project) => ({
    title: project.name,
    value: project,
    description: project.path || undefined,
  }));
}

async function selectProject(projectName, action, customFilter = () => true) {
  let selectedProject;
  if (!projectName) {
    // Ask which project he wants to open
    ({ selectedProject } = await prompts(
      [
        {
          type: 'autocomplete',
          message: 'Select project:',
          name: 'selectedProject',
          choices: getChoices(customFilter),
          limit: 40,
          suggest: suggestFilter,
        },
      ],
      { onCancel },
    )); // Redirecting to stderr in order for it to be used with command substitution
  } else {
    // If project name is mentioned then open directly
    selectedProject = settings.projects.find(
      (project) => project.name.toLowerCase() === projectName.toLowerCase(),
    );
  }
  return selectedProject;
}

async function selectScript(
  project,
  args,
  scripts = {
    ...('scripts' in settings ? settings.scripts : {}),
    ...('scripts' in project ? project.scripts : {}),
  },
) {
  const [arg, ...remainingArgs] = args;
  if (arg in scripts) {
    return typeof scripts[arg] === 'string'
      ? { script: scripts[arg], remainingArgs }
      : selectScript(project, remainingArgs, scripts[arg]);
  }
  const { script } = await prompts(
    [
      {
        type: 'autocomplete',
        message: `Select script to run for ${project.name}:`,
        name: 'script',
        choices: Object.entries(scripts).map(([title, value]) => ({
          title,
          value,
          description:
            typeof value === 'object'
              ? `Select from: [${Object.keys(value).join(', ')}]`
              : value,
        })),
        limit: 40,
        suggest: suggestFilter,
      },
    ],
    { onCancel },
  );

  return typeof script === 'string'
    ? { script, remainingArgs }
    : selectScript(project, args, script);
}

module.exports = {
  settings,
  writeSettings,
  isURL,
  onCancel,
  getChoices,
  selectProject,
  selectScript,
};
