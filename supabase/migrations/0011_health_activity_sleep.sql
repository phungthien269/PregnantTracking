-- 0011: health-sync — lưu bước chân (activity) + giấc ngủ (sleep)
-- iOS HealthKit gửi stepCount (activity) + sleepAnalysis (sleep); trước đây
-- health-sync báo skipped vì enum measurement_type chưa có 2 loại này.
-- Bảng maternal_measurements đã có family_id/private_owner_id + trigger
-- set_updated_at (0003) + RLS (0008) — thêm enum value là đủ, không cần đổi bảng.
-- Đơn vị lưu theo toHealthMetric(): activity → 'steps', sleep → 'hours'
-- (tính từ khoảng startedAt–endedAt của payload iOS).
begin;

alter type public.measurement_type add value if not exists 'activity';
alter type public.measurement_type add value if not exists 'sleep';

commit;
