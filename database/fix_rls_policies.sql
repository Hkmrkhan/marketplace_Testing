-- Fix RLS policies for profile creation

-- Drop existing policies
drop policy if exists "Profiles: Users can view their own profile" on profiles;
drop policy if exists "Profiles: Users can update their own profile" on profiles;
drop policy if exists "Profiles: Users can insert their own profile" on profiles;
drop policy if exists "Profiles: Admins can view all profiles" on profiles;
drop policy if exists "Profiles: Admins can insert profiles" on profiles;

-- Enable RLS
alter table profiles enable row level security;

-- Create simple policies that work
create policy "Profiles: Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles: Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Profiles: Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Allow service role to insert profiles (for trigger function)
create policy "Service role can insert profiles"
  on profiles for insert
  with check (true);

-- Allow service role to update profiles
create policy "Service role can update profiles"
  on profiles for update
  using (true);

-- Allow admins to view all profiles
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 
      from profiles 
      where id = auth.uid() and user_type = 'admin'
    )
  ); 