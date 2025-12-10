'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  PieChart,
  Plus,
  List,
  Home,
  Download,
  Database,
  ChevronDown,
  ChevronRight,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StorageManager } from '@/lib/storage';
import { Project, TodoItem } from '@/types';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Statistics', href: '/statistics', icon: PieChart },
  { name: 'Task Management', href: '/items', icon: List },
  { name: 'Database', href: '/database', icon: Database },
];

function NavigationContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const selectedProjectIdParam = searchParams.get('project');
  const selectedProjectId = selectedProjectIdParam ? parseInt(selectedProjectIdParam, 10) : null;

  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    // Always load projects and items to keep menu up to date
    loadProjects();
    loadItems();
    
    // Expand submenu if on dashboard or if a project is selected
    if (isDashboard || selectedProjectId !== null) {
      setIsDashboardExpanded(true);
    }
  }, [isDashboard, selectedProjectId]);

  // Refresh data periodically and when pathname changes to catch updates
  useEffect(() => {
    const refreshData = () => {
      loadProjects();
      loadItems();
    };

    // Refresh immediately when pathname changes
    refreshData();

    // Set up periodic refresh every 2 seconds to catch updates from other tabs/components
    const interval = setInterval(refreshData, 2000);

    return () => clearInterval(interval);
  }, [pathname]);

  const loadProjects = async () => {
    try {
      const projectsData = await StorageManager.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadItems = async () => {
    try {
      const itemsData = await StorageManager.getItems();
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const getProjectStats = (projectId: number) => {
    const projectItems = items.filter(item => item.projectId === projectId && item.status !== 'Archive');
    const completed = projectItems.filter(item => item.status === 'Completed').length;
    const total = projectItems.length;
    return { completed, total };
  };

  const handleProjectSelect = (projectId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set('project', projectId.toString());
    } else {
      params.delete('project');
    }
    // Ensure submenu is expanded when selecting a project
    setIsDashboardExpanded(true);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">My Todo</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isDashboardItem = item.href === '/dashboard';
            
            return (
              <div key={item.name}>
                <div className="flex items-center">
                  <Link
                    href={isDashboardItem && selectedProjectId 
                      ? `${item.href}?project=${selectedProjectId}` 
                      : item.href}
                    onClick={() => {
                      // Expand submenu when clicking Dashboard link if a project is selected
                      if (isDashboardItem && selectedProjectId) {
                        setIsDashboardExpanded(true);
                      }
                    }}
                    className={cn(
                      'flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-md',
                      isActive && !isDashboardItem
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                  {isDashboardItem && (
                    <button
                      onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      {isDashboardExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Project Submenu for Dashboard */}
                {isDashboardItem && isDashboardExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    <button
                      onClick={() => handleProjectSelect(null)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md group',
                        selectedProjectId === null
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">All Projects</span>
                      </div>
                      {(() => {
                        const allItems = items.filter(item => item.status !== 'Archive');
                        const completed = allItems.filter(item => item.status === 'Completed').length;
                        const total = allItems.length;
                        return (
                          <span className={cn(
                            'ml-2 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0',
                            selectedProjectId === null
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                          )}>
                            {completed}/{total}
                          </span>
                        );
                      })()}
                    </button>
                    {projects.map((project) => {
                      const stats = getProjectStats(project.id);
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md group',
                            selectedProjectId === project.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{project.name}</span>
                          </div>
                          {stats.total > 0 && (
                            <span className={cn(
                              'ml-2 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0',
                              selectedProjectId === project.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                            )}>
                              {stats.completed}/{stats.total}
                            </span>
                          )}
                          {stats.total === 0 && (
                            <span className={cn(
                              'ml-2 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0',
                              selectedProjectId === project.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                            )}>
                              0/0
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function Navigation() {
  return (
    <Suspense fallback={
      <nav className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">My Todo</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">Loading...</div>
        </div>
      </nav>
    }>
      <NavigationContent />
    </Suspense>
  );
} 