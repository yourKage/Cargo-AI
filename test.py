

from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import json
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)

LIVE_JSON_PATH = "DAT_LIVE_CURRENT.json"

@app.route('/update-live-json', methods=['POST'])
def update_live_json():
    try:
        data = request.get_json()
        loads = data.get('loads', [])
        with open(LIVE_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump({
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_loads": len(loads),
                "loads": loads
            }, f, indent=2, ensure_ascii=False)
        print(f"LIVE JSON updated → {len(loads)} loads")
        return jsonify({"status": "success", "saved": len(loads)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/receive-data', methods=['POST'])
def receive_data():
    try:
        data = request.get_json()
        html = data.get('html_payload', '')
        if not html: return jsonify({"message": "No HTML"}), 400

        soup = BeautifulSoup(html, 'html.parser')
        vp = soup.find('cdk-virtual-scroll-viewport') or soup.find(id='table-viewport')
        if not vp: return jsonify({"loads_found": 0}), 200

        rows = vp.find_all('div', class_='row-container')
        results = []

        for i, row in enumerate(rows, 1):
            if not row.find('div', class_='row-cells'): continue

            expanded = row.find_next_sibling('dat-load-details') or row.find_next_sibling('div', class_='expanded-detail-row')

            phone = email = truck = commodity = ref_id = mc = trip_miles = 'N/A'
            if expanded:
                phone_tag = expanded.find('a', href=re.compile(r'^tel:'))
                phone = phone_tag.get_text(strip=True) if phone_tag else 'N/A'

                email_tag = expanded.find('a', href=re.compile(r'^mailto:'))
                email = email_tag['href'].replace('mailto:', '') if email_tag else 'N/A'

                items = expanded.select('dat-equipment .data-item')
                if len(items) >= 2:
                    truck_raw = items[1].get_text(strip=True)
                    truck = 'N/A' if truck_raw in ['–','—','-',''] else truck_raw
                if len(items) >= 5:
                    comm = items[4].get_text(strip=True)
                    commodity = 'N/A' if comm in ['–','—','-',''] else comm
                    ref = items[-1].get_text(strip=True)
                    ref_id = 'N/A' if ref in ['–','—','-',''] else ref

                # Trip Miles from expanded view
                miles_tag = expanded.select_one('.trip-miles')
                trip_miles = miles_tag.get_text(strip=True).replace(' mi', '') if miles_tag else 'N/A'

                mc_match = re.search(r'MC#(\d+)', expanded.get_text())
                mc = mc_match.group(1) if mc_match else 'N/A'

            # Origin & Destination
            o_city = row.select_one('[data-test="load-origin-cell"] .truncate')
            o_state = row.select_one('[data-test="load-origin-cell"] .state')
            d_city = row.select_one('[data-test="load-destination-cell"] .truncate')
            d_state = row.select_one('[data-test="load-destination-cell"] .state')

            origin = f"{o_city.get_text(strip=True) if o_city else 'N/A'}, {o_state.get_text(strip=True) if o_state else 'N/A'}"
            dest = f"{d_city.get_text(strip=True) if d_city else 'N/A'}, {d_state.get_text(strip=True) if d_state else 'N/A'}"

            # DH-O / DH-D
            dho_cell = row.select_one('[data-test="load-dho-cell"]')
            dhd_cell = row.select_one('[data-test="load-dhd-cell"]')
            dho_raw = dho_cell.get_text(strip=True).strip('()') if dho_cell else ''
            dhd_raw = dhd_cell.get_text(strip=True).strip('()') if dhd_cell else ''

            dho = dho_raw if dho_raw and dho_raw != '' else 'N/A'
            dhd = dhd_raw if dhd_raw and dhd_raw != '' else 'N/A'

            # Calculate Total Miles = Trip + DH-O + DH-D
            try:
                trip_num = int(trip_miles) if trip_miles != 'N/A' else 0
                dho_num = int(dho) if dho != 'N/A' else 0
                dhd_num = int(dhd) if dhd != 'N/A' else 0
                total_miles = trip_num + dho_num + dhd_num
            except:
                total_miles = 'N/A'

            rate = row.select_one('.offer').get_text(strip=True) or 'N/A'
            company = row.select_one('[data-test="load-company-cell"]').get_text(strip=True) or 'N/A'

            results.append({
                "No": i,
                "Origin": origin,
                "Destination": dest,
                "Trip_Miles": trip_miles,
                "Total_Miles": total_miles,
                "Rate": rate,
                "Company": company,
                "Phone": phone,
                "Email": email,
                "Truck": truck,
                "Commodity": commodity,
                "Reference_ID": ref_id,
                "MC_Number": mc,
                "DH-O": dho,
                "DH-D": dhd
            })

        fn = f"dat_loads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(fn, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        return jsonify({"loads_found": len(results), "filename": fn}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\nDAT ONE ULTIMATE SCRAPER 2025")
    print("Live file → DAT_LIVE_CURRENT.json")
    app.run(host='127.0.0.1', port=5000, debug=False)