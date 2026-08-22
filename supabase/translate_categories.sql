-- Run this in the Supabase SQL Editor after seed_categories.sql.
-- Populates name_te/name_hi for the categories and subcategories seeded
-- there. Safe to rerun (each update matches by name_en).

update public.categories set name_te = 'ఎలక్ట్రీషియన్', name_hi = 'इलेक्ट्रीशियन' where name_en = 'Electrician';
update public.categories set name_te = 'ప్లంబర్', name_hi = 'प्लंबर' where name_en = 'Plumber';
update public.categories set name_te = 'వడ్రంగి', name_hi = 'बढ़ई' where name_en = 'Carpenter';
update public.categories set name_te = 'పెయింటర్', name_hi = 'पेंटर' where name_en = 'Painter';
update public.categories set name_te = 'ఏసీ రిపేర్ & సర్వీసింగ్', name_hi = 'एसी रिपेयर व सर्विसिंग' where name_en = 'AC Repair & Servicing';
update public.categories set name_te = 'ఉపకరణాల మరమ్మత్తు', name_hi = 'उपकरण मरम्मत' where name_en = 'Appliance Repair';
update public.categories set name_te = 'పెస్ట్ కంట్రోల్', name_hi = 'पेस्ट कंट्रोल' where name_en = 'Pest Control';
update public.categories set name_te = 'శుభ్రపరచడం & హౌస్‌కీపింగ్', name_hi = 'सफाई व हाउसकीपिंग' where name_en = 'Cleaning & Housekeeping';

update public.subcategories set name_te = 'వైరింగ్', name_hi = 'वायरिंग' where name_en = 'Wiring';
update public.subcategories set name_te = 'సోలార్ ప్యానెల్ ఇన్‌స్టాలేషన్', name_hi = 'सोलर पैनल इंस्टॉलेशन' where name_en = 'Solar Panel Installation';
update public.subcategories set name_te = 'ఇన్వర్టర్/యూపీఎస్ రిపేర్', name_hi = 'इन्वर्टर/यूपीएस रिपेयर' where name_en = 'Inverter/UPS Repair';
update public.subcategories set name_te = 'ఫ్యాన్/లైట్ ఫిట్టింగ్', name_hi = 'पंखा/लाइट फिटिंग' where name_en = 'Fan/Light Fitting';
update public.subcategories set name_te = 'స్విచ్‌బోర్డ్ రిపేర్', name_hi = 'स्विचबोर्ड रिपेयर' where name_en = 'Switchboard Repair';

update public.subcategories set name_te = 'పైపు లీక్ రిపేర్', name_hi = 'पाइप लीक रिपेयर' where name_en = 'Pipe Leak Repair';
update public.subcategories set name_te = 'బాత్రూమ్ ఫిట్టింగ్', name_hi = 'बाथरूम फिटिंग' where name_en = 'Bathroom Fitting';
update public.subcategories set name_te = 'వాటర్ ట్యాంక్ క్లీనింగ్', name_hi = 'वाटर टैंक सफाई' where name_en = 'Water Tank Cleaning';
update public.subcategories set name_te = 'డ్రైనేజీ/బ్లాకేజ్ క్లియరింగ్', name_hi = 'ड्रेनेज/ब्लॉकेज क्लीयरिंग' where name_en = 'Drainage/Blockage Clearing';

update public.subcategories set name_te = 'ఫర్నిచర్ రిపేర్', name_hi = 'फर्नीचर रिपेयर' where name_en = 'Furniture Repair';
update public.subcategories set name_te = 'కస్టమ్ ఫర్నిచర్', name_hi = 'कस्टम फर्नीचर' where name_en = 'Custom Furniture';
update public.subcategories set name_te = 'డోర్/విండో ఫిట్టింగ్', name_hi = 'दरवाज़ा/खिड़की फिटिंग' where name_en = 'Door/Window Fitting';
update public.subcategories set name_te = 'మాడ్యులర్ కిచెన్', name_hi = 'मॉड्यूलर किचन' where name_en = 'Modular Kitchen';

update public.subcategories set name_te = 'ఇంటీరియర్ పెయింటింగ్', name_hi = 'इंटीरियर पेंटिंग' where name_en = 'Interior Painting';
update public.subcategories set name_te = 'ఎక్స్‌టీరియర్ పెయింటింగ్', name_hi = 'एक्सटीरियर पेंटिंग' where name_en = 'Exterior Painting';
update public.subcategories set name_te = 'వాటర్‌ప్రూఫింగ్', name_hi = 'वॉटरप्रूफिंग' where name_en = 'Waterproofing';

update public.subcategories set name_te = 'ఏసీ ఇన్‌స్టాలేషన్', name_hi = 'एसी इंस्टॉलेशन' where name_en = 'AC Installation';
update public.subcategories set name_te = 'ఏసీ సర్వీసింగ్', name_hi = 'एसी सर्विसिंग' where name_en = 'AC Servicing';
update public.subcategories set name_te = 'ఏసీ గ్యాస్ రీఫిల్', name_hi = 'एसी गैस रीफिल' where name_en = 'AC Gas Refill';

update public.subcategories set name_te = 'వాషింగ్ మెషిన్ రిపేర్', name_hi = 'वॉशिंग मशीन रिपेयर' where name_en = 'Washing Machine Repair';
update public.subcategories set name_te = 'రిఫ్రిజిరేటర్ రిపేర్', name_hi = 'रेफ्रिजरेटर रिपेयर' where name_en = 'Refrigerator Repair';
update public.subcategories set name_te = 'మైక్రోవేవ్/ఓవెన్ రిపేర్', name_hi = 'माइक्रोवेव/ओवन रिपेयर' where name_en = 'Microwave/Oven Repair';

update public.subcategories set name_te = 'జనరల్ పెస్ట్ కంట్రోల్', name_hi = 'सामान्य पेस्ट कंट्रोल' where name_en = 'General Pest Control';
update public.subcategories set name_te = 'చెదపురుగుల నియంత్రణ', name_hi = 'दीमक नियंत्रण' where name_en = 'Termite Control';
update public.subcategories set name_te = 'బొద్దింకలు/చీమల నియంత్రణ', name_hi = 'कॉकरोच/चींटी नियंत्रण' where name_en = 'Cockroach/Ant Control';

update public.subcategories set name_te = 'హోమ్ డీప్ క్లీనింగ్', name_hi = 'होम डीप क्लीनिंग' where name_en = 'Home Deep Cleaning';
update public.subcategories set name_te = 'సోఫా/కార్పెట్ క్లీనింగ్', name_hi = 'सोफा/कारपेट सफाई' where name_en = 'Sofa/Carpet Cleaning';
update public.subcategories set name_te = 'బాత్రూమ్ క్లీనింగ్', name_hi = 'बाथरूम सफाई' where name_en = 'Bathroom Cleaning';
