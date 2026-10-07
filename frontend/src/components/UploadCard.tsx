import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, Loader2, Check } from 'lucide-react';
import { api } from '../api';
import type { UploadResponse } from '../types';

interface UploadCardProps {
  onUploadSuccess: (data: UploadResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onUploadSuccess,
  isLoading,
  setIsLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setError('Please upload a valid Excel file (.xlsx or .xls).');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.uploadExcel(selectedFile);
      onUploadSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload and validate file.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Upload Excel File</h2>
          <p className="text-xs text-slate-500">
            Upload spreadsheets containing up to 1000+ customer mobile numbers for verification.
          </p>
        </div>

        {/* Download Sample Button */}
        <a
          href={api.getSampleTemplateUrl()}
          download="groupin_sample_numbers.xlsx"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs w-fit"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Download File</span>
        </a>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50'
            : selectedFile
            ? 'border-emerald-400 bg-emerald-50/20'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
          {selectedFile ? (
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        {selectedFile ? (
          <div>
            <div className="font-semibold text-sm text-slate-900 flex items-center justify-center gap-1.5">
              <span>{selectedFile.name}</span>
              <span className="text-xs text-slate-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              File ready for validation. Click "Validate & Continue" below.
            </p>
          </div>
        ) : (
          <div>
            <div className="font-semibold text-sm text-slate-800">
              Drag and drop your Excel file here, or{' '}
              <span className="text-blue-600 underline">Browse Files</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supported formats: .xlsx, .xls, .csv (Max 100MB)
            </p>
          </div>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      {selectedFile && (
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Clear File
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reading & Validating File...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Validate & Continue</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
