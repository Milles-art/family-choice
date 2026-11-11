"""Build an auditable catalogue from supplied CSV and ID-matched WebPs only."""
import csv, hashlib, json, re, shutil
from decimal import Decimal
from pathlib import Path
from PIL import Image
import openpyxl

root = Path(__file__).resolve().parents[1]
source = root / 'PRODUCT IMG'
rows = list(csv.DictReader((source / 'all_250_products_and_prices.csv').open(encoding='utf-8-sig', newline='')))
images = list((source / 'webp').glob('*.webp'))
workbook = openpyxl.load_workbook(source / 'Family_Choice_Inventory.xlsx', data_only=True)
inventory_rows = list(workbook['Inventory'].values)
inventory = {row[0]: dict(zip(inventory_rows[0], row)) for row in inventory_rows[1:]}
if len(inventory) != len(rows): raise ValueError('Inventory/source row count differs')
destination = root / 'public/images/products'
destination.mkdir(parents=True, exist_ok=True)
units = {37:'1 kg', 53:'255 g (3 × 85 g)', 96:'Weight unconfirmed', 119:'100 g / 50 tea bags', 120:'100 g / 50 tea bags', 128:'Weight unconfirmed', 131:'per kg', 136:'per kg', 148:'400 g', 149:'4 pieces (planning unit)', 152:'each', 153:'each', 171:'54 g / 6 cubes', 181:'1 kg + 500 g pictured promotion', 188:'1 sponge', 190:'20 bags', 192:'1 toothbrush', 199:'36 nappies / size 3 / 4–9 kg', 201:'1 box', 203:'4 AA batteries', 204:'8 AAA batteries', 205:'10 coils', 209:'each', 210:'9 W / each', 213:'25 m × 30 cm', 217:'2 rolls', 218:'1 cup (size unconfirmed)', 220:'100 toothpicks', 226:'Capacity unconfirmed (listing: 260 ml)', 227:'each', 228:'2 bibs', 229:'12 washcloths', 230:'each', 239:'Weight unconfirmed', 240:'Weight unconfirmed', 244:'1 comb / documented length 6.75 inches', 248:'1 broom head', 249:'1 mop head', 250:'1 pair / medium'}
names = {157:'American Garden Crunchy Peanut Butter 340 g',158:'Tabora Honey 500 g',196:'Pantene Pro-V Repair & Protect Shampoo 375 ml',203:'Duracell AA Batteries 4-pack',204:'Duracell AAA Batteries 8-pack',210:'Tronic Smart LED E27 Bulb 9 W',218:'Black Ripple Cup',221:"Johnson’s Baby Oil Soap 100 g",244:'Jaguar A-Line 520 Hair Cutting Comb',248:'Tanzania Brush Products Coloured Hard Broom Head',249:'Tonkita Mopy Cotton Mop Head'}
aliases = {'FC-058':'FC-056','FC-059':'FC-057','FC-223':'FC-195'}
catalog, issues, manifest = [], [], []

def category(number):
    if number <= 30 or number == 235: return 'produce'
    if 86 <= number <= 100: return 'dairy'
    if 101 <= number <= 125: return 'beverages'
    if 126 <= number <= 141: return 'meat'
    if 142 <= number <= 145: return 'frozen'
    if 146 <= number <= 153: return 'bakery'
    if 191 <= number <= 198 or 241 <= number <= 247: return 'personal-care'
    if 199 <= number <= 200 or 221 <= number <= 230: return 'baby-care'
    if 181 <= number <= 220 or number >= 248: return 'household'
    return 'pantry'

