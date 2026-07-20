const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/Dashboard.tsx', 'utf-8');

// 1. Imports
content = content.replace(
  "import { toast } from 'react-hot-toast';",
  "import { toast } from 'react-hot-toast';\nimport { logAdminAction } from '../../lib/adminLogger';\nimport { ActivityFeed } from '../../components/admin/ActivityFeed';"
);

// 2. States
content = content.replace(
  "const [isSaving, setIsSaving] = useState(false);",
  "const [isSaving, setIsSaving] = useState(false);\n  const [viewingRestaurant, setViewingRestaurant] = useState<any>(null);\n  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);\n  const [editForm, setEditForm] = useState({ plan: '', status: '' });\n  const [restaurantUsage, setRestaurantUsage] = useState<any[]>([]);\n  const [loadingUsage, setLoadingUsage] = useState(false);"
);

// 3. Functions
const funcs = `
  const handleViewRestaurant = async (restaurant: any) => {
    setViewingRestaurant(restaurant);
    setLoadingUsage(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_usage_metrics')
        .select('*')
        .eq('restaurant_id', restaurant.id);
      
      if (!error && data) {
        setRestaurantUsage(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          plan: editForm.plan,
          status: editForm.status
        })
        .eq('id', editingRestaurant.id);

      if (error) throw error;

      await logAdminAction('plan_changed', 'restaurant', editingRestaurant.id, {
        old_plan: editingRestaurant.plan,
        new_plan: editForm.plan,
        old_status: editingRestaurant.status,
        new_status: editForm.status
      });

      toast.success(isRtl ? 'تم تحديث بيانات المطعم بنجاح' : 'Restaurant updated successfully');
      setEditingRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل التحديث' : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };
`;
content = content.replace(
  "const fetchPaddleSettings = async () => {",
  funcs + "\n  const fetchPaddleSettings = async () => {"
);

// 4. Modals
const modals = `
        {viewingRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-2 border border-surface rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setViewingRestaurant(null)}
                className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Store className="text-gold" />
                تفاصيل المطعم: {isRtl ? viewingRestaurant.name_ar : viewingRestaurant.name_en}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-surface/20 rounded-xl border border-surface">
                  <p className="text-xs text-muted mb-1">البريد الإلكتروني (المالك)</p>
                  <p className="font-bold text-sm">{viewingRestaurant.owner_email || 'N/A'}</p>
                </div>
                <div className="p-4 bg-surface/20 rounded-xl border border-surface">
                  <p className="text-xs text-muted mb-1">الباقة الحالية</p>
                  <p className="font-bold uppercase text-gold text-sm">{viewingRestaurant.plan || 'basic'}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity size={18} className="text-gold" />
                استهلاك الموارد (الشهر الحالي)
              </h3>
              
              {loadingUsage ? (
                <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-gold" size={24} /></div>
              ) : (
                <div className="space-y-4">
                  {['ai_chat_messages', '3d_models_generated', 'whatsapp_messages'].map(metric => {
                    const usage = restaurantUsage.find(u => u.metric_type === metric)?.count || 0;
                    const isPro = viewingRestaurant.plan === 'pro';
                    const isStarter = viewingRestaurant.plan === 'starter';
                    const limit = metric === 'ai_chat_messages' ? (isPro ? 2500 : isStarter ? 500 : 100) : metric === '3d_models_generated' ? (isPro ? 100 : isStarter ? 20 : 5) : (isPro ? 1000 : isStarter ? 200 : 50);
                    const percentage = Math.min(100, Math.round((usage / limit) * 100));
                    const isWarning = percentage > 80;
                    const isDanger = percentage >= 100;
                    
                    const labels: Record<string, string> = {
                      'ai_chat_messages': 'رسائل الذكاء الاصطناعي',
                      '3d_models_generated': 'توليد نماذج 3D',
                      'whatsapp_messages': 'رسائل الواتساب'
                    };

                    return (
                      <div key={metric} className={\`p-4 rounded-xl border \${isDanger ? 'bg-red-500/10 border-red-500/30' : isWarning ? 'bg-amber-500/10 border-amber-500/30' : 'bg-dark border-surface'}\`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">{labels[metric]}</span>
                          <span className="text-xs font-mono">{usage} / {limit}</span>
                        </div>
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                          <div 
                            className={\`h-full transition-all duration-1000 \${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-gold'}\`}
                            style={{ width: \`\${percentage}%\` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {editingRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-2 border border-surface rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setEditingRestaurant(null)}
                className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Edit className="text-gold" />
                {isRtl ? 'تعديل بيانات المطعم' : 'Edit Restaurant'}
              </h2>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted mb-2">{isRtl ? 'الباقة' : 'Plan'}</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full bg-dark border border-surface rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50"
                  >
                    <option value="starter">Starter</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted mb-2">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-dark border border-surface rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50"
                  >
                    <option value="PENDING">PENDING (قيد الانتظار)</option>
                    <option value="APPROVED">APPROVED (مقبول)</option>
                    <option value="ACTIVE">ACTIVE (نشط)</option>
                    <option value="SUSPENDED">SUSPENDED (موقوف)</option>
                    <option value="REJECTED">REJECTED (مرفوض)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gold text-dark font-bold py-3 rounded-xl hover:bg-gold/90 transition-colors flex justify-center items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={20} /> : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
content = content.replace("</AnimatePresence>", modals);

// 5. Buttons
content = content.replace(
  "onClick={() => toast(`Viewing ${r.name_en}`)}",
  "onClick={() => handleViewRestaurant(r)}"
);
content = content.replace(
  "onClick={() => toast(`Editing ${r.name_en}`)}",
  "onClick={() => { setEditingRestaurant(r); setEditForm({ plan: r.plan || 'basic', status: r.status }); }}"
);

fs.writeFileSync('src/pages/admin/Dashboard.tsx', content);
