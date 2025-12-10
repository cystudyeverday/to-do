import { StorageManager } from './storage';

export async function initializeSampleData() {
  // 检查是否已经有数据
  const existingProjects = await StorageManager.getProjects();
  const existingItems = await StorageManager.getItems();

  if (existingProjects.length > 0 || existingItems.length > 0) {
    return; // 已经有数据，不重复初始化
  }

  // 创建示例项目
  const project1 = await StorageManager.addProject({
    name: '电商平台开发',
    description: '开发一个完整的电商平台，包含用户管理、商品管理、订单系统等功能'
  });

  const project2 = await StorageManager.addProject({
    name: '移动端APP',
    description: '开发iOS和Android移动端应用，提供核心功能'
  });

  const project3 = await StorageManager.addProject({
    name: '后台管理系统',
    description: '为电商平台开发后台管理系统，包含数据统计、用户管理等功能'
  });

  // 为电商平台项目添加任务
  await StorageManager.addItem({
    title: '电商平台 - 用户注册登录',
    description: '完成用户注册和登录功能，包括邮箱验证、密码重置等',
    type: 'Feature',
    status: 'Completed',
    projectId: project1.id,
    module: 'User Management'
  });

  await StorageManager.addItem({
    title: '电商平台 - 商品列表页面',
    description: '开发商品展示页面，支持分类筛选、搜索、分页等功能',
    type: 'Feature',
    status: 'On progress',
    projectId: project1.id,
    module: 'Frontend'
  });

  await StorageManager.addItem({
    title: '电商平台 - 购物车功能',
    description: '实现购物车功能，支持添加商品、修改数量、删除商品',
    type: 'Feature',
    status: 'On progress',
    projectId: project1.id,
    module: 'Frontend'
  });

  await StorageManager.addItem({
    title: '电商平台 - 支付接口集成',
    description: '集成第三方支付接口，支持支付宝、微信支付',
    type: 'Feature',
    status: 'Pending',
    projectId: project1.id,
    module: 'Backend'
  });

  await StorageManager.addItem({
    title: '电商平台 - 修复登录页面样式问题',
    description: '修复登录页面在移动端的显示问题，优化用户体验',
    type: 'Issue',
    status: 'On progress',
    projectId: project1.id,
    module: 'Frontend'
  });

  // 为移动端APP项目添加任务
  await StorageManager.addItem({
    title: '移动端APP - 首页设计',
    description: '设计并开发APP首页，包含轮播图、推荐商品、分类导航',
    type: 'Feature',
    status: 'Completed',
    projectId: project2.id,
    module: 'UI/UX'
  });

  await StorageManager.addItem({
    title: '移动端APP - 商品详情页',
    description: '开发商品详情页面，展示商品信息、规格选择、购买按钮',
    type: 'Feature',
    status: 'On progress',
    projectId: project2.id,
    module: 'Frontend'
  });

  await StorageManager.addItem({
    title: '移动端APP - 个人中心',
    description: '实现个人中心功能，包含用户信息、订单历史、设置等',
    type: 'Feature',
    status: 'Not start',
    projectId: project2.id,
    module: 'Frontend'
  });

  await StorageManager.addItem({
    title: '移动端APP - 修复推送通知问题',
    description: '修复推送通知在某些设备上无法正常显示的问题',
    type: 'Issue',
    status: 'On progress',
    projectId: project2.id,
    module: 'Backend'
  });

  // 为后台管理系统项目添加任务
  await StorageManager.addItem({
    title: '后台管理系统 - 数据统计面板',
    description: '开发数据统计面板，展示销售数据、用户增长、商品分析等',
    type: 'Feature',
    status: 'On progress',
    projectId: project3.id,
    module: 'Dashboard'
  });

  await StorageManager.addItem({
    title: '后台管理系统 - 用户管理模块',
    description: '实现用户管理功能，支持查看、编辑、删除用户信息',
    type: 'Feature',
    status: 'Completed',
    projectId: project3.id,
    module: 'User Management'
  });

  await StorageManager.addItem({
    title: '后台管理系统 - 商品管理',
    description: '开发商品管理功能，支持添加、编辑、下架商品',
    type: 'Feature',
    status: 'On progress',
    projectId: project3.id,
    module: 'Content Management'
  });

  await StorageManager.addItem({
    title: '后台管理系统 - 权限控制',
    description: '实现基于角色的权限控制系统，确保数据安全',
    type: 'Feature',
    status: 'Not start',
    projectId: project3.id,
    module: 'Security'
  });

  await StorageManager.addItem({
    title: '后台管理系统 - 修复数据导出功能',
    description: '修复数据导出功能在某些浏览器上的兼容性问题',
    type: 'Issue',
    status: 'On progress',
    projectId: project3.id,
    module: 'Backend'
  });

  console.log('示例数据初始化完成');
} 