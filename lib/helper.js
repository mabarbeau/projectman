const prompts = require('prompts');
const program = require('commander');
const didYouMean = require('didyoumean');
const term = require('terminal-kit').terminal;

const path = require('path');
const fs = require('fs');
const os = require('os');

// Default settings.
const settingsData = {
  commandToOpen: 'code',
  projects: [],
};

// Create settings.json if does not exist or just require it if it does exist
const settingsPath = path.join(os.homedir(), '.projectman', 'settings.json');

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
      JSON.stringify(settingsData, null, 4),
      'utf8',
    );
    settings = settingsData;
  }
}

function throwCreateIssueError(err) {
  term.red('>>> ').styleReset(
    'If you think it is my fault please create issue at https://github.com/saurabhdaware/projectman with below log',
  );
  term.red('>>> ').styleReset('Err:');
  term(err);
}

// Takes data as input and writes that data to settings.json
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
      throwCreateIssueError(err);
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

const suggestCommands = (cmd) => {
  const suggestion = didYouMean(
    cmd,
    // eslint-disable-next-line no-underscore-dangle
    program.commands.map((folder) => folder._name),
  );
  if (suggestion) {
    term(`Did you mean \`${suggestion}\`?`);
  }
};

const onCancel = () => {
  term.red("See ya ('__') /");
  process.exit();
  return false;
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
      },
    ],
    { onCancel },
  );

  return typeof script === 'string'
    ? { script, remainingArgs }
    : selectScript(project, args, script);
}

// Helper funcitions [END]

module.exports = {
  settings,
  writeSettings,
  isURL,
  suggestCommands,
  onCancel,
  getChoices,
  selectProject,
  selectScript,
};
