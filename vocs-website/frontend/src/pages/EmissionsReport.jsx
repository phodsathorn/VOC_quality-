import { useState } from 'react';
import {
  Download, AlertTriangle, Calendar, ChevronDown, Check,
  ArrowRight, ArrowLeft, Upload, Eye, FileText, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EmissionsReport() {
  const { t, isThai } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'methodology' | 'solvents' | 'lab'
  const [solventView, setSolventView] = useState('bars'); // 'bars' | 'table'
  const [selectedYear, setSelectedYear] = useState('2024 (Current)');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [selectedStack, setSelectedStack] = useState('stack1');
  const [toastMsg, setToastMsg] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const [labReports, setLabReports] = useState([
    {
      id: 'pdf-1',
      name: 'Q3_Stack_Isokinetic_Lab_Analysis.pdf',
      size: '2.4 MB',
      date: '12 Oct 2024',
      verified: true,
      auditor: 'PCD Accredited Lab #TH-041',
      summary: 'Isokinetic sampling method 5 & 25A continuous VOC analysis. Results show 58 ppm compliance against 100 ppm regulatory cap.',
    },
    {
      id: 'pdf-2',
      name: 'VOC_Speciation_GCMS_Report_Aug.pdf',
      size: '1.8 MB',
      date: '28 Aug 2024',
      verified: true,
      auditor: 'EnviroTest Analytical Laboratory',
      summary: 'Speciated GC-MS solvent breakdown confirming Toluene (34%), Ethyl Acetate (30%), MEK (21%), and Xylene (15%).',
    },
  ]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  const handleExportAudit = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'EPA Title V Assessment - PCD Compliance Report\n' +
      `Year,${selectedYear}\n` +
      'Assessment Period,Q3 Rolling Assessment\n' +
      'Overall Compliance,Compliant (42% below legal threshold limit)\n' +
      'Current Concentration,58 ppm\n' +
      'Permit Cap,100 ppm\n' +
      'Annual VOC Mass,8400 kg\n' +
      'Annual Legal Limit,14500 kg\n' +
      'Flow Rate,42000 m3/h\n' +
      'Operating Hours,3840 hrs/yr\n\n' +
      'Solvent Speciation Breakdown:\n' +
      'Solvent,Concentration_ppm,Concentration_mg_m3,Rate_kg_hr,Share_pct\n' +
      'Toluene,14.2,53.6,3.2,34%\n' +
      'Ethyl Acetate,18.5,66.8,2.8,30%\n' +
      'MEK,15.5,45.2,1.9,21%\n' +
      'Xylene,9.8,32.1,1.4,15%\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCD_Audit_Report_TitleV_${selectedYear.slice(0, 4)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isThai ? 'ส่งออกรายงานตรวจสอบมลพิษ (PCD) เรียบร้อยแล้ว ✓' : 'Exported PCD audit report CSV ✓');
  };

  const handleUploadFile = (e) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;
    const newReport = {
      id: `pdf-${Date.now()}`,
      name: uploadFileName.endsWith('.pdf') ? uploadFileName : `${uploadFileName}.pdf`,
      size: '1.2 MB',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      verified: true,
      auditor: 'Internal Verified Upload',
      summary: 'Uploaded certified audit certificate document.',
    };
    setLabReports([newReport, ...labReports]);
    setIsUploadModalOpen(false);
    setUploadFileName('');
    showToast(isThai ? 'อัปโหลดรายงานผลแล็บเรียบร้อยแล้ว ✓' : 'Lab report uploaded successfully ✓');
  };

  const solventsList = [
    { name: isThai ? 'โทลูอีน (Toluene)' : 'Toluene', ppm: 14.2, mg: '53.6', rate: '3.2', share: 34, barWidth: '56.8%', barBg: 'bg-[#004ac6]' },
    { name: isThai ? 'ไซลีน (Xylene)' : 'Xylene', ppm: 9.8, mg: '32.1', rate: '1.4', share: 15, barWidth: '39.2%', barBg: 'bg-[#2563eb]' },
    { name: isThai ? 'เอทิลแอซีเทต (Ethyl Acetate)' : 'Ethyl Acetate', ppm: 18.5, mg: '66.8', rate: '2.8', share: 30, barWidth: '74%', barBg: 'bg-[#505f76]' },
    { name: isThai ? 'เมทิลเอทิลคีโทน (MEK)' : 'MEK', ppm: 15.5, mg: '45.2', rate: '1.9', share: 21, barWidth: '62%', barBg: 'bg-[#b4c5ff]' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* ── Notice Advisory Banner matching Stitch 1:1 ── */}
      <div className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-[#ffede6]/60 border border-[#ffdbcd] text-[12px] text-[#943700] font-medium shadow-2xs">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#943700] shrink-0" />
          <span>
            <strong>{isThai ? 'ข้อควรระวัง:' : 'Notice:'}</strong> {t('emissionsNotice')}
          </span>
        </div>
        <span className="text-[11px] text-[#505f76] font-semibold tracking-wide shrink-0 ml-2">
          {t('advisoryOnly')}
        </span>
      </div>

      {/* ── Header: Title & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[20px] font-bold text-[#131b2e] tracking-tight">
            {t('emissionsTitle')}
          </h1>
          <span className="text-[#505f76] text-[14px]">
            {t('q3RollingAssessment')}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Year selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#eaedff] border border-[#dbe1ff] text-[#131b2e] text-[13px] font-medium hover:bg-[#dae2fd] transition-colors cursor-pointer"
            >
              <Calendar size={15} className="text-[#505f76]" />
              <span>{isThai ? 'ปีงบประมาณ: 2567 (ปัจจุบัน)' : selectedYear}</span>
              <ChevronDown size={15} className="text-[#505f76]" />
            </button>
            {isYearDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#eaedff] p-1.5 z-50 text-[13px] min-w-[170px] animate-fade-in">
                {['Year: 2024 (Current)', 'Year: 2023 (Archived)', 'Year: 2022 (Archived)'].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setSelectedYear(y);
                      setIsYearDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#f2f3ff] text-[#131b2e] font-medium transition-colors"
                  >
                    {isThai && y.includes('2024')
                      ? 'ปี 2567 (ปัจจุบัน)'
                      : isThai && y.includes('2023')
                      ? 'ปี 2566 (ประวัติ)'
                      : isThai && y.includes('2022')
                      ? 'ปี 2565 (ประวัติ)'
                      : y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export PCD audit report */}
          <button
            type="button"
            onClick={handleExportAudit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#004ac6] text-white font-medium text-[14px] shadow-sm hover:bg-[#003ea8] transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download size={16} />
            <span>{t('exportPcdReport')}</span>
          </button>
        </div>
      </div>

      {/* ── 4 Tabs Bar matching Stitch ── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-[#004ac6] shadow-sm font-semibold'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          {t('overviewTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'methodology'
              ? 'bg-white text-[#004ac6] shadow-sm font-semibold'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          {t('methodologyTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solvents')}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'solvents'
              ? 'bg-white text-[#004ac6] shadow-sm font-semibold'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          {t('solventsTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lab')}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'lab'
              ? 'bg-white text-[#004ac6] shadow-sm font-semibold'
              : 'text-[#505f76] hover:text-[#131b2e]'
          }`}
        >
          {t('labReportsTab')}
        </button>
      </div>

      {/* ── Section 1: Regulatory Compliance Gauge Card (shown on overview) ── */}
      {(activeTab === 'overview') && (
        <section
          className="relative bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between overflow-hidden border border-[#eaedff]"
          style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#dbe1ff]/30 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between w-full mb-6">
            <span className="text-[14px] uppercase text-[#505f76] font-semibold tracking-wider">
              {t('regulatoryCompliance')}
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#131b2e] text-[12px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse" />
              <span>{t('compliantStatus')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 my-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[56px] leading-[60px] font-bold text-[#131b2e] tracking-tight tabular-nums">
                42%
              </span>
              <span className="text-[20px] text-[#505f76] font-normal">
                {t('belowLegalLimit')}
              </span>
            </div>
          </div>

          {/* Progress gauge with pointer pin */}
          <div className="w-full mt-6 pt-3">
            <div className="relative w-full h-2 rounded-full bg-[#e2e7ff] overflow-visible flex items-center">
              <div
                className="h-2 rounded-full bg-[#2563eb] transition-all duration-1000 ease-out"
                style={{ width: '58%' }}
              />
              <div
                className="absolute left-[58%] -top-1.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center -translate-x-1/2"
              >
                <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
              </div>
              <div className="absolute right-0 -top-6 flex flex-col items-end">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737686]">
                  {t('cap100ppm')}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 text-[11px] text-[#505f76] font-medium">
              <span>0 ppm</span>
              <span className="text-[#004ac6] font-semibold">{t('current58ppm')}</span>
              <span>100 ppm</span>
            </div>
          </div>

          {/* Annual mass limit bar */}
          <div className="w-full mt-6 pt-4 border-t border-[#eaedff]">
            <div className="flex justify-between items-center text-[14px] text-[#131b2e] mb-2 font-medium flex-wrap gap-2">
              <span className="text-[#505f76] font-medium">
                {t('annualVocLimit')}
              </span>
              <span className="tabular-nums font-semibold text-[#004ac6] text-[12px] bg-[#eaedff] px-2.5 py-0.5 rounded-full">
                57.9% {t('pctOfLimit')}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#004ac6] transition-all duration-700 ease-out"
                style={{ width: '57.9%' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Section 2: VOC Emissions by Solvent (shown on overview and solvents tab) ── */}
      {(activeTab === 'overview' || activeTab === 'solvents') && (
        <section
          className="relative bg-white rounded-3xl p-8 shadow-sm flex flex-col overflow-hidden border border-[#eaedff]"
          style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] uppercase text-[#505f76] font-semibold tracking-wider">
                {t('vocBySolvent')}
              </span>
              <span className="text-[12px] text-[#505f76]">
                {t('solventLimit')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSolventView('bars')}
                className={`px-3 py-1 rounded-full text-[12px] transition-colors cursor-pointer ${
                  solventView === 'bars'
                    ? 'bg-[#eaedff] text-[#004ac6] font-semibold'
                    : 'text-[#505f76] hover:text-[#131b2e]'
                }`}
              >
                {t('barChartBtn')}
              </button>
              <button
                type="button"
                onClick={() => setSolventView('table')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] transition-colors cursor-pointer ${
                  solventView === 'table'
                    ? 'bg-[#eaedff] text-[#004ac6] font-semibold'
                    : 'text-[#505f76] hover:text-[#004ac6]'
                }`}
              >
                <span>{t('viewSolventBreakdown')}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Bar Chart View */}
          {solventView === 'bars' && (
            <div className="flex flex-col">
              <div className="flex flex-col gap-5 w-full">
                {solventsList.map((s) => (
                  <div key={s.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[14px] font-medium text-[#131b2e]">
                      <span>{s.name}</span>
                      <span className="tabular-nums text-[#505f76] font-medium">{s.ppm} ppm</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#f2f3ff] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.barBg} transition-all duration-700 ease-out`}
                        style={{ width: s.barWidth }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6 pt-2 text-[11px] text-[#737686] tracking-wider uppercase font-medium">
                <span>0 ppm</span>
                <span>10 ppm</span>
                <span>20 ppm</span>
                <span>30 ppm {t('safeCeiling')}</span>
              </div>
            </div>
          )}

          {/* Table View */}
          {solventView === 'table' && (
            <div className="flex flex-col">
              <div className="overflow-hidden rounded-2xl border border-[#eaedff]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f2f3ff] border-b border-[#eaedff]">
                    <tr>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#505f76]">
                        {t('solventCol')}
                      </th>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#505f76] text-right">
                        {t('concentrationCol')}
                      </th>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#505f76] text-right">
                        {t('rateCol')}
                      </th>
                      <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-[#505f76] text-right">
                        {t('shareCol')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaedff] text-[14px] text-[#131b2e]">
                    {solventsList.map((s) => (
                      <tr key={s.name} className="hover:bg-[#f2f3ff]/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.barBg}`} />
                          <span>{s.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#505f76]">
                          {s.mg} mg/m³
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#505f76]">
                          {s.rate} kg/hr
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-[#004ac6]">
                          {s.share}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-1 text-[11px] text-[#505f76] font-medium">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#737686]">{t('epaBaselineNote')}</span>
                  <span className="italic text-[11px] text-[#505f76]">{t('enoseIndicativeNote')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSolventView('bars')}
                  className="text-[#004ac6] hover:underline inline-flex items-center gap-1 text-[12px] font-semibold cursor-pointer shrink-0"
                >
                  <ArrowLeft size={14} />
                  <span>{t('viewBarChart')}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Tab 2: Inputs & Methodology matching Stitch ── */}
      {activeTab === 'methodology' && (
        <div className="flex flex-col gap-6">
          {/* Inputs & Parameters */}
          <section
            className="relative bg-white rounded-3xl p-8 shadow-sm flex flex-col overflow-hidden border border-[#eaedff]"
            style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
          >
            <div className="flex items-center justify-between w-full mb-6">
              <span className="text-[14px] uppercase text-[#505f76] font-semibold tracking-wider">
                {t('inputsParameters')}
              </span>
              <span className="text-[11px] text-[#737686] font-medium">
                {t('stackSamplingPoint1')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1.5 p-4 bg-[#f2f3ff] rounded-2xl border border-[#eaedff]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('flowRate')}
                </span>
                <input
                  type="text"
                  value="42,000 m³/h"
                  readOnly
                  className="w-full bg-white border border-[#c3c6d7] rounded-xl px-3 py-2 text-[14px] font-semibold text-[#131b2e] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 p-4 bg-[#f2f3ff] rounded-2xl border border-[#eaedff]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('operatingHoursYear')}
                </span>
                <input
                  type="text"
                  value="3,840 hrs/yr"
                  readOnly
                  className="w-full bg-white border border-[#c3c6d7] rounded-xl px-3 py-2 text-[14px] font-semibold text-[#131b2e] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 p-4 bg-[#f2f3ff] rounded-2xl border border-[#eaedff]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('stackSelector')}
                </span>
                <div className="relative">
                  <select
                    value={selectedStack}
                    onChange={(e) => setSelectedStack(e.target.value)}
                    className="w-full bg-white border border-[#c3c6d7] rounded-xl px-3 py-2 text-[14px] font-medium text-[#131b2e] appearance-none pr-8 focus:outline-none"
                  >
                    <option value="stack1">{t('stack1Name')}</option>
                    <option value="stack2">{t('stack2Name')}</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-2.5 top-2.5 text-[#505f76] pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="text-[12px] text-[#737686] italic pt-2 border-t border-[#eaedff]">
              {t('manualPlcNote')}
            </div>
          </section>

          {/* How it is calculated */}
          <section
            className="relative bg-white rounded-3xl p-8 shadow-sm flex flex-col overflow-hidden border border-[#eaedff]"
            style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
          >
            <div className="flex items-center justify-between w-full mb-6">
              <span className="text-[14px] uppercase text-[#505f76] font-semibold tracking-wider">
                {t('howCalculated')}
              </span>
              <span className="text-[12px] text-[#004ac6] font-semibold">
                {t('epaTitleVMethod')}
              </span>
            </div>

            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('methodologyFormula')}
                </span>
                <span className="font-mono text-[14px] font-semibold text-[#004ac6]">
                  Mass (kg/yr) = Conc × Flow × Hours ÷ 1,000,000
                </span>
              </div>
              <div className="h-px w-full bg-[#eaedff]" />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('liveAssessmentValues')}
                </span>
                <span className="font-mono text-[14px] font-medium text-[#131b2e] tabular-nums">
                  8,400 kg/yr = 52.1 mg/m³ × 42,000 m³/h × 3,840 h ÷ 1,000,000
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Tab 4: Lab Reports matching Stitch ── */}
      {activeTab === 'lab' && (
        <section
          className="relative bg-white rounded-3xl p-8 shadow-sm flex flex-col overflow-hidden border border-[#eaedff]"
          style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
        >
          <div className="flex items-center justify-between w-full mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] uppercase text-[#505f76] font-semibold tracking-wider">
                {t('labReportTitle')}
              </span>
              <span className="text-[12px] text-[#505f76]">
                {t('certifiedAudits')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#004ac6] text-[#004ac6] hover:bg-[#eaedff] text-[13px] font-semibold transition-colors cursor-pointer"
            >
              <Upload size={15} />
              <span>{t('uploadPdfBtn')}</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {labReports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] hover:bg-[#eaedff]/60 transition-colors flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#dbe1ff] text-[#004ac6] flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[#131b2e]">
                      {r.name}
                    </span>
                    <span className="text-[11px] text-[#505f76]">
                      {t('sizeLabel')} {r.size} · {t('uploadedLabel')} {r.date} ·{' '}
                      <span className="text-[#004ac6] font-semibold">{t('verifiedStatus')}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewPdf(r)}
                    className="p-2 rounded-full hover:bg-white text-[#505f76] hover:text-[#004ac6] transition-colors cursor-pointer"
                    title={t('viewPdf')}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleData = `data:text/plain;charset=utf-8,Laboratory Audit Report Certificate\nDocument: ${r.name}\nAuditor: ${r.auditor}\nDate: ${r.date}\nStatus: Verified\nSummary: ${r.summary}`;
                      const encoded = encodeURI(sampleData);
                      const link = document.createElement('a');
                      link.setAttribute('href', encoded);
                      link.setAttribute('download', r.name);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast(isThai ? `ดาวน์โหลดเอกสาร ${r.name} เรียบร้อยแล้ว ✓` : `Downloaded ${r.name} ✓`);
                    }}
                    className="p-2 rounded-full hover:bg-white text-[#505f76] hover:text-[#004ac6] transition-colors cursor-pointer"
                    title={t('downloadPdf')}
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PDF Preview Modal ── */}
      {previewPdf && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#eaedff] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#004ac6]" />
                <h3 className="text-base font-bold text-[#131b2e] truncate max-w-xs">
                  {previewPdf.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPdf(null)}
                className="p-1.5 rounded-full hover:bg-[#f2f3ff] text-[#505f76] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-[#f2f3ff] flex flex-col gap-1">
                <span className="font-semibold text-[#131b2e]">{isThai ? 'ข้อมูลผู้ตรวจสอบ:' : 'Certifying Authority:'}</span>
                <span className="text-[#505f76]">{previewPdf.auditor}</span>
                <span className="text-[#505f76]">{isThai ? 'วันที่ตรวจรับรอง:' : 'Audit Date:'} {previewPdf.date}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff] text-[#131b2e] leading-relaxed">
                {previewPdf.summary}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setPreviewPdf(null)}
                className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] cursor-pointer"
              >
                {t('dismiss')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const sampleData = `data:text/plain;charset=utf-8,Laboratory Audit Report Certificate\nDocument: ${previewPdf.name}\nAuditor: ${previewPdf.auditor}\nDate: ${previewPdf.date}\nStatus: Verified\nSummary: ${previewPdf.summary}`;
                  const encoded = encodeURI(sampleData);
                  const link = document.createElement('a');
                  link.setAttribute('href', encoded);
                  link.setAttribute('download', previewPdf.name);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setPreviewPdf(null);
                  showToast(isThai ? 'ดาวน์โหลดเอกสารเรียบร้อยแล้ว ✓' : 'Downloaded file ✓');
                }}
                className="px-4 py-2 rounded-xl bg-[#004ac6] text-white font-semibold text-xs hover:bg-[#003ea8] cursor-pointer"
              >
                {t('downloadPdf')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload PDF Modal ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleUploadFile}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#eaedff] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="text-base font-bold text-[#131b2e]">
                {t('uploadPdfBtn')}
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f2f3ff] text-[#505f76] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#505f76]">
                {isThai ? 'ชื่อเอกสารรายงาน (.pdf)' : 'Report File Name (.pdf)'}
              </label>
              <input
                type="text"
                required
                placeholder="Q4_Stack_Emission_Audit.pdf"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="w-full bg-[#f2f3ff] border border-[#dbe1ff] rounded-xl px-3.5 py-2.5 text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] cursor-pointer"
              >
                {t('dismiss')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#004ac6] text-white font-semibold text-xs hover:bg-[#003ea8] cursor-pointer"
              >
                {t('uploadPdfBtn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
