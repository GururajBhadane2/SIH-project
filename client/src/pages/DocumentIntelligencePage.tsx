import React, { useState } from 'react';
import {
  FileSearch,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  Eye,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const DocumentIntelligencePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('Land_Documents');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [verified, setVerified] = useState(false);

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setProcessing(true);
      setVerified(false);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', documentType);
      formData.append('application_id', 'app-001'); // link to demo app

      const res = await api.uploadDocument(formData);
      setResult(res.extraction);
    } catch (err: any) {
      alert('Document analysis error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <FileSearch className="w-5 h-5 text-brand-400" />
          <span>AI Document Intelligence & Vision OCR</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Automated OCR text extraction, compliance keyword detection, regulatory field mapping, and human-in-the-loop verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Configuration Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Upload Regulatory Document" subtitle="Supported formats: PDF, DOCX, JPG, PNG (Max 15MB)">
            <form onSubmit={handleUploadAndAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Land_Documents">Land Documents (7/12 Extract / Deed)</option>
                  <option value="Building_Plan">Sanctioned Building Plan & Stability</option>
                  <option value="Fire_Safety_NOC">State Fire Safety NOC</option>
                  <option value="AICTE_Affidavit">AICTE Notarized Stamp Paper Affidavit</option>
                  <option value="Faculty_List">Faculty Cadre List & Ph.D. Recognitions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select File</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-800/40">
                  <input
                    type="file"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="doc-file-input"
                  />
                  <label htmlFor="doc-file-input" className="cursor-pointer space-y-2 block">
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      {selectedFile ? selectedFile.name : 'Click to browse or drag file here'}
                    </div>
                    <p className="text-[10px] text-slate-500">Scanned images or PDF documents</p>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || processing}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{processing ? 'Running Vision OCR & Rule Engine...' : 'Run Document Intelligence'}</span>
              </button>
            </form>
          </Card>

          {/* AI Ethics & Transparency Notice (Section 7) */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
            <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
              Regulatory AI Boundaries
            </span>
            <p className="text-[11px]">
              • AI never invents missing information. All extracted values are verbatim or marked missing.
            </p>
            <p className="text-[11px]">
              • Confidence scores below 85% mandate human-in-the-loop reviewer verification.
            </p>
            <p className="text-[11px]">
              • AI does not independently approve or reject applications; final decisions rest solely with authorized AICTE officers.
            </p>
          </div>
        </div>

        {/* Results / Extracted Attributes Panel */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Confidence Score & Overview */}
              <Card
                title="AI Analysis Results"
                subtitle={`Engine: ${result.ocrEngine}`}
                action={
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Confidence:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      result.confidenceScore >= 0.9
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : result.confidenceScore >= 0.8
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {Math.round(result.confidenceScore * 100)}%
                    </span>
                  </div>
                }
              >
                <div className="space-y-4">
                  {/* Extracted Fields */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                      Extracted Regulatory Attributes
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(result.extractedFields || {}).map(([k, v]) => (
                        <div key={k} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 block capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className="font-semibold text-white mt-0.5 block">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detected Keywords */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                      Compliance Keywords Recognized
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {result.detectedKeywords?.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-brand-300 border border-slate-700">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rule Findings */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                      Rule-Based Compliance Checks
                    </h4>
                    <div className="space-y-2">
                      {result.findings?.map((f: any, i: number) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-xs flex items-start space-x-2.5 ${
                            f.status === 'PASS'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                              : f.status === 'WARN'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                          }`}
                        >
                          <span className="font-bold shrink-0">[{f.status}]</span>
                          <div>
                            <div className="font-semibold">{f.rule}</div>
                            <div className="text-[11px] opacity-90 mt-0.5">{f.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OCR Raw Preview */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                      OCR Raw Stream
                    </h4>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 max-h-32 overflow-y-auto">
                      {result.extractedText}
                    </div>
                  </div>

                  {/* Human In The Loop Action */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Human Review Status: <strong>{verified ? 'Verified by Officer' : 'Pending Verification'}</strong>
                    </span>
                    <button
                      onClick={() => setVerified(true)}
                      disabled={verified}
                      className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition ${
                        verified
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-brand-600 hover:bg-brand-500 text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{verified ? 'Verified & Authenticated' : 'Confirm Human Verification'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <FileSearch className="w-12 h-12 text-slate-600" />
              <div className="text-sm font-semibold text-slate-400">No Document Analyzed Yet</div>
              <p className="text-xs max-w-sm">
                Upload any land document, fire NOC, building sanction drawing, or affidavit on the left panel to test AI vision extraction and compliance rule checks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
