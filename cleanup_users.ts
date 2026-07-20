import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sbUrl = process.env.VITE_SUPABASE_URL || '';
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(sbUrl, sbKey);

async function cleanup() {
  const emailsToClean = ['welvox.om@gmail.com', 'monther.alrashdy1@gmail.com'];
  
  const { data: usersData, error: listError } = await sb.auth.admin.listUsers();
  if (listError) return console.error('Failed to list users', listError);

  for (const user of usersData.users) {
    if (user.email && emailsToClean.includes(user.email.toLowerCase())) {
      console.log(`Deleting user: ${user.email} (${user.id})`);
      const { error: delError } = await sb.auth.admin.deleteUser(user.id);
      if (delError) console.error(`Failed to delete ${user.email}`, delError);
      else console.log(`Deleted ${user.email} successfully.`);
    }
  }
}

cleanup();
