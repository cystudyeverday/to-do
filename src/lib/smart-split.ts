import { TodoItem, ItemType, ItemStatus } from '@/types';

export interface SplitResult {
  title: string;
  description: string;
  type: ItemType;
  module: string;
  summary: string;
  status: 'Not start' | 'On progress' | 'Waiting for API' | 'Build UI' | 'Integration' | 'Completed' | 'Fix';
}

export class SmartSplitter {
  // 英文动作关键词
  private static actionKeywords = [
    'implement', 'create', 'add', 'build', 'develop', 'design', 'update', 'modify', 'change', 'fix', 'resolve',
    'remove', 'delete', 'rename', 'replace', 'integrate', 'connect', 'configure', 'set', 'enable', 'disable',
    'show', 'display', 'hide', 'navigate', 'redirect', 'link', 'button', 'click', 'select', 'choose',
    'confirm', 'verify', 'check', 'validate', 'test', 'debug', 'investigate', 'analyze', 'review',
    'improve', 'optimize', 'enhance', 'upgrade', 'migrate', 'deploy', 'install', 'setup', 'configure',
    'add', 'insert', 'append', 'attach', 'include', 'incorporate', 'merge', 'combine', 'unify',
    'standardize', 'normalize', 'format', 'structure', 'organize', 'arrange', 'sort', 'filter',
    'search', 'find', 'locate', 'identify', 'detect', 'monitor', 'track', 'log', 'record', 'save',
    'export', 'import', 'download', 'upload', 'sync', 'backup', 'restore', 'recover', 'reset',
    'initialize', 'start', 'stop', 'pause', 'resume', 'cancel', 'abort', 'terminate', 'close',
    'open', 'launch', 'execute', 'run', 'perform', 'execute', 'process', 'handle', 'manage',
    'control', 'operate', 'maintain', 'support', 'assist', 'help', 'guide', 'tutorial', 'document'
  ];

  // 英文功能关键词
  private static featureKeywords = [
    'feature', 'function', 'functionality', 'capability', 'component', 'module', 'system', 'service',
    'interface', 'api', 'endpoint', 'dashboard', 'view', 'page', 'screen', 'panel', 'widget',
    'chart', 'graph', 'visualization', 'report', 'summary', 'overview', 'statistics', 'analytics',
    'monitoring', 'tracking', 'logging', 'notification', 'alert', 'warning', 'message', 'popup',
    'modal', 'dialog', 'form', 'input', 'field', 'button', 'link', 'menu', 'navigation', 'sidebar',
    'header', 'footer', 'toolbar', 'ribbon', 'tab', 'accordion', 'dropdown', 'select', 'checkbox',
    'radio', 'slider', 'progress', 'loading', 'spinner', 'indicator', 'badge', 'label', 'tooltip',
    'help', 'guide', 'tutorial', 'documentation', 'manual', 'faq', 'support', 'contact', 'feedback',
    'rating', 'review', 'comment', 'note', 'annotation', 'bookmark', 'favorite', 'share', 'export',
    'import', 'sync', 'backup', 'restore', 'settings', 'configuration', 'preferences', 'profile',
    'account', 'user', 'role', 'permission', 'security', 'authentication', 'authorization', 'login',
    'logout', 'register', 'signup', 'password', 'token', 'session', 'cookie', 'cache', 'storage',
    'database', 'table', 'record', 'entry', 'item', 'object', 'entity', 'model', 'schema', 'structure',
    'compliance', 'matrix', 'query', 'edit', 'regulation', 'policy', 'standard', 'audit', 'validation',
    'certification', 'governance', 'risk', 'control', 're-gen', 'regeneration', 'topic', 'content',
    'valid option', 'showSendBtn', 'boolean', 'property', 'setting', 'parameter', 'flag', 'toggle',
    'switch', 'data source', 'datasource', 'data management', 'data view', 'view only', 'data access',
    'data control', 'data restriction', 'data permission', 'user management', 'user admin', 'user profile',
    'user settings', 'user account', 'non-cmp', 'cmp', 'rbac', 'role-based', 'access control'
  ];

  // 英文问题关键词
  private static issueKeywords = [
    'bug', 'error', 'issue', 'problem', 'defect', 'fault', 'failure', 'crash', 'hang', 'freeze',
    'slow', 'performance', 'lag', 'delay', 'timeout', 'deadlock', 'race', 'conflict', 'collision',
    'duplicate', 'inconsistent', 'invalid', 'incorrect', 'wrong', 'missing', 'empty', 'null', 'undefined',
    'exception', 'exception', 'throw', 'catch', 'handle', 'recover', 'fallback', 'alternative',
    'workaround', 'fix', 'patch', 'hotfix', 'update', 'upgrade', 'migration', 'compatibility',
    'deprecated', 'obsolete', 'legacy', 'old', 'outdated', 'broken', 'damaged', 'corrupted',
    'unstable', 'unreliable', 'insecure', 'vulnerable', 'exposed', 'leak', 'overflow', 'underflow',
    'memory', 'cpu', 'disk', 'network', 'bandwidth', 'latency', 'throughput', 'capacity', 'limit',
    'quota', 'threshold', 'boundary', 'constraint', 'restriction', 'block', 'prevent', 'deny',
    'reject', 'invalid', 'unauthorized', 'forbidden', 'not found', 'missing', 'absent', 'gone',
    'deleted', 'removed', 'archived', 'hidden', 'private', 'confidential', 'sensitive', 'secret'
  ];

