-- ===========================================================================
-- Seed demo — Agent 3 (Backend data)
-- Một gia đình Việt: mẹ 31, bố 35. Thai kỳ hiện tại tuần 20 (LMP 2026-03-16,
-- EDD 2026-12-21 theo Naegele) + bé trai 9 tháng (Minh, sinh 2025-11-03).
--
-- Chạy: `supabase db reset` (seed chạy sau migrations, quyền postgres) hoặc:
--   psql "$DATABASE_URL" -f supabase/seed/seed.sql
--
-- Lưu ý:
-- - Id chính (family, users, pregnancy, fetus, child, birth, session, quiz) là
--   UUID cố định để test RLS được lặp lại; các bảng còn lại dùng gen_random_uuid().
-- - `set session_replication_role = 'replica'` tắt trigger (kể cả handle_new_family
--   — nếu để trigger, auth.uid() null sẽ làm insert family thất bại). Đòi quyền
--   superuser (postgres khi chạy seed).
-- - KHÔNG chứa định danh thật (email dùng domain giả @demo.vi).
-- ===========================================================================

begin;

create extension if not exists pgcrypto;

set session_replication_role = 'replica';

-- ---- profiles ----
-- auth.users KHÔNG seed trực tiếp (INSERT thủ công làm GoTrue lỗi đọc schema —
-- xác minh 2026-08-29). User demo tạo qua Admin API (scripts/supabase-provision.sh)
-- rồi ánh xạ id user mới vào các bảng public bằng đoạn remap ở cuối script.
insert into public.profiles (id, full_name, avatar_url, phone, birth_date, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000002', 'Mẹ', null, null, '1995-04-12', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'Bố', null, null, '1991-08-30', now(), now());

-- ---- families + family_members + privacy_settings ----
insert into public.families (id, name, code, created_at, updated_at)
values ('10000000-0000-0000-0000-000000000001', 'Gia đình Việt', 'MEVABE', now(), now());

insert into public.family_members (id, family_id, user_id, role, invited_at, joined_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'owner', now(), now(), now(), now()),
  ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'member', now(), now(), now(), now());

insert into public.privacy_settings (id, family_id, share_measurements, share_symptoms, share_documents, share_chat, updated_at)
values ('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', true, true, true, true, now());

-- ---- Thai kỳ ----
insert into public.pregnancies (id, family_id, private_owner_id, lmp, edd, status, source, notes, created_at, updated_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, '2026-03-16', '2026-12-21', 'ongoing', 'manual', 'Thai kỳ thứ 2, mẹ khỏe mạnh.', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, '2025-02-01', '2025-11-08', 'birth_recorded', 'manual', 'Thai kỳ sinh bé Minh.', now(), now());

insert into public.fetuses (id, family_id, private_owner_id, pregnancy_id, name, sex, birth_order, notes, created_at, updated_at)
values ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', null, '20000000-0000-0000-0000-000000000001', null, 'unknown', 1, null, now(), now());

insert into public.health_profiles (id, family_id, private_owner_id, pregnancy_id, height_cm, pre_pregnancy_weight_kg, blood_type, allergies, preexisting_conditions, notes, created_at, updated_at)
values ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', null, '20000000-0000-0000-0000-000000000001', 158, 52, 'O+', array['Hải sản'], array[]::text[], 'Không có bệnh lý nền.', now(), now());

insert into public.maternal_measurements (family_id, pregnancy_id, type, value, unit, diastolic, taken_at, note, source, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 52, 'kg', null, '2026-05-11T07:00:00+07:00', 'Tuần 8', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 52.5, 'kg', null, '2026-05-25T07:00:00+07:00', 'Tuần 10', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 53, 'kg', null, '2026-06-08T07:00:00+07:00', 'Tuần 12', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_pressure', 115, 'mmHg', 75, '2026-06-08T08:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 53.8, 'kg', null, '2026-06-22T07:00:00+07:00', 'Tuần 14', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 54.2, 'kg', null, '2026-06-29T07:00:00+07:00', 'Tuần 15', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 54.8, 'kg', null, '2026-07-06T07:00:00+07:00', 'Tuần 16', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_pressure', 118, 'mmHg', 76, '2026-07-06T08:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_glucose', 5.2, 'mmol/L', null, '2026-07-06T09:00:00+07:00', 'Đường huyết lúc đói', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 55.4, 'kg', null, '2026-07-13T07:00:00+07:00', 'Tuần 17', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 56, 'kg', null, '2026-07-20T07:00:00+07:00', 'Tuần 18', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 56.6, 'kg', null, '2026-07-27T07:00:00+07:00', 'Tuần 19', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'weight', 57.2, 'kg', null, '2026-08-03T07:00:00+07:00', 'Tuần 20', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_pressure', 120, 'mmHg', 78, '2026-08-03T08:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_glucose', 5.4, 'mmol/L', null, '2026-08-03T09:00:00+07:00', 'Đường huyết lúc đói', 'manual', now(), now());

