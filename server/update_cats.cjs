const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('server/db/construction.db');

// 1. Rename 'Basement' to 'Foundation'
db.prepare("UPDATE categories SET name = 'Foundation' WHERE name = 'Basement' AND parent_id = 1").run();
db.prepare("UPDATE categories SET name = REPLACE(name, '(Basement)', '(Foundation)') WHERE name LIKE '%(Basement)'").run();
console.log('Renamed Basement to Foundation.');

const data = `
Land Acquisition
•	Land Purchase 
•	Land Registration 
•	Legal Fees 
•	Surveying Fees 
•	Land Transfer Tax 
•	Title Search 
•	Boundary Marking 
•	Land Valuation 
•	Documentation Charges 
Professional Fees
•	Architectural Design 
•	Structural Engineering 
•	Mechanical Design 
•	Electrical Design 
•	Plumbing Design 
•	Interior Design 
•	Quantity Surveying 
•	Project Management 
•	Permit Consultancy 
•	Inspection Fees 
•	Environmental Assessment 
Site Preparation
•	Site Clearing 
•	Demolition 
•	Excavation 
•	Backfilling 
•	Grading & Leveling 
•	Soil Testing 
•	Dewatering 
•	Temporary Fencing 
•	Site Access Road 
•	Waste Removal 
Structure & Foundation
•	Footings 
•	Foundation Concrete 
•	Reinforcement Steel 
•	Formwork 
•	Columns 
•	Beams 
•	Slabs 
•	Blockwork 
•	Structural Steel 
•	Waterproofing 
•	Retaining Walls 
Roofing
•	Roof Structure 
•	Roof Sheets 
•	Roof Tiles 
•	Roof Insulation 
•	Waterproof Membrane 
•	Gutters 
•	Downpipes 
•	Roof Flashings 
•	Skylights 
•	Roofing Accessories 
Contractor
•	Main Contractor 
•	Civil Contractor 
•	Structural Contractor 
•	Roofing Contractor 
•	Mechanical Contractor 
•	Electrical Contractor 
•	Plumbing Contractor 
•	Carpentry Contractor 
•	Painting Contractor 
•	Finishing Contractor 
•	Landscaping Contractor 
•	Specialist Contractor 
Mechanical
•	Air Conditioning Units 
•	Ventilation Systems 
•	Exhaust Fans 
•	Ducting 
•	Water Pumps 
•	Generator Installation 
•	Mechanical Equipment 
•	Mechanical Accessories 
•	Testing & Commissioning 
Electrical
•	Main Power Connection 
•	Electrical Wiring 
•	Conduits 
•	Distribution Boards 
•	Circuit Breakers 
•	Switches 
•	Sockets 
•	Interior Lighting 
•	Exterior Lighting 
•	Generator Wiring 
•	Solar System 
•	CCTV System 
•	Data Network Cabling 
•	Electrical Testing 
Plumbing
•	Water Supply Pipes 
•	Drainage Pipes 
•	Sewer Connection 
•	Septic Tank 
•	Water Tank 
•	Water Pump 
•	Water Heater 
•	Kitchen Plumbing 
•	Bathroom Plumbing 
•	Plumbing Fixtures 
•	Plumbing Accessories 
•	Plumbing Testing 
Interior Finishes
•	Internal Plastering 
•	Wall Putty 
•	Interior Painting 
•	Floor Tiles 
•	Wall Tiles 
•	Timber Flooring 
•	Vinyl Flooring 
•	Ceiling Works 
•	Gypsum Board 
•	Decorative Finishes 
•	Interior Doors 
•	Door Hardware 
•	Glass Works 
Exterior Works
•	Exterior Plastering 
•	Exterior Painting 
•	Cladding 
•	Windows 
•	Exterior Doors 
•	Balcony Works 
•	Veranda Works 
•	Driveway Construction 
•	Boundary Wall 
•	Gates 
•	External Stairs 
Landscaping
•	Topsoil 
•	Garden Plants 
•	Trees 
•	Lawn/Turf 
•	Irrigation System 
•	Garden Lighting 
•	Paving Stones 
•	Decorative Rocks 
•	Water Features 
•	Outdoor Furniture 
Equipment & Tools
•	Hand Tools 
•	Power Tools 
•	Tool Rental 
•	Equipment Rental 
•	Scaffolding 
•	Generator Rental 
•	Fuel for Equipment 
•	Equipment Maintenance 
•	Equipment Repairs 
•	Consumables 
Labor & Contractors
•	Skilled Labor 
•	General Labor 
•	Carpenter Wages 
•	Mason Wages 
•	Electrician Wages 
•	Plumber Wages 
•	Painter Wages 
•	Helper Wages 
•	Overtime Wages 
•	Labor Accommodation 
•	Labor Meals 
•	Labor Transport 
Utilities
•	Construction Electricity 
•	Construction Water 
•	Internet Service 
•	Telephone Service 
•	Mobile Communication 
•	Generator Fuel 
•	Temporary Utility Connections 
Safety & Insurance
•	Worker Insurance 
•	Builder's Risk Insurance 
•	Public Liability Insurance 
•	Site Security 
•	PPE Equipment 
•	Safety Training 
•	First Aid Supplies 
•	Fire Extinguishers 
•	Safety Signage 
•	Compliance Inspection 
Furniture & Appliances
•	Living Room Furniture 
•	Bedroom Furniture 
•	Dining Furniture 
•	Office Furniture 
•	Outdoor Furniture 
•	Kitchen Appliances 
•	Laundry Appliances 
•	Air Conditioners 
•	Decorative Lighting 
•	Curtains & Blinds 
•	Mirrors 
•	Shelving 
•	Home Automation Devices 
Financing Costs
•	Loan Interest 
•	Bank Charges 
•	Loan Processing Fees 
•	Mortgage Fees 
•	Financial Advisory Fees 
•	Currency Exchange Charges 
•	Late Payment Charges 
Contingency
•	Design Changes 
•	Variation Orders 
•	Material Price Escalation 
•	Emergency Repairs 
•	Rework Costs 
•	Unexpected Site Conditions 
•	Miscellaneous Costs 
Wood Acquisition
•	Hardwood 
•	Softwood 
•	Timber Beams 
•	Timber Posts 
•	Plywood 
•	Marine Plywood 
•	MDF Boards 
•	Particle Boards 
•	Veneer Sheets 
•	Imported Timber 
•	Local Timber 
•	Timber Transport 
•	Timber Treatment 
•	Timber Storage 
•	Timber Waste 
Carpentry
•	Kitchen Cabinets 
•	Wardrobes 
•	Shelving 
•	Doors 
•	Door Frames 
•	Window Frames 
•	Staircases 
•	Skirting Boards 
•	Architraves 
•	Ceiling Woodwork 
•	Wall Paneling 
•	Decking 
•	Pergolas 
•	Built-in Furniture 
•	TV Units 
•	Vanity Units 
•	Custom Furniture 
•	Installation Materials 
•	Carpentry Consumables 
•	Workshop Expenses
`;

