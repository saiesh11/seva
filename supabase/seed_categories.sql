-- Starter categories + subcategories. Edit names/lists as you like before running.
-- Run this in the Supabase SQL Editor after schema.sql.

with cat as (
  insert into public.categories (name_en) values
    ('Electrician'),
    ('Plumber'),
    ('Carpenter'),
    ('Painter'),
    ('AC Repair & Servicing'),
    ('Appliance Repair'),
    ('Pest Control'),
    ('Cleaning & Housekeeping')
  returning id, name_en
)
insert into public.subcategories (category_id, name_en)
select cat.id, sub.name_en
from cat
join (values
  ('Electrician', 'Wiring'),
  ('Electrician', 'Solar Panel Installation'),
  ('Electrician', 'Inverter/UPS Repair'),
  ('Electrician', 'Fan/Light Fitting'),
  ('Electrician', 'Switchboard Repair'),

  ('Plumber', 'Pipe Leak Repair'),
  ('Plumber', 'Bathroom Fitting'),
  ('Plumber', 'Water Tank Cleaning'),
  ('Plumber', 'Drainage/Blockage Clearing'),

  ('Carpenter', 'Furniture Repair'),
  ('Carpenter', 'Custom Furniture'),
  ('Carpenter', 'Door/Window Fitting'),
  ('Carpenter', 'Modular Kitchen'),

  ('Painter', 'Interior Painting'),
  ('Painter', 'Exterior Painting'),
  ('Painter', 'Waterproofing'),

  ('AC Repair & Servicing', 'AC Installation'),
  ('AC Repair & Servicing', 'AC Servicing'),
  ('AC Repair & Servicing', 'AC Gas Refill'),

  ('Appliance Repair', 'Washing Machine Repair'),
  ('Appliance Repair', 'Refrigerator Repair'),
  ('Appliance Repair', 'Microwave/Oven Repair'),

  ('Pest Control', 'General Pest Control'),
  ('Pest Control', 'Termite Control'),
  ('Pest Control', 'Cockroach/Ant Control'),

  ('Cleaning & Housekeeping', 'Home Deep Cleaning'),
  ('Cleaning & Housekeeping', 'Sofa/Carpet Cleaning'),
  ('Cleaning & Housekeeping', 'Bathroom Cleaning')
) as sub(category_name, name_en) on sub.category_name = cat.name_en;