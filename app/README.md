# SSPO Patient Model Request

เว็บแอปสำหรับขอใช้ผู้ป่วยต้นแบบ (ครูต้นแบบ) ในการเรียนการสอน
React + Vite + Firebase (Auth + Firestore) deploy บน Vercel และ**สำรองข้อมูลไป Google Drive ทุกวัน**

## สิทธิ์การใช้งาน

| ความสามารถ | User | Admin |
|---|:-:|:-:|
| ดูรายชื่อผู้ป่วย ค้นหาตามชนิดอุปกรณ์ ระดับความเหมาะสม และวันที่ว่าง | ✓ | ✓ |
| เลือกผู้ป่วยแล้วส่งคำขอ (มีเตือนเมื่อนัดซ้อน) | ✓ | ✓ |
| ดูคำขอ | เฉพาะของตัวเอง | ทั้งหมด |
| ยกเลิกคำขอ | เฉพาะตอนสถานะ Pending | ทุกสถานะ |
| อนุมัติ / ไม่อนุมัติ / บันทึกว่าเสร็จสิ้น | – | ✓ |
| จัดการผู้ป่วย นำเข้า-ส่งออก Excel และดูเบอร์โทร | – | ✓ |
| อนุมัติบัญชี ตั้ง Admin และระงับบัญชี | – | ✓ |
| ดาวน์โหลดสำรองข้อมูลทั้งหมดเป็นไฟล์ Excel (ปุ่มในหน้า Dashboard) | – | ✓ |

## ติดตั้งครั้งแรก
1. **Firebase Console → Authentication → Sign-in method** เปิด *Email/Password*
2. **Firestore Database → Rules** วางเนื้อหาไฟล์ `firestore.rules` แล้วกด *Publish*
3. **ตั้ง Admin คนแรก:** สมัครบัญชีผ่านหน้าเว็บ แล้วไปที่ Firestore → `users` → เอกสารของคุณ
   แก้ `role` = `Admin` และ `status` = `active`
4. รันในเครื่อง: `npm install` แล้ว `npm run dev`
5. Deploy: push ขึ้น GitHub ที่เชื่อมกับ Vercel (Build command `npm run build` / Output `dist`)
6. **สำรองข้อมูลไป Google Drive:** ทำตาม [google-drive-backup/README.md](google-drive-backup/README.md)

## การเก็บข้อมูล
- ข้อมูลหลักเก็บใน Firestore แบ่งเป็น `users`, `patients`, `requests`, `notifications` และอัปเดตแบบ real-time
- **สำรองอัตโนมัติ:** Google Apps Script คัดลอกข้อมูลทั้งหมดไปที่ Google Drive ในโฟลเดอร์ "SSPO Backups" ทุกวัน ได้ไฟล์ Google Sheet และ JSON และเก็บย้อนหลัง 30 วัน
- **สำรองเอง:** Admin กดปุ่ม *Download full backup* ในหน้า Dashboard ได้ทุกเมื่อ จะได้ไฟล์ Excel ไฟล์เดียวที่มีครบ 3 แท็บ
- รายการที่เลือกไว้ในตะกร้า และแบบฟอร์มที่กรอกค้าง จะจำไว้ในเบราว์เซอร์ของแต่ละคน

## โครงสร้าง
```
src/
  firebase.js            การตั้งค่า Firebase
  data.js                ทุกคำสั่งอ่าน/เขียน Firestore
  App.jsx, pages/, components/
firestore.rules          กฎสิทธิ์ Admin/User ที่ฐานข้อมูล
google-drive-backup/     สคริปต์สำรองข้อมูลไป Google Drive
```
