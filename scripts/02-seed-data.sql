-- Insert sample Ayurvedic plants data
INSERT INTO plants (scientific_name, sanskrit_name, common_name, family, description, parts_used, medicinal_properties, ailments, dosage, contraindications, image_url) VALUES
('Withania somnifera', 'Ashwagandha', 'Winter Cherry', 'Solanaceae', 'Ashwagandha is one of the most important herbs in Ayurveda, known as an adaptogen that helps the body manage stress. It has been used for over 3,000 years to relieve stress, increase energy levels, and improve concentration.', 
 ARRAY['Root', 'Leaves'], 
 ARRAY['Adaptogenic', 'Anti-inflammatory', 'Immunomodulatory', 'Neuroprotective'], 
 ARRAY['Stress', 'Anxiety', 'Insomnia', 'Fatigue', 'Arthritis'], 
 '300-500mg twice daily', 
 'Avoid during pregnancy and breastfeeding. May interact with immunosuppressant medications.',
 '/placeholder.svg?height=300&width=400'),

('Curcuma longa', 'Haridra', 'Turmeric', 'Zingiberaceae', 'Turmeric is a golden spice that has been used in Ayurveda for thousands of years. It contains curcumin, a powerful anti-inflammatory compound that supports joint health and overall wellness.',
 ARRAY['Rhizome'], 
 ARRAY['Anti-inflammatory', 'Antioxidant', 'Hepatoprotective', 'Antimicrobial'], 
 ARRAY['Inflammation', 'Arthritis', 'Digestive issues', 'Skin conditions'], 
 '500-1000mg daily with black pepper', 
 'May increase bleeding risk. Avoid with gallstones.',
 '/placeholder.svg?height=300&width=400'),

('Ocimum tenuiflorum', 'Tulsi', 'Holy Basil', 'Lamiaceae', 'Tulsi is considered sacred in Hindu tradition and is revered as the "Queen of Herbs" in Ayurveda. It is an adaptogenic herb that supports respiratory health and helps the body cope with stress.',
 ARRAY['Leaves', 'Seeds'], 
 ARRAY['Adaptogenic', 'Antimicrobial', 'Expectorant', 'Immunomodulatory'], 
 ARRAY['Respiratory infections', 'Stress', 'Diabetes', 'Fever'], 
 '300-600mg twice daily or as tea', 
 'Generally safe. May lower blood sugar levels.',
 '/placeholder.svg?height=300&width=400'),

('Bacopa monnieri', 'Brahmi', 'Water Hyssop', 'Plantaginaceae', 'Brahmi is a renowned brain tonic in Ayurveda, traditionally used to enhance memory, learning, and cognitive function. It is considered one of the most important herbs for mental clarity and focus.',
 ARRAY['Whole plant', 'Leaves'], 
 ARRAY['Nootropic', 'Neuroprotective', 'Anxiolytic', 'Antioxidant'], 
 ARRAY['Memory loss', 'Anxiety', 'ADHD', 'Epilepsy'], 
 '300-600mg daily', 
 'May cause drowsiness. Start with lower doses.',
 '/placeholder.svg?height=300&width=400'),

('Terminalia chebula', 'Haritaki', 'Black Myrobalan', 'Combretaceae', 'Haritaki is called the "King of Medicines" in Ayurveda and is one of the three fruits in Triphala. It is highly valued for its digestive and detoxifying properties.',
 ARRAY['Fruit'], 
 ARRAY['Digestive', 'Laxative', 'Antioxidant', 'Hepatoprotective'], 
 ARRAY['Constipation', 'Digestive disorders', 'Respiratory issues', 'Eye problems'], 
 '1-3g daily with warm water', 
 'Avoid during pregnancy. May cause loose stools in high doses.',
 '/placeholder.svg?height=300&width=400');

-- Insert sample preparations
INSERT INTO preparations (plant_id, name, type, ingredients, steps, dosage, duration) VALUES
(1, 'Ashwagandha Powder', 'Churna', ARRAY['Dried Ashwagandha root - 100g'], ARRAY['Clean and dry the roots completely', 'Grind into fine powder using a spice grinder', 'Sieve to remove any coarse particles', 'Store in airtight container'], '1/2 teaspoon twice daily', '2-3 months'),

(1, 'Ashwagandha Ghrita', 'Medicated Ghee', ARRAY['Ashwagandha powder - 50g', 'Cow ghee - 200ml', 'Water - 800ml'], ARRAY['Boil water and add Ashwagandha powder', 'Simmer until water reduces to 1/4', 'Strain the decoction', 'Heat ghee and add the decoction', 'Cook on low heat until water evaporates'], '1 teaspoon twice daily', '1-2 months'),

(2, 'Turmeric Milk', 'Kshira Paka', ARRAY['Turmeric powder - 1 tsp', 'Milk - 1 cup', 'Black pepper - pinch', 'Honey - 1 tsp'], ARRAY['Heat milk in a pan', 'Add turmeric powder and black pepper', 'Simmer for 5 minutes', 'Add honey after cooling slightly'], '1 cup before bedtime', '1 month'),

(3, 'Tulsi Tea', 'Kashaya', ARRAY['Fresh Tulsi leaves - 10-15', 'Water - 2 cups', 'Ginger - small piece', 'Honey - to taste'], ARRAY['Boil water with ginger', 'Add Tulsi leaves', 'Simmer for 5-7 minutes', 'Strain and add honey'], '1 cup twice daily', 'Ongoing');

-- Insert sample references
INSERT INTO references (plant_id, title, authors, journal, year, doi, url) VALUES
(1, 'An Overview on Ashwagandha: A Rasayana (Rejuvenator) of Ayurveda', 'Singh N, Bhalla M, de Jager P, Gilca M', 'African Journal of Traditional, Complementary and Alternative Medicines', 2011, '10.4314/ajtcam.v8i5S.9', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3252722/'),

(2, 'Curcumin: A Review of Its Effects on Human Health', 'Hewlings SJ, Kalman DS', 'Foods', 2017, '10.3390/foods6100092', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5664031/'),

(3, 'Ocimum sanctum: A herb for all reasons', 'Cohen MM', 'Journal of Ayurveda and Integrative Medicine', 2014, '10.4103/0975-9476.146554', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4296439/'),

(4, 'Cognitive enhancement in healthy adults with Bacopa monnieri: A systematic review', 'Pase MP, Kean J, Sarris J, Neale C, Scholey AB, Stough C', 'Journal of Alternative and Complementary Medicine', 2012, '10.1089/acm.2011.0367', 'https://pubmed.ncbi.nlm.nih.gov/22747190/');
