import { useState } from 'react';
import { connectGoogleDrive, pushCatalogToGoogleDrive, pullCatalogFromGoogleDrive, exportTenantSnapshot, importTenantSnapshot } from '../../api/merchantgo.js';
import { getSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';
import { useTheme } from '../../store/theme.jsx';

export default function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const session = getSession();
  const isFree = session?.plan === 'FREE';

  const [driveStatus, setDriveStatus] = useState('');
  const [snapshotStatus, setSnapshotStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handlePushDrive = async () => {
    setDriveStatus(t.common.loading);
    try {
      await pushCatalogToGoogleDrive();
      setDriveStatus('Pushed to Google Drive successfully.');
    } catch (err) {
      setDriveStatus(`Error: ${err.message}`);
    }
  };

  const handlePullDrive = async () => {
    setDriveStatus(t.common.loading);
    try {
      await pullCatalogFromGoogleDrive();
      setDriveStatus('Pulled from Google Drive successfully.');
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
      a.href = url; a.download = `merchantgo-snapshot-${Date.now()}.json`;
      a.click(); URL.revokeObjectURL(url);
      setSnapshotStatus('Snapshot exported.');
    } catch (err) {
      setSnapshotStatus(`Error: ${err.message}`);
    }
  };

  const handleImportSnapshot = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus(t.common.loading);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      const dryResult = await importTenantSnapshot(snapshot, true);
      if (window.confirm(`${dryResult.message}\n\nProceed with import?`)) {
        await importTenantSnapshot(snapshot, false);
        setImportStatus('Snapshot imported successfully.');
      } else {
        setImportStatus('Import cancelled.');
      }
    } catch (err) {
      setImportStatus(`Error: ${err.message}`);
    }
    e.target.value = '';
  };

  const sectionStyle = { marginBottom: '32px' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' };

  return (
    <div style={{ maxWidth: '600px' }}>
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

      <div className="glass-panel" style={sectionStyle}>
        <p style={labelStyle}>{t.settings.theme}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['dark', t.settings.themeDark], ['light', t.settings.themeLight]].map(([val, label]) => (
            <button key={val} onClick={() => setTheme(val)} className={theme === val ? 'btn-pos' : 'btn-secondary'} style={{ padding: '8px 20px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={sectionStyle}>
        <p style={labelStyle}>{t.settings.googleDrive}</p>
        {isFree ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => connectGoogleDrive()} className="btn-secondary">{t.settings.connectDrive}</button>
            <button onClick={handlePushDrive} className="btn-secondary">{t.settings.pushDrive}</button>
            <button onClick={handlePullDrive} className="btn-secondary">{t.settings.pullDrive}</button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Google Drive sync is available for FREE plan users only.</p>
        )}
        {driveStatus && <p style={{ marginTop: '12px', fontSize: '0.85rem', color: driveStatus.startsWith('Error') ? '#ff8585' : '#00ff66' }}>{driveStatus}</p>}
      </div>

      <div className="glass-panel" style={sectionStyle}>
        <p style={labelStyle}>{t.settings.snapshot}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportSnapshot} className="btn-secondary">{t.settings.exportSnapshot}</button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            {t.settings.importSnapshot}
            <input type="file" accept="application/json" onChange={handleImportSnapshot} style={{ display: 'none' }} />
          </label>
        </div>
        {snapshotStatus && <p style={{ marginTop: '12px', fontSize: '0.85rem', color: snapshotStatus.startsWith('Error') ? '#ff8585' : '#00ff66' }}>{snapshotStatus}</p>}
        {importStatus && <p style={{ marginTop: '8px', fontSize: '0.85rem', color: importStatus.startsWith('Error') ? '#ff8585' : '#00ff66' }}>{importStatus}</p>}
      </div>
    </div>
  );
}