insert into public.symptom_reports (family_id, private_owner_id, pregnancy_id, symptom, severity, started_at, ended_at, note, source, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Buồn nôn buổi sáng', 'mild', '2026-05-11T08:00:00+07:00', '2026-06-22T08:00:00+07:00', 'Giảm dần sau tuần 13', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Mệt mỏi', 'mild', '2026-05-15T09:00:00+07:00', '2026-07-06T09:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Đau lưng nhẹ', 'mild', '2026-07-20T10:00:00+07:00', null, 'Tập yoga bầu giúp đỡ hơn', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Ợ nóng', 'mild', '2026-07-27T18:00:00+07:00', null, 'Ăn chậm và chia bữa nhỏ', 'manual', now(), now());

insert into public.fetal_movement_logs (family_id, pregnancy_id, felt_at, feeling, duration_min, note, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-07-29T21:30:00+07:00', 'normal', null, 'Bé đạp nhẹ nhàng', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-07-30T22:15:00+07:00', 'normal', null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-08-01T08:10:00+07:00', 'normal', null, 'Sau bữa sáng bé cử động đều', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-08-02T21:40:00+07:00', 'normal', null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-08-03T07:25:00+07:00', 'normal', null, 'Buổi sáng đạp nhẹ vài cái', now(), now());

insert into public.appointments (family_id, pregnancy_id, type, scheduled_at, location, doctor, summary_before, outcome, notes, followup_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'first_visit', '2026-04-27T09:00:00+07:00', 'Bệnh viện Phụ sản Hà Nội', 'TS.BS Nguyễn Thu Hà', null, 'Xác nhận thai 6 tuần, tim thai rõ', null, '2026-06-08T09:00:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'ultrasound', '2026-06-08T09:00:00+07:00', 'Bệnh viện Phụ sản Hà Nội', 'TS.BS Nguyễn Thu Hà', null, 'NT 1.2 mm — kết quả bình thường', null, '2026-07-06T09:00:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'screening', '2026-07-06T09:00:00+07:00', 'Bệnh viện Phụ sản Hà Nội', null, null, 'Nguy cơ thấp, bé khỏe', null, '2026-08-10T08:30:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'ultrasound', '2026-08-10T08:30:00+07:00', 'Bệnh viện Phụ sản Hà Nội', 'TS.BS Nguyễn Thu Hà', 'Mốc quan trọng khảo sát toàn bộ cơ quan thai nhi.', null, null, '2026-08-24T09:00:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'prenatal', '2026-08-24T09:00:00+07:00', 'Bệnh viện Phụ sản Hà Nội', null, 'Đánh giá kết quả siêu âm hình thái', null, null, '2026-09-28T07:30:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_test', '2026-09-28T07:30:00+07:00', 'Bệnh viện Phụ sản Hà Nội', null, 'Nhịn ăn trước xét nghiệm 8 tiếng', null, null, '2026-10-05T14:00:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'vaccination', '2026-10-05T14:00:00+07:00', 'Trạm y tế phường', null, null, null, null, '2026-11-02T14:00:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'vaccination', '2026-11-02T14:00:00+07:00', 'Trạm y tế phường', null, null, null, null, '2026-12-14T09:00:00+07:00', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'blood_test', '2026-12-14T09:00:00+07:00', 'Bệnh viện Phụ sản Hà Nội', null, 'Xét nghiệm liên cầu khuẩn nhóm B', null, null, null, now(), now());

insert into public.document_records (family_id, private_owner_id, pregnancy_id, title, file_name, file_url, status, notes, source, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Kết quả siêu âm thai 12 tuần', 'sieu-am-12-tuan.pdf', null, 'ready', 'Độ mờ da gáy 1.2 mm; nhịp tim 156 lần/phút.', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Kết quả xét nghiệm sàng lọc 16 tuần', 'xet-nghiem-sang-loc-16-tuan.pdf', null, 'ready', 'Nguy cơ Trisomy 21 thấp.', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Biên bản siêu âm hình thái 20 tuần', 'sieu-am-hinh-thai-20-tuan.jpg', null, 'uploaded', 'Đang chờ trích xuất chỉ số.', 'document', now(), now());

-- ---- Dinh dưỡng ----
insert into public.meal_entries (family_id, meal_type, name, logged_at, calories, note, source, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'breakfast', 'Bánh mì trứng ốp la + sữa đậu nành', '2026-08-02T07:00:00+07:00', null, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'lunch', 'Cơm cá kho tộ + canh cua mồng tơi', '2026-08-02T12:00:00+07:00', null, 'Cá kho đậm đà', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'dinner', 'Bún riêu cua', '2026-08-02T18:30:00+07:00', null, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'breakfast', 'Phở gà', '2026-08-03T07:00:00+07:00', null, 'Thêm hành, rau sống', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'snack', 'Sữa chua + chuối', '2026-08-03T09:30:00+07:00', null, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'lunch', 'Cơm gà luộc + canh rau ngót nấu thịt băm', '2026-08-03T12:00:00+07:00', null, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'snack', 'Đu đủ chín + hạt óc chó', '2026-08-03T15:30:00+07:00', null, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'dinner', 'Cháo thịt bằm + rau cải xanh luộc', '2026-08-03T18:30:00+07:00', null, null, 'manual', now(), now());

insert into public.supplement_plans (family_id, name, dosage, unit, frequency, start_date, end_date, status, prescribed_by, notes, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Acid folic', '400', 'µg', 'daily', '2026-02-20', null, 'confirmed', 'TS.BS Nguyễn Thu Hà', 'Phòng dị tật ống thần kinh.', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Sắt', '60', 'mg', 'daily', '2026-05-11', null, 'confirmed', 'TS.BS Nguyễn Thu Hà', 'Uống sau bữa sáng.', now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Canxi', '500', 'mg', 'daily', '2026-07-06', null, 'taken', 'TS.BS Nguyễn Thu Hà', 'Tránh uống cùng lúc với sắt.', now(), now());

-- ---- Sau sinh & bé ----
insert into public.birth_records (id, family_id, pregnancy_id, birth_date, birth_type, hospital, duration_hours, complications, notes, created_at, updated_at)
values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '2025-11-03', 'vaginal', 'Bệnh viện Phụ sản Trung ương', 6, array[]::text[], 'Chuyển dạ tự nhiên, không biến chứng.', now(), now());

insert into public.children (id, family_id, birth_record_id, name, sex, birth_date, birth_weight_kg, birth_length_cm, head_circumference_cm, blood_type, allergies, created_at, updated_at)
values ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Bé Minh', 'male', '2025-11-03', 3.2, 50, 34, 'O+', array[]::text[], now(), now());

insert into public.feeding_logs (family_id, child_id, method, side, amount_ml, started_at, duration_min, note, source, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'formula', null, 180, '2026-08-03T06:30:00+07:00', 15, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'formula', null, 150, '2026-08-03T10:00:00+07:00', 12, 'Sau bữa cháo bí đỏ', 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'formula', null, 170, '2026-08-03T13:30:00+07:00', 14, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'formula', null, 150, '2026-08-03T17:00:00+07:00', 12, null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'formula', null, 180, '2026-08-03T21:00:00+07:00', 16, null, 'manual', now(), now());

insert into public.sleep_logs (family_id, child_id, started_at, ended_at, place, note, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-02T23:30:00+07:00', '2026-08-03T05:30:00+07:00', 'cot', 'Ngủ xuyên đêm, thức 1 lần bú', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T09:00:00+07:00', '2026-08-03T10:00:00+07:00', 'bassinet', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T14:00:00+07:00', '2026-08-03T15:30:00+07:00', 'cot', null, now(), now());

insert into public.diaper_logs (family_id, child_id, changed_at, type, note, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T07:00:00+07:00', 'pee', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T09:30:00+07:00', 'mixed', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T12:00:00+07:00', 'pee', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T15:00:00+07:00', 'poo', 'Sau bữa cháo trưa', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-03T18:00:00+07:00', 'pee', null, now(), now());

-- growth theo WHO, bé trai 0–9 tháng
insert into public.growth_measurements (family_id, child_id, type, value, unit, measured_at, note, source, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 3.2, 'kg', '2025-11-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 4.4, 'kg', '2025-12-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 5.6, 'kg', '2026-01-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 6.5, 'kg', '2026-02-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 7.2, 'kg', '2026-03-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 7.9, 'kg', '2026-04-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 8.5, 'kg', '2026-05-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 9, 'kg', '2026-06-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 9.4, 'kg', '2026-07-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'weight', 9.8, 'kg', '2026-08-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 50, 'cm', '2025-11-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 54, 'cm', '2025-12-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 58, 'cm', '2026-01-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 61, 'cm', '2026-02-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 64, 'cm', '2026-03-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 66, 'cm', '2026-04-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 68, 'cm', '2026-05-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 70, 'cm', '2026-06-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 72, 'cm', '2026-07-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'height', 74, 'cm', '2026-08-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 34, 'cm', '2025-11-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 37, 'cm', '2025-12-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 39, 'cm', '2026-01-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 41, 'cm', '2026-02-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 42, 'cm', '2026-03-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 43, 'cm', '2026-04-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 44, 'cm', '2026-05-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 45, 'cm', '2026-06-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 46, 'cm', '2026-07-03T10:00:00+07:00', null, 'manual', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'head_circumference', 46.5, 'cm', '2026-08-03T10:00:00+07:00', null, 'manual', now(), now());

insert into public.milestones (family_id, child_id, name, stage, achieved_at, status, note, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Lẫy sấp', 'Vận động', '2026-01-15T08:00:00+07:00', 'achieved', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Biết bò', 'Vận động', '2026-04-20T08:00:00+07:00', 'achieved', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Tự ngồi vững', 'Vận động', '2026-06-10T08:00:00+07:00', 'achieved', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Nói bập bẹ (ba ba, ma ma)', 'Ngôn ngữ', '2026-05-02T08:00:00+07:00', 'achieved', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Đứng vịn', 'Vận động', null, 'not_yet', 'Đang tập đứng bám thành giường', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Chỉ tay gọi đồ vật', 'Nhận thức', null, 'questionable', null, now(), now());

insert into public.vaccinations (family_id, child_id, vaccine_name, dose_number, scheduled_date, administered_date, location, notes, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Viêm gan B', 1, '2025-11-03', '2025-11-03', 'Bệnh viện Phụ sản Trung ương', 'Mũi sơ sinh', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Lao (BCG)', 1, '2025-11-03', '2025-11-04', 'Bệnh viện Phụ sản Trung ương', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '6 trong 1', 1, '2026-01-03', '2026-01-03', 'Trạm y tế phường', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '6 trong 1', 2, '2026-02-03', '2026-02-03', 'Trạm y tế phường', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '6 trong 1', 3, '2026-03-03', '2026-03-03', 'Trạm y tế phường', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Rota virus (uống)', 1, '2026-01-03', '2026-03-03', 'Trạm y tế phường', 'Đã uống đủ 3 liều', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Viêm gan B', 4, '2026-06-03', '2026-06-03', 'Trạm y tế phường', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Sởi', 1, '2026-08-03', null, 'Trạm y tế phường', 'Đến hạn trong tháng 8', now(), now());

-- ---- Điều phối gia đình ----
insert into public.tasks (family_id, title, description, status, due_date, assignee_id, completed_at, reminder_id, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Đặt lịch siêu âm hình thái tuần 20', null, 'todo', '2026-08-10', '10000000-0000-0000-0000-000000000002', null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Mua canxi và sắt dự trữ', 'Mua thêm 1 hộp sắt, 1 hộp canxi.', 'in_progress', '2026-08-07', '10000000-0000-0000-0000-000000000003', null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Tập yoga bầu buổi tối', null, 'done', '2026-08-03', '10000000-0000-0000-0000-000000000002', '2026-08-03T19:00:00+07:00', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Đặt lịch tiêm phòng uốn ván mũi 1', null, 'todo', '2026-09-28', '10000000-0000-0000-0000-000000000003', null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Sắp xếp phòng và mua đồ sơ sinh', null, 'in_progress', '2026-08-15', '10000000-0000-0000-0000-000000000003', null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Chuẩn bị hồ sơ sinh tại bệnh viện', null, 'todo', '2026-11-20', '10000000-0000-0000-0000-000000000002', null, null, now(), now());

insert into public.shopping_items (family_id, name, category, quantity, unit, estimated_price, actual_price, status, note, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Nôi em bé', 'Đồ bé', 1, 'cái', 2200000, 1980000, 'bought', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Máy hút sữa', 'Đồ mẹ', 1, 'cái', 1500000, null, 'pending', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Bỉm tã (lốc 100)', 'Đồ bé', 1, 'lốc', 350000, null, 'pending', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Địu em bé', 'Đồ bé', 1, 'cái', 800000, null, 'pending', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Sữa công thức (hộp 900 g)', 'Đồ bé', 2, 'hộp', 450000, 429000, 'bought', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Bộ quần áo sơ sinh', 'Đồ bé', 3, 'bộ', 600000, null, 'pending', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Áo bầu', 'Đồ mẹ', 2, 'cái', 300000, 280000, 'bought', null, now(), now());

insert into public.budget_entries (family_id, title, amount, type, category, occurred_at, note, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Khám + siêu âm tuần 16', 1200000, 'expense', 'Khám thai', '2026-07-05', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Sữa công thức + bỉm', 900000, 'expense', 'Sữa và đồ bé', '2026-07-10', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Xét nghiệm sàng lọc 16 tuần', 2500000, 'expense', 'Xét nghiệm', '2026-07-06', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Thực phẩm bổ sung cho mẹ', 1800000, 'expense', 'Ăn uống', '2026-07-15', null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Dự phòng chi phí sinh', 5000000, 'expense', 'Dự phòng sinh', '2026-11-15', 'Dự trù', now(), now());

insert into public.reminders (family_id, title, scheduled_at, frequency, channels, active, last_sent_at, payload, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Uống vitamin (acid folic + sắt)', '2026-08-03T08:00:00+07:00', 'daily', array['in_app','push']::public.notification_channel[], true, null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Khám thai — siêu âm hình thái', '2026-08-10T08:00:00+07:00', 'once', array['in_app','push']::public.notification_channel[], true, null, null, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Tập yoga bầu', '2026-08-03T18:00:00+07:00', 'daily', array['in_app']::public.notification_channel[], true, null, null, now(), now());

-- ---- Nội dung & AI ----
insert into public.weekly_guides (family_id, week, trimester, title, content, nutrition_focus, appointments_due, todo, created_at, updated_at)
values (
  '10000000-0000-0000-0000-000000000001', 20, 'second', 'Tuần 20: Bé đạp nhiều hơn, mẹ chú ý canxi',
  'Bé bằng quả chuối, mẹ dễ cảm nhận thai máy. Đây là lúc bổ sung canxi và sắt đều đặn, đặt lịch siêu âm hình thái học.',
  array['Sắt','Canxi','DHA','Protein'], array['Siêu âm hình thái học — tuần 20–22'], array['Đặt lịch siêu âm hình thái học','Đếm thai máy buổi tối'],
  now(), now()
);

insert into public.articles (family_id, title, slug, summary, body, stages, tags, author, published_at, medical_reviewed, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Dinh dưỡng 3 tháng giữa: Sắt và canxi cho mẹ và bé', 'dinh-duong-3-thang-giua-sat-va-canxi', '3 tháng giữa là giai đoạn bé tăng nhanh về xương và máu.', 'Sắt giúp vận chuyển oxy; mẹ cần khoảng 27 mg sắt/ngày.\n\nCanxi 1000–1200 mg/ngày từ sữa, rau xanh đậm.\n\nNguồn: Cẩm nang thai kỳ — Bệnh viện Từ Dũ.', array['pregnancy']::public.knowledge_stage[], array['sắt','canxi'], 'ThS.BS Lê Thị Hương', '2026-06-10T08:00:00+07:00', true, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Nhận biết cơn chuyển dạ thật', 'nhan-biet-con-chuyen-da-that', 'Phân biệt cơn gò giả và chuyển dạ thật.', 'Chuyển dạ thật: cơn gò đều, tăng dần.\n\nRa nước ối, ra máu → đến viện ngay.\n\nNguồn: Sổ tay sản khoa — Bộ Y tế.', array['pregnancy']::public.knowledge_stage[], array['chuyển dạ','sinh'], null, '2026-05-20T08:00:00+07:00', true, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Vì sao cần khám tiền sản định kỳ', 'vi-sao-can-kham-tien-san-dinh-ky', 'Lịch khám thai theo dõi sức khỏe mẹ và bé.', 'Khám tháng đầu: xác nhận thai.\n\nTháng 3–4: đo độ mờ da gáy.\n\nNguồn: Cẩm nang mang thai — Bộ Y tế.', array['pregnancy']::public.knowledge_stage[], array['khám thai'], null, '2026-04-15T08:00:00+07:00', true, now(), now()),
  ('10000000-0000-0000-0000-000000000001', 'Ăn dặm cho bé 6–12 tháng: bắt đầu thế nào', 'an-dam-cho-be-6-12-thang', 'Hướng dẫn ăn dặm đúng cách cho bé.', 'Bắt đầu bột loãng → đặc dần.\n\nDuy trì sữa 500–700 ml/ngày.\n\nNguồn: Hội Nhi khoa Việt Nam.', array['age_6_12m']::public.knowledge_stage[], array['ăn dặm'], null, '2026-07-01T08:00:00+07:00', true, now(), now());

insert into public.quiz_sets (id, family_id, title, stage, source_ids, status, question_count, created_at, updated_at)
values ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Thai kỳ tuần 20', 'pregnancy', array[]::uuid[], 'ready', 5, now(), now());

insert into public.quiz_questions (family_id, quiz_set_id, type, prompt, options, correct_index, explanation, citation, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'multiple_choice', 'Ở tuần 20, mẹ nên bổ sung bao nhiêu canxi mỗi ngày?', array['400 mg','600 mg','1000–1200 mg','2000 mg'], 2, 'Thai kỳ cần 1000–1200 mg canxi/ngày.', 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'multiple_choice', 'Siêu âm hình thái học nên thực hiện ở tuần nào?', array['Tuần 8–10','Tuần 12–14','Tuần 20–22','Tuần 30–32'], 2, 'Tuần 20–22 là thời điểm vàng khảo sát cơ quan thai.', 'Hướng dẫn quốc gia về chăm sóc tiền sản', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'multiple_choice', 'Số lần thai máy bình thường trong 2 giờ?', array['Dưới 5 lần','Từ 10 lần trở lên','Chỉ 1–2 lần','Không quan trọng'], 1, 'Trung bình từ 10 lần thai máy/2 giờ.', 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'multiple_choice', 'Lượng caffeine tối đa khuyến nghị khi mang thai?', array['0 mg','100 mg','200 mg','400 mg'], 2, 'Giới hạn caffeine dưới 200 mg/ngày.', 'Tổ chức Y tế Thế giới (WHO)', now(), now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'scenario', 'Buổi tối mẹ thấy bé đạp ít hơn mọi ngày. Mẹ nên làm gì trước tiên?', array['Đi khám ngay','Uống nước, nằm nghiêng trái, đếm thai máy 1–2 giờ','Uống cà phê kích thích','Chờ đến sáng'], 1, 'Đếm thai máy sau khi uống nước và nằm nghiêng trái; nếu vẫn ít thì đi khám.', 'Hướng dẫn quốc gia về chăm sóc tiền sản', now(), now());

insert into public.chat_sessions (id, family_id, title, stage, model, status, pinned, created_at, updated_at)
values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Hỏi AI thai kỳ', 'pregnancy', 'OpenRouter — model free đã duyệt', 'active', false, now(), now());

insert into public.chat_messages (family_id, session_id, role, content, sources, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'user', 'Thai tuần 20 ăn gì để bổ sung sắt?', array[]::uuid[], '2026-08-03T08:00:00+07:00', now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'assistant', 'Mẹ nên ăn thịt bò, trứng, rau ngót, các loại đậu. Uống sắt cùng vitamin C.', array['40000000-0000-0000-0000-000000000011']::uuid[], '2026-08-03T08:01:00+07:00', now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'user', 'Bé đạp nhiều lúc đêm có sao không?', array[]::uuid[], '2026-08-03T08:02:00+07:00', now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'assistant', 'Không sao. Bé có chu kỳ ngủ–thức riêng. Chú ý nếu thai máy giảm rõ.', array['40000000-0000-0000-0000-000000000012']::uuid[], '2026-08-03T08:03:00+07:00', now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'user', 'Caffeine bao nhiêu là an toàn khi mang thai?', array[]::uuid[], '2026-08-03T08:04:00+07:00', now()),
  ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'assistant', 'Khuyến nghị giới hạn dưới 200 mg caffeine mỗi ngày.', array['40000000-0000-0000-0000-000000000011']::uuid[], '2026-08-03T08:05:00+07:00', now());

set session_replication_role = 'origin';

commit;
