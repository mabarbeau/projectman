export default {
  options: {
    '--grep': {
      alias: '-d',
      // eslint-disable-next-line no-template-curly-in-string
      command: '${0} | grep ${1}',
    },
  },
  scripts: {
    code: 'code .',
    open: 'finder .',
  },
  projects: [],
};
