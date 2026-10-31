# ⚔️ Soul Vanguard - 8-Directional Chibi Action RPG

โปรเจกต์เกมแนว **Dark Fantasy Action RPG** สไตล์ Chibi สุดเท่ พัฒนาขึ้นด้วย **HTML5 Canvas & Vanilla JavaScript (Modular Architecture)** รองรับการเดินและการแสดงผลแอนิเมชันแบบ **8 ทิศทางจริง (8-Directional Rendering)** พร้อมระบบโรงตีเหล็กอัญมณีวิญญาณ (`+0` ถึง `+8`) ที่ช่วยเปลี่ยนสีใบดาบ คลื่นพลังงาน และออร่ารอบตัวละครแบบเรียลไทม์!

---

## 📂 Project Structure (โครงสร้างโปรเจกต์)

โปรเจกต์ถูกแบ่งออกเป็นโมดูลเพื่อความเป็นระเบียบและช่วยให้โหลดหน้าเว็บได้อย่างรวดเร็ว:

```text
chibi-vanguard/
├── index.html          # โครงสร้างหลัก, หน้า Loading Screen (วงเวทย์รูน), HUD และ Bootloader
├── css/
│   └── style.css       # กราฟิก UX/UI ธีม Dark Fantasy, หลอดเลือดแก้วเจียระไน และหน้าต่างตีบวก
└── js/
    ├── data.js         # ข้อมูลทิศทาง 8 มุม, ตารางตีบวกอาวุธ (+0 ถึง +8), และค่าสเตตัสมอนสเตอร์/บอส
    ├── renderer.js     # Engine วาดตัวละคร Chibi, มอนสเตอร์, บอส 8 ทิศทาง + ระบบออร่าอาวุธ
    ├── ui.js           # ระบบจัดการ HUD, วาดภาพ Portrait ตัวละครสด, และระบบโรงตีเหล็ก (Soul Forge)
    └── main.js         # ระบบควบคุม 8 ทิศทาง, ฟิสิกส์, ระบบ Hit Stagger, AI และ Game Loop