  // 英文优先级关键词
  private static priorityKeywords = [
    'urgent', 'critical', 'high', 'medium', 'low', 'priority', 'important', 'essential', 'required',
    'mandatory', 'necessary', 'vital', 'crucial', 'key', 'major', 'minor', 'trivial', 'nice to have',
    'optional', 'recommended', 'suggested', 'proposed', 'planned', 'scheduled', 'timeline', 'deadline',
    'milestone', 'deliverable', 'release', 'version', 'iteration', 'sprint', 'phase', 'stage',
    'blocker', 'showstopper', 'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'severe', 'moderate', 'light'
  ];

  // 模块分类关键词
  private static moduleKeywords = {
    'Frontend': ['ui', 'ux', 'interface', 'user', 'client', 'browser', 'react', 'vue', 'angular', 'component', 'page', 'screen', 'view', 'layout', 'design', 'css', 'html', 'javascript', 'typescript', 'frontend', 'client-side'],
    'Backend': ['api', 'server', 'backend', 'service', 'controller', 'route', 'endpoint', 'database', 'model', 'schema', 'query', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'node', 'express', 'python', 'java', 'php'],
    'Database': ['database', 'db', 'table', 'schema', 'migration', 'query', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'redis', 'index', 'constraint', 'foreign key', 'primary key', 'relationship'],
    'Testing': ['test', 'testing', 'unit', 'integration', 'e2e', 'end-to-end', 'spec', 'jest', 'mocha', 'cypress', 'selenium', 'coverage', 'mock', 'stub', 'fixture'],
    'Security': ['security', 'auth', 'authentication', 'authorization', 'login', 'logout', 'password', 'token', 'jwt', 'oauth', 'encryption', 'hash', 'bcrypt', 'ssl', 'https', 'vulnerability', 'xss', 'csrf', 'sql injection'],
    'DevOps': ['deploy', 'deployment', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'server', 'infrastructure', 'monitoring', 'logging', 'alert', 'backup', 'restore'],
    'UI/UX': ['ui', 'ux', 'design', 'user experience', 'interface', 'wireframe', 'prototype', 'mockup', 'user flow', 'interaction', 'usability', 'accessibility', 'responsive', 'mobile', 'desktop'],
    'Compliance': ['compliance', 'matrix', 'query', 'edit', 'regulation', 'policy', 'standard', 'audit', 'validation', 'certification', 'governance', 'risk', 'control'],
    'User Management': ['user', 'management', 'role', 'permission', 'access', 'control', 'rbac', 'user management', 'user admin', 'user profile', 'user settings', 'user account', 'non-cmp', 'cmp'],
    'Data Source': ['data source', 'datasource', 'data management', 'data view', 'view only', 'data access', 'data control', 'data restriction', 'data permission'],
    'Configuration': ['config', 'configuration', 'option', 'valid option', 'showSendBtn', 'boolean', 'property', 'setting', 'parameter', 'flag', 'toggle', 'switch'],
    'Content Management': ['content', 'topic', 're-gen', 'regeneration', 'content management', 'content generation', 'topic generation', 'content update', 'content refresh']
  };

  private static classifyModule(text: string): string {
    const lowerText = text.toLowerCase();

    for (const [moduleName, keywords] of Object.entries(this.moduleKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return moduleName;
        }
      }
    }

