-- Seeds ~18 fake providers around Khammam, Telangana for testing "near me" search.
-- These are NOT real accounts: fake phone numbers, fake auth.users rows inserted
-- directly so profiles/provider_details can reference them via foreign key.
-- They can never log in. Safe to delete later (see bottom of file).
-- Run this in the Supabase SQL Editor after schema.sql, seed_categories.sql,
-- and nearby_providers.sql.

do $$
declare
  provider jsonb;
  sub jsonb;
  v_user_id uuid;
  v_provider_id uuid;
  v_subcategory_id uuid;
  providers jsonb := '[
    {"full_name": "Ravi Kumar", "phone": "+919000000001", "lat": 17.2521, "lng": 80.1489, "radius_km": 15, "years_experience": 8, "bio": "Reliable home electrician, available same-day.",
     "services": [{"category": "Electrician", "subcategory": "Wiring"}, {"category": "Electrician", "subcategory": "Switchboard Repair"}]},
    {"full_name": "Srinivas Rao", "phone": "+919000000002", "lat": 17.2610, "lng": 80.1600, "radius_km": 10, "years_experience": 5, "bio": "Specialist in solar and inverter setups.",
     "services": [{"category": "Electrician", "subcategory": "Solar Panel Installation"}, {"category": "Electrician", "subcategory": "Inverter/UPS Repair"}]},
    {"full_name": "Manohar Reddy", "phone": "+919000000003", "lat": 17.2380, "lng": 80.1420, "radius_km": 20, "years_experience": 12, "bio": "Fan and light fitting expert.",
     "services": [{"category": "Electrician", "subcategory": "Fan/Light Fitting"}]},

    {"full_name": "Suresh Babu", "phone": "+919000000004", "lat": 17.2700, "lng": 80.1700, "radius_km": 15, "years_experience": 6, "bio": "Quick response for leaks and blockages.",
     "services": [{"category": "Plumber", "subcategory": "Pipe Leak Repair"}, {"category": "Plumber", "subcategory": "Drainage/Blockage Clearing"}]},
    {"full_name": "Naresh Goud", "phone": "+919000000005", "lat": 17.2200, "lng": 80.1300, "radius_km": 10, "years_experience": 4, "bio": "Bathroom fittings and tank cleaning.",
     "services": [{"category": "Plumber", "subcategory": "Bathroom Fitting"}, {"category": "Plumber", "subcategory": "Water Tank Cleaning"}]},

    {"full_name": "Ramesh Yadav", "phone": "+919000000006", "lat": 17.2900, "lng": 80.1800, "radius_km": 25, "years_experience": 10, "bio": "Custom furniture and repairs.",
     "services": [{"category": "Carpenter", "subcategory": "Furniture Repair"}, {"category": "Carpenter", "subcategory": "Custom Furniture"}]},
    {"full_name": "Vijay Kumar", "phone": "+919000000007", "lat": 17.2000, "lng": 80.1000, "radius_km": 15, "years_experience": 7, "bio": "Modular kitchens and door fitting.",
     "services": [{"category": "Carpenter", "subcategory": "Modular Kitchen"}, {"category": "Carpenter", "subcategory": "Door/Window Fitting"}]},

    {"full_name": "Prasad Chowdary", "phone": "+919000000008", "lat": 17.3100, "lng": 80.2000, "radius_km": 20, "years_experience": 9, "bio": "Interior and exterior painting.",
     "services": [{"category": "Painter", "subcategory": "Interior Painting"}, {"category": "Painter", "subcategory": "Exterior Painting"}]},
    {"full_name": "Anil Sharma", "phone": "+919000000009", "lat": 17.1800, "lng": 80.0800, "radius_km": 15, "years_experience": 3, "bio": "Waterproofing specialist.",
     "services": [{"category": "Painter", "subcategory": "Waterproofing"}]},

    {"full_name": "Krishna Murthy", "phone": "+919000000010", "lat": 17.3300, "lng": 80.2200, "radius_km": 20, "years_experience": 11, "bio": "AC installation and servicing for all brands.",
     "services": [{"category": "AC Repair & Servicing", "subcategory": "AC Installation"}, {"category": "AC Repair & Servicing", "subcategory": "AC Servicing"}]},
    {"full_name": "Sandeep Rao", "phone": "+919000000011", "lat": 17.1600, "lng": 80.0500, "radius_km": 25, "years_experience": 6, "bio": "Same-day gas refill service.",
     "services": [{"category": "AC Repair & Servicing", "subcategory": "AC Gas Refill"}]},

    {"full_name": "Mahesh Babu", "phone": "+919000000012", "lat": 17.3500, "lng": 80.2500, "radius_km": 20, "years_experience": 8, "bio": "Washing machine and fridge repair.",
     "services": [{"category": "Appliance Repair", "subcategory": "Washing Machine Repair"}, {"category": "Appliance Repair", "subcategory": "Refrigerator Repair"}]},
    {"full_name": "Ganesh Naik", "phone": "+919000000013", "lat": 17.1400, "lng": 80.0200, "radius_km": 15, "years_experience": 5, "bio": "Microwave and oven specialist.",
     "services": [{"category": "Appliance Repair", "subcategory": "Microwave/Oven Repair"}]},

    {"full_name": "Rajesh Varma", "phone": "+919000000014", "lat": 17.3700, "lng": 80.2800, "radius_km": 25, "years_experience": 7, "bio": "General and termite pest control.",
     "services": [{"category": "Pest Control", "subcategory": "General Pest Control"}, {"category": "Pest Control", "subcategory": "Termite Control"}]},
    {"full_name": "Kiran Kumar", "phone": "+919000000015", "lat": 17.1200, "lng": 79.9900, "radius_km": 20, "years_experience": 4, "bio": "Cockroach and ant control.",
     "services": [{"category": "Pest Control", "subcategory": "Cockroach/Ant Control"}]},

    {"full_name": "Lakshmi Devi", "phone": "+919000000016", "lat": 17.3900, "lng": 80.3100, "radius_km": 20, "years_experience": 6, "bio": "Deep cleaning for homes and apartments.",
     "services": [{"category": "Cleaning & Housekeeping", "subcategory": "Home Deep Cleaning"}]},
    {"full_name": "Padma Rani", "phone": "+919000000017", "lat": 17.1000, "lng": 79.9600, "radius_km": 25, "years_experience": 3, "bio": "Sofa and carpet cleaning.",
     "services": [{"category": "Cleaning & Housekeeping", "subcategory": "Sofa/Carpet Cleaning"}]},
    {"full_name": "Swathi Reddy", "phone": "+919000000018", "lat": 17.4100, "lng": 80.3400, "radius_km": 25, "years_experience": 5, "bio": "Bathroom deep cleaning.",
     "services": [{"category": "Cleaning & Housekeeping", "subcategory": "Bathroom Cleaning"}]}
  ]'::jsonb;
