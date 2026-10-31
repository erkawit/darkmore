// ข้อมูลระบบ 8 ทิศทาง (0:E, 1:SE, 2:S, 3:SW, 4:W, 5:NW, 6:N, 7:NE)
const DIR_NAMES = [
    'E (ขวา)', 'SE (เฉียงขวาล่าง)', 'S (หน้าตรง)', 'SW (เฉียงซ้ายล่าง)',
    'W (ซ้าย)', 'NW (เฉียงซ้ายบน)', 'N (หันหลัง)', 'NE (เฉียงขวาบน)'
];

const DIR_VECTORS = [
    { x: 1, y: 0 }, { x: 0.7071, y: 0.7071 }, { x: 0, y: 1 }, { x: -0.7071, y: 0.7071 },
    { x: -1, y: 0 }, { x: -0.7071, y: -0.7071 }, { x: 0, y: -1 }, { x: 0.7071, y: -0.7071 }
];

// ตารางตีบวกอาวุธ 8 ระดับ (8-Tier Upgrade Visuals & Stats)
const WEAPON_UPGRADE_TIERS = [
    { level: 0, name: 'ดาบยักษ์เหล็กทมิฬ',   atk: 40,  cost: 100, rate: 100, edgeColor: '#ff2a44', coreColor: '#fb923c', slashRgba: 'rgba(255, 45, 70, 0.65)',  auraColor: null,      auraName: 'ไม่มีออร่า' },
    { level: 1, name: 'ดาบยักษ์คมเพลิงอ่อน', atk: 52,  cost: 150, rate: 95,  edgeColor: '#f97316', coreColor: '#fde047', slashRgba: 'rgba(249, 115, 22, 0.7)',  auraColor: '#fb923c', auraName: 'ประกายเพลิง' },
    { level: 2, name: 'ดาบยักษ์ศิลาคราม',   atk: 66,  cost: 220, rate: 88,  edgeColor: '#38bdf8', coreColor: '#e0f2fe', slashRgba: 'rgba(56, 189, 248, 0.72)', auraColor: '#38bdf8', auraName: 'ไอเย็นวิญญาณ' },
    { level: 3, name: 'ดาบยักษ์เขี้ยวอสรพิษ', atk: 82,  cost: 300, rate: 80,  edgeColor: '#10b981', coreColor: '#a7f3d0', slashRgba: 'rgba(16, 185, 129, 0.75)', auraColor: '#10b981', auraName: 'เพลิงมรกต' },
    { level: 4, name: 'ดาบยักษ์อัสนีม่วง',   atk: 102, cost: 420, rate: 70,  edgeColor: '#a855f7', coreColor: '#f3e8ff', slashRgba: 'rgba(168, 85, 247, 0.78)', auraColor: '#c084fc', auraName: 'สายฟ้าทมิฬ' },
    { level: 5, name: 'ดาบยักษ์ราชันย์ทองคำ', atk: 128, cost: 580, rate: 60,  edgeColor: '#facc15', coreColor: '#ffffff', slashRgba: 'rgba(250, 204, 21, 0.82)', auraColor: '#fde047', auraName: 'รัศมีทองคำ' },
    { level: 6, name: 'ดาบยักษ์โลหิตอสูร',   atk: 160, cost: 780, rate: 50,  edgeColor: '#e11d48', coreColor: '#fecdd3', slashRgba: 'rgba(225, 29, 72, 0.85)',  auraColor: '#f43f5e', auraName: 'พายุโลหิต' },
    { level: 7, name: 'ดาบยักษ์ดาราจักร',   atk: 200, cost: 1050,rate: 40,  edgeColor: '#ec4899', coreColor: '#67e8f9', slashRgba: 'rgba(236, 72, 153, 0.88)', auraColor: '#e879f9', auraName: 'เนบิวลาดารา' },
    { level: 8, name: 'ดาบยักษ์เทพอสูรโซลฟอร์จ', atk: 265, cost: 0, rate: 100, edgeColor: '#ff003c', coreColor: '#fef08a', slashRgba: 'rgba(255, 0, 60, 0.92)',   auraColor: '#ff0055', auraName: 'ออร่าเทพอสูรสูงสุด (MAX)' }
];

function getDir8(dx, dy, fallbackDir) {
    if (Math.hypot(dx, dy) < 0.05) return fallbackDir;
    const angle = Math.atan2(dy, dx);
    let idx = Math.round(angle / (Math.PI / 4));
    if (idx < 0) idx += 8;
    return idx % 8;
}

function getDirConfig(dir) {
    switch (dir) {
        case 2: return { view: 'front', flipX: 1, isUp: false };
        case 6: return { view: 'back',  flipX: 1, isUp: true };
        case 1: return { view: 'diagDown', flipX: 1, isUp: false };
        case 3: return { view: 'diagDown', flipX: -1, isUp: false };
        case 0: return { view: 'side', flipX: 1, isUp: false };
        case 4: return { view: 'side', flipX: -1, isUp: false };
        case 7: return { view: 'diagUp', flipX: 1, isUp: true };
        case 5: return { view: 'diagUp', flipX: -1, isUp: true };
        default: return { view: 'front', flipX: 1, isUp: false };
    }
}