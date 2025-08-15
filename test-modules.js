// 测试模块功能的脚本
// 在浏览器控制台中运行

// 清除现有数据
localStorage.removeItem('todo_projects');
localStorage.removeItem('todo_items');

// 添加测试项目
const testProjects = [
  {
    id: '1',
    name: 'Frontend Development',
    description: 'React and Next.js development tasks',
    module: 'Frontend',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Backend API',
    description: 'Node.js and Express API development',
    module: 'Backend',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Database Design',
    description: 'Database schema and migration tasks',
    module: 'Database',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Testing',
    description: 'Unit and integration testing',
    module: 'Testing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Documentation',
    description: 'Project documentation and guides',
    module: 'Other',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 添加测试任务
const testItems = [
  {
    id: '1',
    title: 'Create React components',
    description: 'Build reusable React components for the UI',
    type: 'Feature',
    status: 'Not start',
    projectId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Setup API routes',
    description: 'Create Express.js API routes',
    type: 'Feature',
    status: 'On progress',
    projectId: '2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Design database schema',
    description: 'Create database tables and relationships',
    type: 'Feature',
    status: 'Completed',
    projectId: '3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 保存到localStorage
localStorage.setItem('todo_projects', JSON.stringify(testProjects));
localStorage.setItem('todo_items', JSON.stringify(testItems));

console.log('Test data added successfully!');
console.log('Projects:', testProjects);
console.log('Items:', testItems);

// 刷新页面以查看效果
// window.location.reload(); 

// 测试新的数据模式识别
const testNewDataPatterns = () => {
  console.log('\n=== 测试新的数据模式识别 ===');

  const testCases = [
    {
      description: "1.re-gen topic",
      expected: { type: 'Feature', module: 'Content Management' }
    },
    {
      description: "2.compliance matrix query / edit",
      expected: { type: 'Feature', module: 'Compliance' }
    },
    {
      description: "3.valid option now has a showSendBtn boolean",
      expected: { type: 'Feature', module: 'Configuration' }
    },
    {
      description: "4.data source view only",
      expected: { type: 'Feature', module: 'Data Source' }
    },
    {
      description: "5.user management view only view for non-CMP user",
      expected: { type: 'Feature', module: 'User Management' }
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n测试用例 ${index + 1}: ${testCase.description}`);
    console.log(`期望结果: ${testCase.expected.type} - ${testCase.expected.module}`);

    // 这里可以添加实际的分类逻辑测试
    // 由于这是静态测试文件，我们只显示期望结果
    console.log(`✓ 测试用例 ${index + 1} 已配置`);
  });
};

// 运行测试
testNewDataPatterns(); 