/**
 * HelpScreen — in-app help/manual, available fully offline. Opened from
 * Settings (⚙️). Content mirrors docs/USER-GUIDE.md and docs/FAQ.md.
 */
export default function HelpScreen({ onClose }) {
  return (
    <div className="help-overlay">
      <div className="help-panel">
        <div className="help-header">
          <p className="help-title">Help &amp; Guide</p>
          <button className="log-form-cancel" onClick={onClose}>✕</button>
        </div>

        <div className="help-body">
          <div className="help-callout">
            ⚓ Set up your account and every device <strong>while you have wifi or
            cell signal.</strong> Offshore the app works fully, but you can’t
            create an account or add a brand-new device without connectivity.
          </div>

          <Section title="Getting started">
            <p>Your account holds your boat’s data and syncs it across your
            devices. First launch asks you to create a username and password.</p>
            <p className="help-warn">✍️ Save the <strong>recovery code</strong>
            shown right after signup — somewhere safe that isn’t only on the
            phone. It’s the <strong>only</strong> way back in if you forget your
            password.</p>
            <p>Tip: in your browser, use <em>Share → Add to Home Screen</em> so it
            opens like a real app.</p>
          </Section>

          <Section title="Logging in & Face ID">
            <p>Opening the app asks for your password. To unlock faster, go to
            <strong> ⚙️ Settings → Face ID / fingerprint unlock → Turn on</strong>.
            Your data stays encrypted; your face/finger just releases the key, and
            your password always still works.</p>
          </Section>

          <Section title="Forgot your password?">
            <p>On the login screen tap <strong>Forgot password?</strong>, enter
            your username and recovery code, then set a new password.</p>
          </Section>

          <Section title="The five sections">
            <ul className="help-list">
              <li><strong>Ship’s Stores</strong> — track everything aboard by
              locker; adjust quantities as you use them.</li>
              <li><strong>Voyage Log</strong> — start a voyage and log entries.
              Tap 📍 to fill GPS, or type lat/long. Tap <em>Edit</em> on the
              date/time to backdate a forgotten entry. Export a voyage to PDF.</li>
              <li><strong>Maintenance</strong> — record work done and plan future
              projects with parts lists.</li>
              <li><strong>Provisions</strong> — build lists by category, check off
              what you have, generate shopping lists.</li>
              <li><strong>Ditch Bag</strong> — your abandon-ship checklist and
              procedure.</li>
            </ul>
          </Section>

          <Section title="Offline & syncing">
            <p>Everything works with no signal. Changes sync automatically to your
            other devices and the cloud when you’re back in range. All devices
            logged into the same boat share the same data.</p>
          </Section>

          <Section title="Backups">
            <p>In <strong>⚙️ Settings</strong>: <em>Download Full Backup (JSON)</em>
            for a complete backup you can re-import, <em>Download Excel Backup</em>
            for a readable spreadsheet, and <em>Cloud Backups</em> for automatic
            snapshots you can restore.</p>
          </Section>

          <Section title="Troubleshooting">
            <ul className="help-list">
              <li><strong>App didn’t update?</strong> Reload normally (pull to
              refresh / reopen). <strong>Never</strong> use “Clear Website Data” —
              it erases your local data.</li>
              <li><strong>Other device not syncing?</strong> Make sure both have
              signal and reload each one.</li>
              <li><strong>Adding a device?</strong> Do it with signal — open the
              app on the new device and log in.</li>
            </ul>
          </Section>
        </div>

        <button className="auth-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="help-section">
      <p className="help-section-title">{title}</p>
      {children}
    </div>
  )
}
