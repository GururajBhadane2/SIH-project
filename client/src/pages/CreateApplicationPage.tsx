import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Building,
  GitFork,
  FileText,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';

const CATEGORIES = [
  { id: 'Extension of Approval (EoA)', name: 'Extension of Approval (EoA)', route: 'ROUTE_A', desc: 'Standard annual EoA for existing technical institutions with no intake alterations' },
  { id: 'Increase in Intake (AI & Data Science)', name: 'Increase in Intake (New Division)', route: 'ROUTE_B', desc: 'Addition of seats/divisions in emerging areas requiring physical laboratory EVC verification' },
  { id: 'Introduction of New Course (Cybersecurity)', name: 'Introduction of New Course / Program', route: 'ROUTE_B', desc: 'Starting a new undergraduate or postgraduate degree program with faculty cadre audit' },
  { id: 'Establishment of New Technical Institution', name: 'Establishment of New Institution', route: 'ROUTE_C', desc: 'Setting up a brand new technical campus with comprehensive EVC and SAC committee appraisal' }
];

export const CreateApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [workflowCode, setWorkflowCode] = useState(CATEGORIES[0].route);
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Documents state
  const [landDoc, setLandDoc] = useState<File | null>(null);
  const [fireDoc, setFireDoc] = useState<File | null>(null);
  const [planDoc, setPlanDoc] = useState<File | null>(null);
  const [affidavitDoc, setAffidavitDoc] = useState<File | null>(null);

  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  const handleCategorySelect = (catId: string) => {
    const found = CATEGORIES.find(c => c.id === catId);
    if (found) {
      setCategory(found.id);
      setWorkflowCode(found.route);
    }
  };

  const handleCreateAndSubmit = async (submitNow: boolean) => {
    try {
      setSubmitting(true);
      // 1. Create draft application
      const res = await api.createApplication({
        institution_id: user?.institution_id || 'inst-01',
        workflow_code: workflowCode,
        category,
        academic_year: academicYear
      });

      const appId = res.applicationId;
      setCreatedAppId(appId);

      // 2. Upload any selected documents
      const docsToUpload = [
        { file: landDoc, type: 'Land_Documents' },
        { file: fireDoc, type: 'Fire_Safety_NOC' },
        { file: planDoc, type: 'Building_Plan' },
        { file: affidavitDoc, type: 'AICTE_Affidavit' }
      ];

      for (const d of docsToUpload) {
        if (d.file) {
          const formData = new FormData();
          formData.append('file', d.file);
          formData.append('application_id', appId);
          formData.append('document_type', d.type);
          await api.uploadDocument(formData);
        }
      }

      // 3. Submit if requested
      if (submitNow) {
        await api.submitApplication(appId);
      }

      navigate(`/applications/${appId}`);
    } catch (err: any) {
      alert('Error creating application: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <FilePlus2 className="w-5 h-5 text-brand-400" />
          <span>New AICTE Approval Application</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Follow the 4-step wizard to register application, upload mandatory documents, and initiate scrutiny
        </p>
      </div>

      {/* Stepper Steps Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, title: 'Institution Info' },
          { num: 2, title: 'Category & Route' },
          { num: 3, title: 'Upload Documents' },
          { num: 4, title: 'Review & Submit' }
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-xl border text-center transition ${
              step === s.num
                ? 'bg-brand-600/20 border-brand-500 text-white font-semibold'
                : step > s.num
                ? 'bg-slate-850 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-850 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-xs block font-bold">Step {s.num}</span>
            <span className="text-[11px] truncate block">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Institution Info */}
      {step === 1 && (
        <Card title="Step 1: Institutional Verification Details" subtitle="Verify institutional identifiers and academic year cycle">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Institution Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.institution_name || 'Apex Institute of Technology & Management'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">AICTE Permanent ID</label>
                <input
                  type="text"
                  disabled
                  value={user?.aicte_id || '1-3329182741'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Regional Office</label>
                <input
                  type="text"
                  disabled
                  value={user?.region_name || 'Western Regional Office (WRO), Mumbai'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Approval Academic Cycle</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="2026-2027">Academic Year 2026-2027</option>
                  <option value="2027-2028">Academic Year 2027-2028</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-start space-x-2">
              <Building className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                Data boundary confirmed: Application will be filed under <strong>{user?.institution_name || 'Apex Institute of Technology'}</strong>.
              </span>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <span>Continue to Category</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Category & Route */}
      {step === 2 && (
        <Card title="Step 2: Select Application Category & Regulatory Route" subtitle="Approval route is automatically determined by AICTE Approval Process Handbook (APH) rules">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                    category === cat.id
                      ? 'bg-brand-600/15 border-brand-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-white">{cat.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                        {cat.route}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{cat.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    category === cat.id ? 'border-brand-500 bg-brand-500' : 'border-slate-600'
                  }`}>
                    {category === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-300 flex items-center justify-between border border-slate-700">
              <div className="flex items-center space-x-2">
                <GitFork className="w-4 h-4 text-brand-400" />
                <span>Selected Route: <strong>{workflowCode}</strong></span>
              </div>
              <span className="text-[11px] text-slate-400">
                {workflowCode === 'ROUTE_A' && 'Scrutiny → Authority Decision'}
                {workflowCode === 'ROUTE_B' && 'Scrutiny → EVC Visit → Authority Decision'}
                {workflowCode === 'ROUTE_C' && 'EVC Visit → Committee Hearing → Authority Decision'}
              </span>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <span>Continue to Documents</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Upload Documents */}
      {step === 3 && (
        <Card title="Step 3: Upload Prescribed Documents" subtitle="PDF, DOCX, JPG, PNG accepted. Documents will be analyzed by AICTE FlowX OCR & Rule Engine">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Land Doc */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">1. Land Documents (7/12 or Deed)</span>
                  <span className="text-[10px] text-brand-400 font-bold uppercase">Mandatory</span>
                </div>
                <p className="text-[11px] text-slate-400">Title deed, non-encumbrance certificate showing ≥ 5.0 acres contiguous educational land</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setLandDoc(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
                />
                {landDoc && <p className="text-[11px] text-emerald-400">Selected: {landDoc.name}</p>}
              </div>

              {/* Fire Safety NOC */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">2. Fire Safety NOC</span>
                  <span className="text-[10px] text-brand-400 font-bold uppercase">Mandatory</span>
                </div>
                <p className="text-[11px] text-slate-400">Valid NOC from State Fire Services DG covering all instructional blocks</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setFireDoc(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
                />
                {fireDoc && <p className="text-[11px] text-emerald-400">Selected: {fireDoc.name}</p>}
              </div>

              {/* Building Plan */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">3. Approved Building Plan</span>
                  <span className="text-[10px] text-brand-400 font-bold uppercase">Mandatory</span>
                </div>
                <p className="text-[11px] text-slate-400">Municipal corporation approved layout plan with instructional carpet area</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setPlanDoc(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
                />
                {planDoc && <p className="text-[11px] text-emerald-400">Selected: {planDoc.name}</p>}
              </div>

              {/* AICTE Affidavit */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">4. Notarized Affidavit (Rs. 100)</span>
                  <span className="text-[10px] text-brand-400 font-bold uppercase">Mandatory</span>
                </div>
                <p className="text-[11px] text-slate-400">Stamp paper affidavit covering anti-ragging, pay scales, and AICTE compliance</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setAffidavitDoc(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
                />
                {affidavitDoc && <p className="text-[11px] text-emerald-400">Selected: {affidavitDoc.name}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <span>Review Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card title="Step 4: Final Appraisal & Submission" subtitle="Review entered data before saving draft or sending to Regional Scrutiny Queue">
          <div className="space-y-4">
            <div className="p-4 bg-slate-850 border border-slate-750 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-750 pb-2">
                <span className="text-slate-400">Institution:</span>
                <span className="font-semibold text-white">{user?.institution_name || 'Apex Institute'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-750 pb-2">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-white">{category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-750 pb-2">
                <span className="text-slate-400">Workflow Route:</span>
                <span className="font-mono font-bold text-brand-400">{workflowCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-750 pb-2">
                <span className="text-slate-400">Academic Year:</span>
                <span className="font-semibold text-white">{academicYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uploaded Documents:</span>
                <span className="font-semibold text-white">
                  {[landDoc, fireDoc, planDoc, affidavitDoc].filter(Boolean).length} Attached
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Declaration Under APH 2026-27</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                I solemnly affirm that the information furnished and documents attached are authentic and complete. All records will be subject to Regional Scrutiny and EVC physical inspection.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreateAndSubmit(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreateAndSubmit(true)}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-lg transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
