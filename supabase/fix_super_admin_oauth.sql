-- =========================================================================
-- VISIONO - إصلاح صلاحيات المدير العام وتسجيل الدخول بحساب Google (Super Admin OAuth)
-- =========================================================================

-- 1. تحديث دالة is_super_admin للتحقق أيضاً من البريد الإلكتروني للمدير فوراً
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
  OR (
    LOWER(COALESCE(auth.jwt()->>'email', '')) = '11monther33@gmail.com'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. ترقية/إنشاء بروفايل الأدمن في جدول profiles لأي حساب بهذا الإيميل
INSERT INTO profiles (id, email, name, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Super Admin'), 'SUPER_ADMIN', true
FROM auth.users
WHERE LOWER(email) = '11monther33@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'SUPER_ADMIN', is_active = true;

-- 3. تفعيل trigger يربط أي دخول مستقبلي لبريد الأدمن تلقائياً بصلاحيات SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.handle_admin_google_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF LOWER(NEW.email) = '11monther33@gmail.com' THEN
    INSERT INTO public.profiles (id, email, name, role, is_active)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Super Admin'), 'SUPER_ADMIN', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'SUPER_ADMIN', is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_admin_created ON auth.users;
CREATE TRIGGER on_auth_user_admin_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_google_signup();