    return 'Other';
  }

  static splitDescription(projectName: string, description: string): SplitResult[] {
    const sentences = this.splitIntoSentences(description);
    const results: SplitResult[] = [];

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length < 5) return; // 跳过太短的句子

      const type = this.classifyType(trimmed);
      const title = this.generateTitle(trimmed, projectName);
      const module = this.classifyModule(trimmed);
      const summary = this.generateSummary(trimmed, type);

      results.push({
        title,
        description: trimmed,
        type,
        module,
        summary,
        status: 'Not start' as ItemStatus
      });
    });

    return results;
  }

  private static splitIntoSentences(text: string): string[] {
    // 改进的句子分割，支持英文和中文
    const sentences: string[] = [];

    // 首先按数字编号分割（如 "1.", "2.", "3." 等）
    const numberedSections = text.split(/\n\s*\d+\.\s*/);

    numberedSections.forEach((section, index) => {
      if (index === 0 && !section.trim()) return; // 跳过第一个空部分

      if (section.trim()) {
        // 进一步按句号、问号、感叹号分割
        const subSentences = section.split(/[.!?]+/);
        subSentences.forEach(subSentence => {
          const trimmed = subSentence.trim();
          if (trimmed.length > 10) { // 只保留有意义的句子
            sentences.push(trimmed);
          }
        });
      }
    });

    // 如果没有按编号分割成功，尝试其他方法
    if (sentences.length === 0) {
      // 按换行符分割
      const lines = text.split(/\n+/);
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length > 10) {
          sentences.push(trimmed);
        }
      });
    }

    return sentences.filter(s => s.length > 0);
  }

  private static classifyType(text: string): ItemType {
    const lowerText = text.toLowerCase();

    // 检查是否包含问题关键词
    const hasIssueKeywords = this.issueKeywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (hasIssueKeywords) {
      return 'Issue';
    }

    // 检查是否包含功能关键词
    const hasFeatureKeywords = this.featureKeywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (hasFeatureKeywords) {
      return 'Feature';
    }

    // 默认根据动作关键词判断
    const actionCount = this.actionKeywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    ).length;

    // 如果包含多个动作词，更可能是功能开发
    return actionCount > 1 ? 'Feature' : 'Issue';
  }

  private static generateTitle(sentence: string, projectName: string): string {
    // 提取关键动作和对象
    const words = sentence.split(/[\s，,、]+/);

    // 找到动作词和关键对象
    const actionWord = words.find(word =>
      this.actionKeywords.includes(word.toLowerCase()) && word.length > 1
    );

    const featureWord = words.find(word =>
      this.featureKeywords.includes(word.toLowerCase()) && word.length > 1
    );

    const issueWord = words.find(word =>
      this.issueKeywords.includes(word.toLowerCase()) && word.length > 1
    );

    // 构建标题
    let title = '';

    if (actionWord && featureWord) {
      title = `${actionWord} ${featureWord}`;
    } else if (actionWord && issueWord) {
      title = `${actionWord} ${issueWord}`;
    } else if (actionWord) {
      // 寻找动作词后的第一个名词
      const actionIndex = words.findIndex(word =>
        this.actionKeywords.includes(word.toLowerCase())
      );
      if (actionIndex >= 0 && actionIndex + 1 < words.length) {
        const nextWord = words[actionIndex + 1];
        if (nextWord.length > 2) {
          title = `${actionWord} ${nextWord}`;
        } else {
          title = actionWord;
        }
      } else {
        title = actionWord;
      }
    } else if (featureWord) {
      title = `Implement ${featureWord}`;
    } else if (issueWord) {
      title = `Fix ${issueWord}`;
    } else {
      // 如果没有找到关键词，使用前几个词
      const firstWords = words.slice(0, 3).join(' ');
      title = firstWords.length > 20 ? firstWords.substring(0, 20) + '...' : firstWords;
    }

    // 清理标题
    title = title.replace(/[^\w\s-]/g, '').trim();

    // 如果标题太短，添加项目名
    if (title.length < 10) {
      title = `${projectName} - ${title}`;
    }

    return title;
  }

  private static generateSummary(sentence: string, type: ItemType): string {
    const words = sentence.split(/[\s，,、]+/);
    const keyWords = words.filter(word =>
      word.length > 1 &&
      (this.actionKeywords.includes(word.toLowerCase()) ||
        this.featureKeywords.includes(word.toLowerCase()) ||
        this.issueKeywords.includes(word.toLowerCase()) ||
        this.priorityKeywords.includes(word.toLowerCase()))
    );

    if (keyWords.length > 0) {
      return keyWords.slice(0, 3).join(' ');
    }

    // 如果没有关键词，返回前几个词
    return sentence.length > 15 ? sentence.substring(0, 15) + '...' : sentence;
  }

  static generateProjectSummary(description: string): string {
    const sentences = description.split(/[.!?]+/);
    const keyPhrases: string[] = [];

    sentences.forEach(sentence => {
      const words = sentence.split(/[\s，,、]+/);
      const keyWords = words.filter(word =>
        word.length > 1 &&
        (this.actionKeywords.includes(word.toLowerCase()) ||
          this.featureKeywords.includes(word.toLowerCase()) ||
          this.issueKeywords.includes(word.toLowerCase()))
      );

      if (keyWords.length > 0) {
        keyPhrases.push(keyWords.slice(0, 2).join(' '));
      }
    });

    if (keyPhrases.length > 0) {
      return keyPhrases.slice(0, 3).join(', ');
    }

    return 'Project development tasks';
  }
} 