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
| ดูรายละเอียดผู้ป่วยครบทุกช่อง รวมเบอร์โทรและวันเกิด | ✓ | ✓ |
| จัดการผู้ป่วย นำเข้า-ส่งออก Excel | – | ✓ |
| อนุมัติบัญชี ตั้ง Admin และระงับบัญชี | – | ✓ |
| ดาวน์โหลดสำรองข้อมูลทั้งหมดเป็นไฟล์ Excel (ปุ่มในหน้า Dashboard) | – | ✓ |

### หน้าตาแยกตามบทบาท
- **Admin** ใช้ธีมสีม่วงคราม (indigo) แถบเมนูสีเข้ม มีป้าย **Admin mode** ด้านบน และเมนูหมวด *Administration* (Manage Patients / Manage Requests / Manage Users)
- **User** ใช้ธีมสีเขียวอมฟ้า (teal) แถบเมนูสีขาว มีป้าย **User** และเมนูหมวด *Book patient models*
- Admin Dashboard มีกล่อง **Waiting for your approval** อนุมัติ/ไม่อนุมัติคำขอและบัญชีใหม่ได้ในคลิกเดียว
- Admin แก้รายละเอียดคำขอได้ (วัน เวลา สถานที่ ฯลฯ — ถ้าอนุมัติแล้ว การจองของผู้ป่วยย้ายตามให้) และ Reopen คำขอที่ถูกปฏิเสธ/ยกเลิกกลับเป็น Pending ได้
- Admin ซ่อน/เปิดผู้ป่วยให้จองได้จากหน้ารายละเอียดผู้ป่วย
- กดชื่อคำขอหรือปุ่ม **Details & contacts** เพื่อดูสรุปคำขอ ข้อมูลผู้ขอ และเบอร์โทรของครูต้นแบบทุกคน พร้อมปุ่ม **Copy summary** ไว้วางใน LINE หรืออีเมล

## ติดตั้งครั้งแรก
1. **Firebase Console → Authentication → Sign-in method** เปิด *Email/Password*
2. **Firestore Database → Rules** วางเนื้อหาไฟล์ `firestore.rules` แล้วกด *Publish*
3. **ตั้ง Admin คนแรก:** สมัครบัญชีผ่านหน้าเว็บ แล้วไปที่ Firestore → `users` → เอกสารของคุณ
   แก้ `role` = `Admin` และ `status` = `active`
4. รันในเครื่อง: `npm install` แล้ว `npm run dev`
5. Deploy: push ขึ้น GitHub ที่เชื่อมกับ Vercel (Build command `npm run build` / Output `dist`)
6. **สำรองข้อมูลไป Google Drive:** ทำตาม [google-drive-backup/README.md](google-drive-backup/README.md)

## ข้อมูลครูต้นแบบ
- ฟอร์ม *Add patient / Edit* มีช่องครบทุกคอลัมน์ของไฟล์ **SSPO patient Bank.xlsx** แบ่งเป็นหมวด
  - **General information** – ID/Code (เลือกชนิดอุปกรณ์แล้วเติมรหัสถัดไปให้อัตโนมัติ), HN, เพศ, วันเกิด (คำนวณอายุให้เอง), จังหวัด, โรคประจำตัว, เบอร์โทร 2 เบอร์
  - **Amputation & residual limb** (กายอุปกรณ์เทียม PFP–SD) / **Orthotic assessment** (FO, AFO, KAFO ฯลฯ) / **Scoliosis / spinal assessment** (SO) – แสดงเฉพาะหมวดที่ตรงกับชนิดอุปกรณ์
  - **Function, device use & travel** และ **Teaching use & notes**
- ช่องส่วนใหญ่พิมพ์เองหรือเลือกจากรายการแนะนำได้ ข้อมูลทางคลินิกเก็บใน `patients/{id}.details`
- **รูปประกอบอัตโนมัติตามเพศและช่วงอายุ** (ภาพวาดใบหน้าแบบสีสันสมจริง) (เด็ก 0–12, วัยรุ่น 13–19, ผู้ใหญ่ 20–59, ผู้สูงอายุ 60+) ไฟล์อยู่ที่ `public/avatars/*.svg` ถ้าใส่ Photo URL จะใช้รูปนั้นแทน
- หน้า Patient Directory กรองตามเพศและช่วงอายุได้
- Export / Excel template ใช้หัวคอลัมน์เดียวกับไฟล์ patient bank จึงแก้ใน Excel แล้ว Import กลับได้ (จับคู่ด้วย ID/Code → HN → ชื่อ)
- ผู้ป่วยที่นำเข้าไว้ก่อนหน้า ข้อมูลจากคอลัมน์ Excel เดิมจะแสดงในหมวดใหม่ให้อัตโนมัติ

## Patient Dashboard
- เมนู **Patient Dashboard** (ทุกคนเห็น) สรุปจำนวนครูต้นแบบ: ทั้งหมด / ว่างให้จอง / กายอุปกรณ์เทียม / กายอุปกรณ์เสริม / ดามหลัง
- ตารางตามชนิดอุปกรณ์ (แยกชาย-หญิง พร้อมร้อยละ) จัดกลุ่ม Prosthesis / Orthosis / Spinal — คลิกแถวเพื่อเปิดรายชื่อผู้ป่วยชนิดนั้น
- กราฟตามช่วงอายุแยกเพศ และตามจังหวัด (10 อันดับแรก) สลับดู "All patients / Available only" และ Export สรุปเป็น Excel ได้
- ผู้ขอใช้ (request) ไม่ต้องกรอกจำนวนนักศึกษาแล้ว

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