begin
  for provider in select * from jsonb_array_elements(providers)
  loop
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, phone,
      encrypted_password, phone_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      provider->>'phone',
      '',
      now(),
      '', '', '', '',
      now(), now(),
      '{"provider":"phone"}'::jsonb,
      '{}'::jsonb
    );

    insert into public.profiles (id, phone, full_name, role, preferred_language)
    values (v_user_id, provider->>'phone', provider->>'full_name', 'provider', 'en');

    insert into public.provider_details (profile_id, bio, years_experience, location, service_radius_km)
    values (
      v_user_id,
      provider->>'bio',
      (provider->>'years_experience')::int,
      format('SRID=4326;POINT(%s %s)', provider->>'lng', provider->>'lat')::geography,
      (provider->>'radius_km')::int
    )
    returning id into v_provider_id;

    for sub in select * from jsonb_array_elements(provider->'services')
    loop
      select s.id into v_subcategory_id
      from public.subcategories s
      join public.categories c on c.id = s.category_id
      where c.name_en = sub->>'category' and s.name_en = sub->>'subcategory';

      if v_subcategory_id is not null then
        insert into public.provider_services (provider_id, subcategory_id)
        values (v_provider_id, v_subcategory_id);
      end if;
    end loop;
  end loop;
end $$;

-- To remove all dummy data later, run:
-- delete from auth.users where phone like '+9190000000%';
-- (cascades to profiles, provider_details, provider_services)