for row in rows:
    ident = row['catalogue_id']; number = int(ident.split('-')[1])
    matched = [image for image in images if image.name.lower().startswith(ident.lower()+'-')]
    if len(matched) != 1: raise ValueError(f'{ident}: missing/ambiguous image')
    path = matched[0]
    shown = row['product_shown']
    name = names.get(number, re.sub(r'\s*\([^)]*\)', '', shown).strip().rstrip('.'))
    if name.islower() or name.isupper(): name = name.title()
    quantities = re.findall(r'(\d+(?:\.\d+)?)\s*(kg|gm|g|ltr|litres|ml|l|pcs|pc|pieces|sheets|sqft|sqf|oz)\b', name, flags=re.I)
    unit = units.get(number)
    if unit is None:
        if quantities:
            amount, measure = quantities[-1]
            measure = {'gm':'g', 'ltr':'L','litres':'L','l':'L','pc':'pieces','pcs':'pieces','sqf':'sq ft','sqft':'sq ft'}.get(measure.lower(),measure.lower())
            unit = f'{amount} {measure}'
        elif number <= 30 or number <= 50: unit = row['original_candidate_unit']
        else: unit = 'Pack size unconfirmed'
    raw_price = row['retailer_listed_price_tzs'] or row['assistant_planning_estimate_tzs']
    price = Decimal(raw_price)
    if not price.is_finite() or price <= 0 or price * 100 != (price * 100).to_integral_value(): raise ValueError(f'{ident}: invalid price')
    price_type = 'retailer-listed' if row['retailer_listed_price_tzs'] else 'planning-estimate'
    note = row['price_note']
    mismatch = bool(re.search(r'NOT verified for pictured pack|differs from listing|listing says|listing count unspecified|replaces|unconfirmed|unverified|confirm brand', shown+' '+note, re.I))
    # Every branch is unverified. That does not establish store inventory.
    pricing_note = 'Store selling price and availability require confirmation.'
    if 'NOT verified for pictured pack' in note or 'listing says' in shown: pricing_note = 'Source listing differs from the pictured pack; this price is not verified for this pack.'
    elif price_type == 'planning-estimate': pricing_note = 'Planning estimate only; store selling price requires confirmation.'
    if unit.startswith(('Weight unconfirmed','Capacity unconfirmed','Pack size unconfirmed')): issues.append({'id':ident,'issue':'Pack size needs confirmation','documented_product':shown})
    if mismatch: issues.append({'id':ident,'issue':'Source identity/pack/price discrepancy needs review','source_note':note})
    with Image.open(path) as picture: width, height = picture.size
    manifest.append({'id':ident,'canonicalId':aliases.get(ident,ident),'source':path.name,'width':width,'height':height,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    if ident in aliases:
        other = next(r for r in rows if r['catalogue_id']==aliases[ident])
        # These three same-brand/same-pack pairs were reviewed visually. WebP
        # encodings can differ even for photographs of the same product.
        if shown != other['product_shown'] or raw_price != (other['retailer_listed_price_tzs'] or other['assistant_planning_estimate_tzs']): raise ValueError(f'{ident}: duplicate details disagree')
        continue
    shutil.copy2(path, destination/path.name)
    catalog.append({'id':ident,'name':name,'categoryId':category(number),'unit':unit,'image':'/images/products/'+path.name,'imageAlt':f'{name} — {unit}; supplied product photograph','imageWidth':width,'imageHeight':height,'price':float(price),'priceType':price_type,'priceUnit':row['price_selling_unit'] if not row['price_selling_unit'].startswith('See ') else unit,'priceNote':pricing_note,'stockStatus':'unverified','stock':0,'orderable':False,'rating':0,'reviews':0,'tags':[],'description':pricing_note,'sourceIds':[ident]+[alias for alias,canonical in aliases.items() if canonical==ident],'priceProvenance':{'retailerListedPriceTzs':row['retailer_listed_price_tzs'] or None,'planningEstimateTzs':row['assistant_planning_estimate_tzs'] or None,'sourceUrl':row['price_source'],'packagingSourceUrl':row['packaging_reference_source'],'recordedDate':row['price_checked_or_estimated_date'],'originalCandidate':row['original_catalogue_candidate'],'originalCandidateUnit':row['original_candidate_unit'],'sourceNote':note,'branchStock':{'Dar es Salaam':row['dar_es_salaam_branch_stock'],'Morogoro':row['morogoro_branch_stock'],'Mwanza':row['mwanza_branch_stock']}}})

target = root / 'backend/database/catalog'
owner_file = target / 'owner-verification.json'
owner = json.loads(owner_file.read_text(encoding='utf-8')) if owner_file.exists() else {}
for product in catalog:
    approved = inventory[product['id']]
    if approved['currency'] != 'TZS' or approved['price_approval'] != 'store_approved': raise ValueError('Missing price approval')
    if approved['image_filename'] != Path(product['image']).name: raise ValueError('Inventory image differs from ID match')
    for alias in product['sourceIds']:
        if inventory[alias]['selling_price_tzs'] != approved['selling_price_tzs']: raise ValueError('Duplicate inventory prices disagree')
    approved_price = Decimal(str(approved['selling_price_tzs']))
    if not approved_price.is_finite() or approved_price <= 0 or approved_price*100 != (approved_price*100).to_integral_value(): raise ValueError('Invalid approved price')
    product['price'] = float(approved_price)
    product['priceBasis'] = product['priceType']
    product['priceType'] = 'store-confirmed'
    product['priceApprovalDate'] = approved['approval_date']
    product['priceProvenance']['approval'] = 'store_approved'
    product['priceProvenance']['approvalDate'] = approved['approval_date']
    product['priceProvenance']['inventoryCategory'] = approved['category']
    product['priceProvenance']['availabilityStatus'] = approved['availability_status']
    product['priceProvenance']['branchQuantities'] = {branch: approved[column] for branch,column in [('Dar es Salaam','dar_es_salaam_stock_quantity'),('Morogoro','morogoro_stock_quantity'),('Mwanza','mwanza_stock_quantity')]}
    product['priceNote'] = product['priceNote'].replace('Planning estimate only; store selling price requires confirmation.', 'Initial store-approved price based on a planning estimate; availability requires confirmation.').replace('Store selling price and availability require confirmation.', 'Initial store price approved; availability requires confirmation.')
    if product['id'] == 'FC-196':
        product['priceNote'] = 'Photo shows Pantene Repair & Protect shampoo; the source candidate described a 2-in-1 product. Confirm the approved selling unit before ordering.'
        issues.append({'id':product['id'],'issue':'Pictured Repair & Protect shampoo differs from 2-in-1 candidate; approved price must be reconciled with actual product'})
    listing_units = {'FC-053':'297 g source listing', 'FC-074':'500 g source listing', 'FC-145':'1 L source listing', 'FC-170':'138 g source listing', 'FC-182':'180 g source listing', 'FC-200':'80 sheets source listing', 'FC-212':'100 sq ft source listing', 'FC-218':'25 × 12 oz cups with lids source listing'}
    if product['id'] in listing_units: product['priceUnit'] = listing_units[product['id']]
    product['description'] = product['priceNote']
    quantity = approved['stock_quantity']
    product['stock'] = quantity
    if quantity is not None:
        if not isinstance(quantity, int) or quantity < 0: raise ValueError('Invalid stock quantity')
        product['stock'] = quantity
        product['stockStatus'] = 'confirmed'
    product['orderable'] = bool(approved['immediate_checkout_enabled']) and quantity is not None
    if owner.get('verified') and owner.get('availability'):
        product['priceProvenance']['ownerVerification'] = owner
        product['priceProvenance']['reviewUnit'] = product['unit']
        product['stockStatus'] = 'confirmed' if quantity is not None else 'available'
        product['orderable'] = True
        if 'unconfirmed' in product['unit'].lower(): product['unit'] = 'per pack'
        product['description'] = f"{product['name']} · {product['unit']}"
        product['priceNote'] = ''
target.mkdir(parents=True, exist_ok=True)
(target/'family-choice-products.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
report = {'sourceRows':len(rows),'uniqueProducts':len(catalog),'duplicateAliases':aliases,'retailerListed':sum(p['priceBasis']=='retailer-listed' for p in catalog),'planningEstimates':sum(p['priceBasis']=='planning-estimate' for p in catalog),'storeApprovedPrices':len(catalog),'stockUnverified':sum(p['stockStatus']=='unverified' for p in catalog),'issues':issues,'images':manifest}
(target/'import-review.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['issues','images']}))
print(f'Review items: {len(issues)}')
