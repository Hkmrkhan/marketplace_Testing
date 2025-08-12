-- Updated trigger function for admin in profile table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Only insert if profile doesn't already exist
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, full_name, user_type, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'User'),
      coalesce(
        new.raw_user_meta_data->>'user_type', 
        case 
          when new.email like '%admin%' then 'admin'
          else 'buyer'
        end
      ),
      new.email
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated RLS policies for profiles
drop policy if exists "Profiles: Users can view their own profile" on profiles;
drop policy if exists "Profiles: Users can update their own profile" on profiles;
drop policy if exists "Profiles: Admins can view all profiles" on profiles;
drop policy if exists "Profiles: Admins can insert profiles" on profiles;

-- Enable RLS
alter table profiles enable row level security;

-- Policies for profiles
create policy "Profiles: Users can view their own profile"
  on profiles for select
  using (auth.uid() = id or 
    exists (
      select 1 
      from profiles 
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "Profiles: Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Profiles: Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Profiles: Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 
      from profiles 
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "Profiles: Admins can insert profiles"
  on profiles for insert
  with check (
    exists (
      select 1 
      from profiles 
      where id = auth.uid() and user_type = 'admin'
    ) or 
    auth.uid() = id
  ); 