import React, { useState, useRef } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';

interface ImportModalProps {
  dispatcherId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ dispatcherId, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    dispatcherId?: string;
    dispatcher?: {
      id: string;
      email: string;
      name: string;
    };
    errors?: any[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        setError('Please select a JSON file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a JSON file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const posts = JSON.parse(text);

      if (!Array.isArray(posts)) {
        throw new Error('JSON file must contain an array of posts');
      }

      if (posts.length === 0) {
        throw new Error('JSON file is empty');
      }

      // Import with optional dispatcherId (backend will auto-create if not provided)
      const importResult = await apiService.importPosts(posts, dispatcherId || undefined);
      setResult(importResult);

      // If dispatcher was auto-created, save the ID
      if (importResult.dispatcher && typeof window !== 'undefined') {
        localStorage.setItem('dispatcherId', importResult.dispatcherId);
      }

      if (importResult.imported > 0) {
        // Refresh data after successful import
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import posts. Please check the JSON format.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/json' && !droppedFile.name.endsWith('.json')) {
        setError('Please drop a JSON file');
        return;
      }
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Import Posts from JSON</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileJson size={48} className="text-emerald-600" />
                <div>
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={48} className="text-slate-400" />
                <div>
                  <p className="text-slate-700 font-medium">
                    Drag and drop a JSON file here, or click to browse
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    JSON file with array of broker posts
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                >
                  Select File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Import Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-emerald-800 font-medium">Import Complete</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-emerald-700">
                      ✓ Successfully imported: <strong>{result.imported}</strong> posts
                    </p>
                    {result.failed > 0 && (
                      <p className="text-amber-700">
                        ⚠ Failed to import: <strong>{result.failed}</strong> posts
                      </p>
                    )}
                    {result.dispatcher && (
                      <div className="mt-2 p-2 bg-white rounded border border-emerald-200">
                        <p className="text-xs font-medium text-emerald-800">Dispatcher Info:</p>
                        <p className="text-xs text-emerald-700">
                          {result.dispatcher.name} ({result.dispatcher.email})
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          ID: {result.dispatcherId}
                        </p>
                      </div>
                    )}
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-emerald-700 cursor-pointer">
                        View errors ({result.errors.length})
                      </summary>
                      <ul className="mt-2 text-xs text-emerald-600 space-y-1">
                        {result.errors.map((err: any, idx: number) => (
                          <li key={idx}>• {JSON.stringify(err)}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* JSON Format Hint */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Expected JSON Format:</p>
            <pre className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 overflow-x-auto">
{`[
  {
    "origin": "Aurora, IL",
    "destination": "Fairburn, GA",
    "tripMiles": 750,
    "totalMiles": 800,
    "rate": 2500,
    "company": "ABC Logistics",
    "truck": "Dry Van",
    "phone": "+1234567890",
    "email": "contact@example.com"
  }
]`}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Import Posts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

