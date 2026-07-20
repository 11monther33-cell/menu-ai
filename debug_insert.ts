import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sbUrl = process.env.VITE_SUPABASE_URL || '';
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sb = createClient(sbUrl, sbKey);

async function test() {
  const ownerEmail = 'monther.alrashdy1@gmail.com';
  const restaurantName = 'لقمة';
  const subscriptionPlan = 'basic';

  console.log('1. Checking user...');
  const { data: existingUsers, error: userError } = await sb.auth.admin.listUsers();
  if (userError) return console.error('User check failed:', userError);
  
  let userId;
  const existingUser = existingUsers?.users.find((u: any) => u.email?.toLowerCase() === ownerEmail.toLowerCase());
  if (existingUser) {
    console.log('User already exists:', existingUser.id);
    userId = existingUser.id;
  } else {
    console.log('2. Creating user...');
    const tempPassword = 'RandomPassword123!';
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: ownerEmail.toLowerCase(),
      password: tempPassword,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return console.error('Failed to create user:', authError);
    }
    userId = authData.user.id;
    console.log('User created:', userId);
  }

  console.log('3. Inserting restaurant...');
  const { data: restaurant, error: restError } = await sb.from('restaurants').insert({
    owner_id: userId,
    name_ar: restaurantName,
    name_en: restaurantName,
    slug: restaurantName.toLowerCase().replace(/[\s_]+/g, '-'),
    subscription_plan: subscriptionPlan,
    subscription_status: 'trial'
  }).select().single();

  if (restError) {
    console.error('Restaurant insert failed!', restError);
    // Cleanup user
    if (!existingUser) {
        await sb.auth.admin.deleteUser(userId);
        console.log('Cleaned up user');
    }
    return;
  }

  console.log('Restaurant created!', restaurant.id);
  
  console.log('4. Cleaning up restaurant & user...');
  await sb.from('restaurants').delete().eq('id', restaurant.id);
  if (!existingUser) {
    await sb.auth.admin.deleteUser(userId);
  }
}

test();
