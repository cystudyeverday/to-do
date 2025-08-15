'use client';

import { useState, useEffect } from 'react';
import { DatabaseDetector, DatabaseInfo } from '@/lib/database-detector';
import { DatabaseMigrator } from '@/lib/database-migrator';
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Server,
  Cloud,
  Shield,
  FileText,
  Settings,
  Download,
  Upload,
  Save,
  Trash2,
  Wrench
} from 'lucide-react';

export default function DatabasePage() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [recommendedDb, setRecommendedDb] = useState<DatabaseInfo | null>(null);
  const [dataIntegrity, setDataIntegrity] = useState<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupData, setBackupData] = useState('');

  useEffect(() => {
    detectDatabases();
  }, []);

  const detectDatabases = async () => {
    setIsDetecting(true);
    try {
      const results = await DatabaseDetector.detectAllDatabases();
      setDatabases(results);

      const recommended = await DatabaseDetector.getRecommendedDatabase();
      setRecommendedDb(recommended);

      const integrity = await DatabaseDetector.checkDataIntegrity();
      setDataIntegrity(integrity);

      const validation = DatabaseMigrator.validateData();
      setValidationResult(validation);

      setLastChecked(new Date());
    } catch (error) {
      console.error('Database detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBackup = () => {
    try {
      const backup = DatabaseMigrator.backup();
      setBackupData(backup);
      setShowBackupModal(true);
    } catch (error) {
      alert(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRestore = () => {
    if (!backupData.trim()) {
      alert('Please paste backup data first');
      return;
    }

    if (confirm('This will replace all current data. Are you sure?')) {
      try {
        const result = DatabaseMigrator.restore(backupData);
        if (result.success) {
          alert(`Restore successful: ${result.migratedProjects} projects, ${result.migratedItems} items`);
          setShowBackupModal(false);
          setBackupData('');
          detectDatabases(); // Refresh data
        } else {
          alert(`Restore failed: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        alert(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleCleanup = () => {
    if (confirm('This will remove orphaned data. Are you sure?')) {
      try {
        const result = DatabaseMigrator.cleanupOrphanedData();
        alert(`Cleanup completed: ${result.removedItems} items, ${result.removedProjects} projects removed`);
        detectDatabases(); // Refresh data
      } catch (error) {
        alert(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const downloadBackup = () => {
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case 'localStorage':
        return <HardDrive className="w-5 h-5" />;
      case 'indexedDB':
        return <Database className="w-5 h-5" />;
      case 'sqlite':
        return <FileText className="w-5 h-5" />;
      case 'mysql':
      case 'postgresql':
        return <Server className="w-5 h-5" />;
      case 'mongodb':
        return <Cloud className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getDatabaseName = (type: string) => {
    switch (type) {
      case 'localStorage':
        return 'Local Storage';
      case 'indexedDB':
        return 'IndexedDB';
      case 'sqlite':
        return 'SQLite';
      case 'mysql':
        return 'MySQL';
      case 'postgresql':
        return 'PostgreSQL';
      case 'mongodb':
        return 'MongoDB';
      default:
        return type;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Status</h1>
            <p className="mt-2 text-gray-600">Monitor database availability and data integrity</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackup}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              <span>Backup</span>
            </button>
            <button
              onClick={handleCleanup}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              <Wrench className="w-4 h-4" />
              <span>Cleanup</span>
            </button>
            <button
              onClick={detectDatabases}
              disabled={isDetecting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Last Checked */}
        {lastChecked && (
          <div className="mb-6 text-sm text-gray-500">
            Last checked: {lastChecked.toLocaleString()}
          </div>
        )}

        {/* Recommended Database */}
        {recommendedDb && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-medium text-green-900">
                  Recommended Database: {getDatabaseName(recommendedDb.type)}
                </h3>
                <p className="text-sm text-green-700">
                  This is the best available database for your current environment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Database Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {databases.map((db, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow p-6 border-2 ${db.available ? 'border-green-200' : 'border-red-200'
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getDatabaseIcon(db.type)}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getDatabaseName(db.type)}
                    </h3>
                    <p className="text-sm text-gray-500">{db.type}</p>
                  </div>
                </div>
                {db.available ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={db.available ? 'text-green-600' : 'text-red-600'}>
                    {db.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {db.size !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="text-gray-900">{formatSize(db.size)}</span>
                  </div>
                )}

                {db.lastModified && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Modified:</span>
                    <span className="text-gray-900">
                      {db.lastModified.toLocaleDateString()}
                    </span>
                  </div>
                )}

                {db.error && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                    {db.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Validation */}
        {validationResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Data Validation</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{validationResult.statistics.totalProjects}</div>
                <div className="text-sm text-blue-700">Projects</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validationResult.statistics.totalItems}</div>
                <div className="text-sm text-green-700">Items</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{validationResult.statistics.orphanedItems}</div>
                <div className="text-sm text-yellow-700">Orphaned Items</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{validationResult.statistics.emptyProjects}</div>
                <div className="text-sm text-red-700">Empty Projects</div>
              </div>
            </div>

            {validationResult.issues.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Issues Found:</h3>
                <ul className="space-y-1">
                  {validationResult.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-center space-x-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Data Integrity Check */}
        {dataIntegrity && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Data Integrity Check</h2>
            </div>

            <div className="flex items-center space-x-3 mb-4">
              {dataIntegrity.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`font-medium ${dataIntegrity.valid ? 'text-green-600' : 'text-yellow-600'}`}>
                {dataIntegrity.valid ? 'Data integrity is good' : 'Data integrity issues found'}
              </span>
            </div>

            {dataIntegrity.issues.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Issues Found:</h3>
                <ul className="space-y-1">
                  {dataIntegrity.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-center space-x-2">
                      <XCircle className="w-3 h-3" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dataIntegrity.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h3>
                <ul className="space-y-1">
                  {dataIntegrity.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-600 flex items-center space-x-2">
                      <Settings className="w-3 h-3" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Database Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Database Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Storage</h3>
              <p className="text-sm text-gray-600">
                The application is currently using <strong>localStorage</strong> for data persistence.
                This provides a simple, client-side storage solution that works offline.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Storage Limits</h3>
              <p className="text-sm text-gray-600">
                localStorage typically has a limit of 5-10MB per domain.
                For larger datasets, consider upgrading to IndexedDB or a remote database.
              </p>
            </div>
          </div>
        </div>

        {/* Backup/Restore Modal */}
        {showBackupModal && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Backup & Restore</h2>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Data (JSON)
                  </label>
                  <textarea
                    value={backupData}
                    onChange={(e) => setBackupData(e.target.value)}
                    placeholder="Paste backup data here..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={downloadBackup}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleRestore}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setShowBackupModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 