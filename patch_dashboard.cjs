const fs = require('fs');

let content = fs.readFileSync('src/pages/restaurant/Dashboard.tsx', 'utf-8');

// 1. Add Smartphone to imports
if (!content.includes('Smartphone,')) {
  content = content.replace('Settings, LogOut', 'Settings, LogOut, Smartphone');
}

// 2. Add AppConnection import
if (!content.includes('import { AppConnection }')) {
  content = content.replace(
    "import { DishFormPage } from './pages/DishFormPage';",
    "import { DishFormPage } from './pages/DishFormPage';\nimport { AppConnection } from './pages/AppConnection';"
  );
}

// 3. Add to Sidebar
if (!content.includes("id: 'app-connection'")) {
  const branchesNav = "{ id: 'branches', icon: <MapPin size={20} />, label: t('restaurant.nav.branches') || (isRtl ? 'الفروع' : 'Branches'), path: '/dashboard/branches' },";
  content = content.replace(
    branchesNav,
    branchesNav + "\n        { id: 'app-connection', icon: <Smartphone size={20} />, label: isRtl ? 'ربط التطبيق' : 'App Connection', path: '/dashboard/app-connection' },"
  );
}

// 4. Add to Routes
if (!content.includes('<Route path="/app-connection"')) {
  const branchesRoute = '<Route path="/branches" element={<div className="p-12 text-center text-text-secondary">{t(\'admin.system.underDevelopmentDesc\').replace(\'{tab}\', t(\'restaurant.nav.branches\'))}</div>} />';
  content = content.replace(
    branchesRoute,
    branchesRoute + '\n                <Route path="/app-connection" element={<AppConnection />} />'
  );
}

fs.writeFileSync('src/pages/restaurant/Dashboard.tsx', content);
