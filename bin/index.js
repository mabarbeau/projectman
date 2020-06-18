#!/usr/bin/env node

const program = require('commander');
const action = require('../lib/action');

program.version(require('../package.json').version);

program
  .command('add [projectDirectory]')
  .alias('save')
  .option('-u, --url [link]', 'Add a link to a repository to projects')
  .description('Save current directory as a project')
  .action(action.addProject);

program
  .command('remove [projectName]')
  .description('Remove the project')
  .action(action.removeProject);

program
  .command('getpath [projectName]')
  .alias('gp')
  .description('Get project path')
  .action(action.getProjectPath);

program.action(async () => {
  if (!(await action.runProjectCommands())) {
    program.outputHelp();
  }
});

program.usage('<command>');

if (process.argv.length <= 2) {
  action.runProjectCommands();
}

program.parse(process.argv);
