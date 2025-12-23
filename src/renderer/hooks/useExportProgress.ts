import { useState, useEffect, useCallback } from 'react';

interface ExportProgress {
  progress: number;
  message: string;
}

export function useExportProgress() {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    progress: 0,
    message: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Listen for export progress from Excel export
    const handleExportProgress = (_event: any, data: ExportProgress) => {
      setExportProgress(data);
      setIsExporting(data.progress > 0 && data.progress < 100);
    };

    // Listen for PDF progress
    const handlePDFProgress = (_event: any, data: ExportProgress) => {
      setExportProgress(data);
      setIsExporting(data.progress > 0 && data.progress < 100);
    };

    window.electron.ipcRenderer.on('export:progress', handleExportProgress);
    window.electron.ipcRenderer.on('pdf:progress', handlePDFProgress);

    return () => {
      window.electron.ipcRenderer.removeListener('export:progress', handleExportProgress);
      window.electron.ipcRenderer.removeListener('pdf:progress', handlePDFProgress);
    };
  }, []);

  const resetProgress = useCallback(() => {
    setExportProgress({ progress: 0, message: '' });
    setIsExporting(false);
  }, []);

  const startExport = useCallback(() => {
    setIsExporting(true);
    setExportProgress({ progress: 0, message: 'جاري التحضير...' });
  }, []);

  return {
    exportProgress,
    isExporting,
    resetProgress,
    startExport,
  };
}