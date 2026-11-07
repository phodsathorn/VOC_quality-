import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-[#1e293b]">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-[#0f172a] mb-1">
              เกิดข้อผิดพลาดในการแสดงผล
            </h2>
            <p className="text-sm text-[#64748b] mb-1">
              Application Rendering Error
            </p>
            <p className="text-xs text-[#94a3b8] mb-6">
              ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิด กรุณารีโหลดหน้าเว็บ หรือลองอีกครั้ง
            </p>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#004ac6] hover:bg-[#003896] text-white font-medium rounded-xl shadow-sm transition-colors text-sm"
            >
              <RefreshCw size={16} />
              <span>รีโหลดหน้านี้ / Reload Page</span>
            </button>

            {this.state.error && (
              <details className="mt-4 text-left border-t border-[#f1f5f9] pt-3 text-xs text-slate-500">
                <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">
                  รายละเอียดข้อผิดพลาด (Technical Details)
                </summary>
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg font-mono text-[11px] overflow-auto max-h-36 border border-slate-200">
                  <p className="text-rose-600 font-bold mb-1">{this.state.error.toString()}</p>
                  <pre className="text-slate-500 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