const lines = data.split('\n').map(l => l.trim()).filter(l => l);

const existingNames = new Set(
  db.prepare('SELECT name FROM categories').all().map(r => r.name)
);

let currentMasterId = null;
let currentMasterName = '';

const insertCategory = db.prepare('INSERT INTO categories (name, color, parent_id) VALUES (?, ?, ?)');

lines.forEach(line => {
  if (line.startsWith('•')) {
    // Subcategory
    let subName = line.replace('•', '').trim();
    if (!subName) return;
    
    // Check if subname already exists to avoid unique constraint violations
    let finalName = subName;
    if (existingNames.has(finalName)) {
      finalName = `${subName} (${currentMasterName})`;
    }
    
    if (!existingNames.has(finalName)) {
      insertCategory.run(finalName, '#475569', currentMasterId);
      existingNames.add(finalName);
      console.log(`  Added subcategory: ${finalName}`);
    } else {
      console.log(`  Skip subcategory (already exists): ${finalName}`);
    }
  } else {
    // Master category
    let masterName = line;
    currentMasterName = masterName;
    
    if (!existingNames.has(masterName)) {
      const info = insertCategory.run(masterName, '#1E293B', null);
      currentMasterId = info.lastInsertRowid;
      existingNames.add(masterName);
      console.log(`Added master category: ${masterName}`);
    } else {
      currentMasterId = db.prepare('SELECT id FROM categories WHERE name = ?').get(masterName).id;
      console.log(`Found master category: ${masterName}`);
    }
  }
});

console.log('Categories updated!');
