import React from 'react';
import { Activity, Clock, Zap, RefreshCw } from 'lucide-react';

export default function DashboardSkeleton({ isColdStarting = false, onRetry }) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Cold start helpful notice if backend takes > 2.5s */}
      {isColdStarting && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          marginBottom: '1.25rem',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Zap size={18} className="animate-pulse" color="#2563eb" />
            <div>
              <span style={{ fontWeight: 650, fontSize: '0.875rem' }}>
                กำลังเชื่อมต่อและปลุกระบบคลาวด์ Backend (Render Cold-Start)
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#3b82f6' }}>
                เมื่อเปิดใช้งานครั้งแรกหลังจากไม่ได้ใช้งาน คลาวด์ฟรีจะใช้เวลาบูตระบบประมาณ 15–30 วินาที...
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '0.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
              }}
            >
              <RefreshCw size={13} /> ลองใหม่
            </button>
          )}
        </div>
      )}

      {/* Header Skeleton */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="skeleton" style={{ width: '160px', height: '32px', borderRadius: '0.5rem' }} />
          <div className="skeleton" style={{ width: '110px', height: '32px', borderRadius: '0.5rem' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '0.5rem' }} />
          <div className="skeleton" style={{ width: '140px', height: '32px', borderRadius: '0.5rem' }} />
        </div>
      </div>

      {/* Top Metric Cards Skeleton Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* Metric 1: TVOC */}
        <div className="skeleton-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="skeleton" style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '45px', height: '18px', borderRadius: '99px' }} />
          </div>
          <div className="skeleton" style={{ width: '120px', height: '38px', borderRadius: '6px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
        </div>

        {/* Metric 2: PM2.5 */}
        <div className="skeleton-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '45px', height: '18px', borderRadius: '99px' }} />
          </div>
          <div className="skeleton" style={{ width: '100px', height: '38px', borderRadius: '6px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '110px', height: '12px', borderRadius: '4px' }} />
        </div>

        {/* Metric 3: eCO2 */}
        <div className="skeleton-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="skeleton" style={{ width: '50px', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '45px', height: '18px', borderRadius: '99px' }} />
          </div>
          <div className="skeleton" style={{ width: '110px', height: '38px', borderRadius: '6px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '85px', height: '12px', borderRadius: '4px' }} />
        </div>

        {/* Metric 4: Temp / RH */}
        <div className="skeleton-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '45px', height: '18px', borderRadius: '99px' }} />
          </div>
          <div className="skeleton" style={{ width: '130px', height: '38px', borderRadius: '6px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '95px', height: '12px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* AI Classifier + Trend Section Skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* Left: AI Classification Skeleton */}
        <div className="skeleton-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '180px', height: '18px', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
            <div className="skeleton" style={{ width: '180px', height: '100px', borderRadius: '90px 90px 0 0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div className="skeleton" style={{ width: '100%', height: '16px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '70%', height: '14px', borderRadius: '4px' }} />
          </div>
        </div>

        {/* Right: Main Sensor Chart Skeleton */}
        <div className="skeleton-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div className="skeleton" style={{ width: '160px', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '90px', height: '18px', borderRadius: '4px' }} />
          </div>
          <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Bottom Alert Feed Skeleton */}
      <div className="skeleton-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="skeleton" style={{ width: '140px', height: '18px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  );
}

