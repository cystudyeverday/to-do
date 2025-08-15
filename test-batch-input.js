// 测试批量输入功能
console.log('=== 测试批量输入功能 ===\n');

// 模拟批量输入解析函数
const parseBatchInput = (input) => {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // 移除数字编号和点号 (如 "1.", "2.", "3." 等)
      return line.replace(/^\d+\.\s*/, '');
    });
};

// 模拟模块分类函数
const classifyModule = (text) => {
  const lowerText = text.toLowerCase();

  const moduleKeywords = {
    'Compliance': ['compliance', 'matrix', 'query', 'edit', 'regulation', 'policy', 'standard', 'audit', 'validation', 'certification', 'governance', 'risk', 'control'],
    'User Management': ['user', 'management', 'role', 'permission', 'access', 'control', 'rbac', 'user management', 'user admin', 'user profile', 'user settings', 'user account', 'non-cmp', 'cmp'],
    'Data Source': ['data source', 'datasource', 'data management', 'data view', 'view only', 'data access', 'data control', 'data restriction', 'data permission'],
    'Configuration': ['config', 'configuration', 'option', 'valid option', 'showSendBtn', 'boolean', 'property', 'setting', 'parameter', 'flag', 'toggle', 'switch'],
    'Content Management': ['content', 'topic', 're-gen', 'regeneration', 'content management', 'content generation', 'topic generation', 'content update', 'content refresh'],
    'Frontend': ['ui', 'ux', 'interface', 'user', 'client', 'browser', 'react', 'vue', 'angular', 'component', 'page', 'screen', 'view', 'layout', 'design', 'css', 'html', 'javascript', 'typescript', 'frontend', 'client-side'],
    'Backend': ['api', 'server', 'backend', 'service', 'controller', 'route', 'endpoint', 'database', 'model', 'schema', 'query', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'node', 'express', 'python', 'java', 'php'],
    'Database': ['database', 'db', 'table', 'schema', 'migration', 'query', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'redis', 'index', 'constraint', 'foreign key', 'primary key', 'relationship'],
    'Testing': ['test', 'testing', 'unit', 'integration', 'e2e', 'end-to-end', 'spec', 'jest', 'mocha', 'cypress', 'selenium', 'coverage', 'mock', 'stub', 'fixture'],
    'Security': ['security', 'auth', 'authentication', 'authorization', 'login', 'logout', 'password', 'token', 'jwt', 'oauth', 'encryption', 'hash', 'bcrypt', 'ssl', 'https', 'vulnerability', 'xss', 'csrf', 'sql injection'],
    'DevOps': ['deploy', 'deployment', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'server', 'infrastructure', 'monitoring', 'logging', 'alert', 'backup', 'restore'],
    'UI/UX': ['ui', 'ux', 'design', 'user experience', 'interface', 'wireframe', 'prototype', 'mockup', 'user flow', 'interaction', 'usability', 'accessibility', 'responsive', 'mobile', 'desktop']
  };

  for (const [moduleName, keywords] of Object.entries(moduleKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return moduleName;
      }
    }
  }

  return 'Other';
};

// 测试用例
const testInput = `1.re-gen topic
2.compliance matrix query / edit
3.valid option now has a showSendBtn boolean
data source view only
4.user management view only view for non-CMP user`;

console.log('输入文本:');
console.log(testInput);
console.log('\n解析结果:');

const parsedTasks = parseBatchInput(testInput);
console.log(`总共解析出 ${parsedTasks.length} 个任务:\n`);

parsedTasks.forEach((task, index) => {
  const module = classifyModule(task);
  console.log(`${index + 1}. "${task}"`);
  console.log(`   模块: ${module}`);
  console.log('');
});

// 测试不同的输入格式
console.log('=== 测试不同输入格式 ===\n');

const testCases = [
  {
    name: '带编号的列表',
    input: `1. 第一个任务
2. 第二个任务
3. 第三个任务`
  },
  {
    name: '不带编号的列表',
    input: `第一个任务
第二个任务
第三个任务`
  },
  {
    name: '混合格式',
    input: `1. 带编号的任务
不带编号的任务
3. 另一个带编号的任务`
  },
  {
    name: '空行和空格',
    input: `1. 第一个任务

2. 第二个任务
   
3. 第三个任务`
  }
];

testCases.forEach(testCase => {
  console.log(`测试: ${testCase.name}`);
  console.log('输入:');
  console.log(testCase.input);

  const result = parseBatchInput(testCase.input);
  console.log(`结果: ${result.length} 个任务`);
  result.forEach((task, index) => {
    console.log(`  ${index + 1}. "${task}"`);
  });
  console.log('');
});

console.log('=== 测试完成 ==='); 