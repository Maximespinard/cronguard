export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'api', 'shared', 'ci', 'deps', 'root']],
  },
};
