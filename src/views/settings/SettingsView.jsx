import { useState } from 'react';
import {
  connectGoogleDrive,
  exportTenantSnapshot,
  fetchGoogleDriveSnapshot,
  importTenantSnapshot,
  pushCatalogToGoogleDrive,
} from '../../api/merchantgo.js';
import { getSession, getSelectedTenant } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';
import { useTheme } from '../../store/theme.jsx';

const COLLECTION_LABELS = {
  menuItems: 'Menu Items',
  branches: 'Branches',
  staffProfiles: 'Staff Display Records',
  closedShiftOrders: 'Closed-Shift Orders',
  closedShifts: 'Closed Shifts',
  zReports: 'Z-Reports',
};

export default function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const session = getSession();
  const currentTenant = getSelectedTenant(session);
  const userRole = currentTenant?.role || session?.role || 'staff';
  const canChangeTheme = ['cashier', 'manager', 'admin', 'owner'].includes(userRole.toLowerCase());
  const isFree = session?.plan === 'FREE';

  const [driveStatus, setDriveStatus] = useState('');
  const [snapshotStatus, setSnapshotStatus] = useState('');
  const [mergeStatus, setMergeStatus] = useState('');
  const [pendingSnapshot, setPendingSnapshot] = useState(null);
  const [pendingSource, setPendingSource] = useState('');
  const [mergePreview, setMergePreview] = useState(null);
  const [resolutions, setResolutions] = useState({});

  const unresolvedConflicts = (mergePreview?.conflicts || []).filter((conflict) => {
    const resolution = resolutions[conflict.key];
    return !resolution || !conflict.allowedResolutions.includes(resolution);
  }).length;

  const handlePushDrive = async () => {
    setDriveStatus(t.common.loading);
    try {
      await pushCatalogToGoogleDrive();
      setDriveStatus(t.settings.pushSuccess);
    } catch (err) {
      setDriveStatus(`Error: ${err.message}`);
    }
  };

  const handlePreviewSnapshot = async (snapshot, sourceLabel) => {
    setMergeStatus(t.common.loading);
    setResolutions({});
    try {
      const preview = await importTenantSnapshot(snapshot, true, {});
      setPendingSnapshot(snapshot);
      setPendingSource(sourceLabel);
      setMergePreview(preview);
      setMergeStatus(preview.message);
    } catch (err) {
      setPendingSnapshot(null);
      setPendingSource('');
      setMergePreview(null);
      setMergeStatus(`Error: ${err.message}`);
    }
  };

  const handlePreviewDrive = async () => {
    setDriveStatus(t.common.loading);
    try {
      const snapshot = await fetchGoogleDriveSnapshot();
      await handlePreviewSnapshot(snapshot, t.settings.connectedSnapshot);
      setDriveStatus(t.settings.previewLoaded);
    } catch (err) {
      setDriveStatus(`Error: ${err.message}`);
    }
  };

  const handleExportSnapshot = async () => {
    setSnapshotStatus(t.common.loading);
    try {
      const { snapshot } = await exportTenantSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merchantgo-snapshot-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnapshotStatus(t.settings.exportSuccess);
    } catch (err) {
      setSnapshotStatus(`Error: ${err.message}`);
    }
  };

  const handleImportSnapshot = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      await handlePreviewSnapshot(JSON.parse(text), file.name);
    } catch (err) {
      setMergeStatus(`Error: ${err.message}`);
    }
    event.target.value = '';
  };

  const handleCommitMerge = async () => {
    if (!pendingSnapshot) return;
    setMergeStatus(t.common.loading);
    try {
      const result = await importTenantSnapshot(pendingSnapshot, false, resolutions);
      setMergePreview(result);
      setPendingSnapshot(null);
      setPendingSource('');
      setResolutions({});
      setMergeStatus(result.message);
    } catch (err) {
      setMergeStatus(`Error: ${err.message}`);
    }
  };

  const handleResetPreview = () => {
    setPendingSnapshot(null);
    setPendingSource('');
    setMergePreview(null);
    setResolutions({});
    setMergeStatus('');
  };

  const sectionStyle = { marginBottom: '32px' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' };
  const statusColor = (message) => (message.startsWith('Error') ? 'var(--accent-error)' : 'var(--accent-success)');

  return (
    <div style={{ maxWidth: '780px' }}>
      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '32px' }}>{t.settings.title}</h2>

      <div className="glass-panel" style={sectionStyle}>
        <p style={labelStyle}>{t.settings.language}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['en', 'English'], ['es', 'Español']].map(([code, label]) => (
            <button key={code} onClick={() => setLang(code)} className={lang === code ? 'btn-pos' : 'btn-secondary'} style={{ padding: '8px 20px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {canChangeTheme && (
        <div className="glass-panel" style={sectionStyle}>
          <p style={labelStyle}>{t.settings.theme}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              ['dark-default', t.settings.themeDark || 'Dark'], 
              ['light-default', t.settings.themeLight || 'Light'],
              ['dark-ocean', 'Ocean (Dark)'],
              ['light-warm', 'Warm (Light)']
            ].map(([val, label]) => (
              <button key={val} onClick={() => setTheme(val)} className={theme === val ? 'btn-pos' : 'btn-secondary'} style={{ padding: '8px 20px' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={sectionStyle}>
        <p style={labelStyle}>{t.settings.googleDrive}</p>
        {isFree ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => connectGoogleDrive()} className="btn-secondary">{t.settings.connectDrive}</button>
            <button onClick={handlePushDrive} className="btn-secondary">{t.settings.pushDrive}</button>
            <button onClick={handlePreviewDrive} className="btn-secondary">{t.settings.previewDrive}</button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Google Drive sync is available for FREE plan users only.</p>
        )}
        {driveStatus && <p style={{ marginTop: '12px', fontSize: '0.85rem', color: statusColor(driveStatus) }}>{driveStatus}</p>}
      </div>

      <div className="glass-panel" style={sectionStyle}>
        <p style={labelStyle}>{t.settings.snapshot}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportSnapshot} className="btn-secondary">{t.settings.exportSnapshot}</button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            {t.settings.importSnapshot}
            <input type="file" accept="application/json" onChange={handleImportSnapshot} style={{ display: 'none' }} />
          </label>
          {mergePreview && (
            <button onClick={handleResetPreview} className="btn-secondary">{t.settings.clearPreview}</button>
          )}
        </div>
        {snapshotStatus && <p style={{ marginTop: '12px', fontSize: '0.85rem', color: statusColor(snapshotStatus) }}>{snapshotStatus}</p>}
      </div>

      {mergePreview && (
        <div className="glass-panel" style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={labelStyle}>{t.settings.mergePreview}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{pendingSource || t.settings.previewReady}</p>
            </div>
            {pendingSnapshot && (
              <button
                onClick={handleCommitMerge}
                className="btn-pos"
                disabled={unresolvedConflicts > 0}
                style={{ justifyContent: 'center', opacity: unresolvedConflicts > 0 ? 0.65 : 1 }}
              >
                {t.settings.commitMerge}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            {Object.entries(mergePreview.counts || {}).map(([key, value]) => (
              <div key={key} style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 14px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{COLLECTION_LABELS[key] || key}</p>
                <p style={{ fontFamily: 'Outfit', fontSize: '1.15rem', fontWeight: 700 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            {Object.entries(mergePreview.collections || {}).map(([key, value]) => (
              <div key={key} style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 14px' }}>
                <p style={{ fontWeight: 700, marginBottom: '8px' }}>{COLLECTION_LABELS[key] || key}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {Object.entries(value).map(([metric, amount]) => (
                    <span key={metric}>{metric}: <strong style={{ color: 'var(--text-main)' }}>{amount}</strong></span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {mergePreview.conflicts?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: '#ffb366', fontWeight: 700 }}>{t.settings.conflictsFound.replace('{count}', String(mergePreview.conflicts.length))}</p>
              {mergePreview.conflicts.map((conflict) => (
                <div key={conflict.key} style={{ border: '1px solid rgba(255,107,0,0.22)', borderRadius: '12px', padding: '14px 16px', backgroundColor: 'rgba(255,107,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{conflict.label || conflict.id}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{COLLECTION_LABELS[conflict.collection] || conflict.collection}</p>
                    </div>
                    <select
                      value={resolutions[conflict.key] || ''}
                      onChange={(event) => setResolutions((current) => ({ ...current, [conflict.key]: event.target.value }))}
                      style={{ minWidth: '180px', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-glass)', backgroundColor: 'var(--glass-overlay)', color: 'var(--text-main)' }}
                    >
                      <option value="">{t.settings.selectResolution}</option>
                      {conflict.allowedResolutions.includes('keep_current') && <option value="keep_current">{t.settings.keepCurrent}</option>}
                      {conflict.allowedResolutions.includes('use_snapshot') && <option value="use_snapshot">{t.settings.useImported}</option>}
                    </select>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Current: <code>{conflict.currentRevision}</code></p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Incoming: <code>{conflict.incomingRevision}</code></p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{t.settings.noConflicts}</p>
          )}

          {mergeStatus && <p style={{ marginTop: '16px', fontSize: '0.85rem', color: statusColor(mergeStatus) }}>{mergeStatus}</p>}
          {pendingSnapshot && unresolvedConflicts > 0 && (
            <p style={{ marginTop: '8px', color: '#ffb366', fontSize: '0.82rem' }}>{t.settings.resolveBeforeCommit}</p>
          )}
        </div>
      )}
    </div>
  );
}
