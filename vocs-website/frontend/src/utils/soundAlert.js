/**
 * soundAlert.js
 * ============================================================
 * ระบบเล่นเสียงแจ้งเตือนผ่าน Web Audio API (ไม่ต้องโหลดไฟล์เสียงภายนอก)
 * รองรับ:
 * - Warning: เสียงเตือน 2 จังหวะ นุ่มนวล (Chime tone)
 * - Critical / High: เสียงเตือนฉุกเฉิน 3 จังหวะ ชัดเจน (Urgent alarm)
 * - Anti-spam / Cooldown: ป้องกันเสียงดังซ้อนกันถี่เกินไป (ขั้นต่ำ 10 วิ)
 * - Mute / Unmute: บันทึกสถานะลง localStorage
 * - Browser Autoplay Unlock: ปลดล็อค AudioContext อัตโนมัติเมื่อผู้ใช้คลิก
 * ============================================================
 */

const STORAGE_KEY = 'voc_alert_sound_enabled';
const SOUND_COOLDOWN_MS = 10000; // เว้นระยะห่างของเสียงอย่างน้อย 10 วินาที

let audioCtx = null;
let lastSoundPlayedAt = 0;

/**
 * ดึงหรือสร้าง AudioContext แบบ Singleton
 */
function getAudioContext() {
  if (!audioCtx && (typeof window !== 'undefined')) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ปลดล็อค AudioContext เมื่อผู้ใช้คลิกหรือกดปุ่มบนหน้าเว็บครั้งแรก
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }).catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * ตรวจสอบว่าเปิดเสียงแจ้งเตือนอยู่หรือไม่ (Default: true)
 */
export function isSoundEnabled() {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val === 'true';
}

/**
 * เปิด/ปิดเสียงแจ้งเตือน พร้อมแจ้งเตือน component อื่นผ่าน CustomEvent
 */
export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('voc_sound_toggle', { detail: { enabled } }));
}

/**
 * สลับสถานะเปิด/ปิดเสียง
 */
export function toggleSoundEnabled() {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

/**
 * สังเคราะห์เสียงโทนเดี่ยวด้วย Web Audio API
 */
function playTone(ctx, freq, startTime, duration, gainValue = 0.15, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Attack & Decay Envelope
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * เสียงแจ้งเตือนระดับ Warning (Chime นุ่มนวล 2 โน้ต D5 -> A5)
 */
export function playWarningSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 587.33, now, 0.14, 0.15, 'sine');       // D5
  playTone(ctx, 880.00, now + 0.12, 0.25, 0.18, 'sine'); // A5
}

/**
 * เสียงแจ้งเตือนระดับ Critical / High (Alarm ฉุกเฉิน 3 จังหวะ ชัดเจน)
 */
export function playCriticalSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  // 3 Beeps เร่งด่วน
  playTone(ctx, 880.00, now, 0.10, 0.22, 'triangle');        // A5
  playTone(ctx, 1046.50, now + 0.14, 0.12, 0.25, 'triangle'); // C6
  playTone(ctx, 880.00, now + 0.28, 0.22, 0.22, 'triangle');  // A5
}

/**
 * เล่นเสียงแจ้งเตือนตามระดับ (พร้อมระบบ Cooldown กันเสียงรัว)
 * @param {string} level 'Critical' | 'High' | 'Warning'
 * @param {boolean} force ข้ามการเช็ค cooldown (เช่น สำหรับกดปุ่มทดสอบเสียง)
 */
export function triggerAlertSound(level = 'Warning', force = false) {
  if (!isSoundEnabled() && !force) return;

  const now = Date.now();
  if (!force && (now - lastSoundPlayedAt < SOUND_COOLDOWN_MS)) {
    return; // ป้องกันเสียงซ้ำซ้อนใน 10 วินาที
  }

  const isUrgent = level === 'Critical' || level === 'High';
  if (isUrgent) {
    playCriticalSound();
  } else {
    playWarningSound();
  }

  lastSoundPlayedAt = now;
}
