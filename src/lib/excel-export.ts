import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TodoItem, Project } from '@/types';
import { formatDate } from './utils';

export interface ExportData {
  projects: Project[];
  items: TodoItem[];
}

export class ExcelExporter {
  static exportToExcel(data: ExportData, filename: string = 'todo-data') {
    const workbook = XLSX.utils.book_new();

    // 导出项目数据
    const projectsData = data.projects.map(project => ({
      'Project ID': project.id,
      'Project Name': project.name,
      'Description': project.description || '',
      'Created Date': formatDate(project.createdAt),
      'Updated Date': formatDate(project.updatedAt)
    }));

    const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

    // 导出任务数据
    const itemsData = data.items.map(item => ({
      'Item ID': item.id,
      'Title': item.title,
      'Description': item.description,
      'Type': item.type,
      'Status': item.status,
      'Project ID': item.projectId,
      'Project Name': this.getProjectName(data.projects, item.projectId),
      'Created Date': formatDate(item.createdAt),
      'Updated Date': formatDate(item.updatedAt),
      'Completed Date': item.completedAt ? formatDate(item.completedAt) : ''
    }));

    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Tasks');

    // 导出统计摘要
    const summaryData = this.generateSummaryData(data);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // 下载文件
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(blob, `${filename}-${timestamp}.xlsx`);
  }

  private static getProjectName(projects: Project[], projectId: string): string {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  }

  private static generateSummaryData(data: ExportData) {
    const totalProjects = data.projects.length;
    const totalItems = data.items.length;
    const completedItems = data.items.filter(item => item.status === 'Completed').length;
    const inProgressItems = data.items.filter(item =>
      ['On progress', 'Build UI', 'Integration', 'Waiting for API'].includes(item.status)
    ).length;
    const notStartedItems = data.items.filter(item => item.status === 'Not start').length;
    const featureItems = data.items.filter(item => item.type === 'Feature').length;
    const issueItems = data.items.filter(item => item.type === 'Issue').length;

    return [
      { 'Metric': 'Total Projects', 'Value': totalProjects },
      { 'Metric': 'Total Tasks', 'Value': totalItems },
      { 'Metric': 'Completed Tasks', 'Value': completedItems },
      { 'Metric': 'In Progress Tasks', 'Value': inProgressItems },
      { 'Metric': 'Not Started Tasks', 'Value': notStartedItems },
      { 'Metric': 'Feature Tasks', 'Value': featureItems },
      { 'Metric': 'Issue Tasks', 'Value': issueItems },
      { 'Metric': 'Completion Rate', 'Value': `${totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%` }
    ];
  }

  static exportProjectTasks(project: Project, items: TodoItem[], filename?: string) {
    const projectItems = items.filter(item => item.projectId === project.id);

    const data = projectItems.map(item => ({
      'Task ID': item.id,
      'Title': item.title,
      'Description': item.description,
      'Type': item.type,
      'Status': item.status,
      'Created Date': formatDate(item.createdAt),
      'Updated Date': formatDate(item.updatedAt),
      'Completed Date': item.completedAt ? formatDate(item.completedAt) : ''
    }));

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Tasks');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const timestamp = new Date().toISOString().split('T')[0];
    const projectName = project.name.replace(/[^a-zA-Z0-9]/g, '-');
    saveAs(blob, `${filename || projectName}-tasks-${timestamp}.xlsx`);
  }
} 