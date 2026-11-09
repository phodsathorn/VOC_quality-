"""Verify the Pro source read from File > File Source after import."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
source = (root / 'EasyEDA_Pro_source_snapshot.txt').read_text(encoding='utf-8')
records = []
pattern = r'(\{"type":"[^"]+"[^}]*\})\|\|([\s\S]*?)(?=\|\s*\{"type":|$)'
for header, data in re.findall(pattern, source):
    records.append((json.loads(header), json.loads(re.sub(r'\|\s*$', '', data))))
expected = json.loads((root / 'connections.json').read_text(encoding='utf-8'))
components = [h for h, d in records if h['type'] == 'COMPONENT']
refs = {d['value'] for h, d in records if h['type'] == 'ATTR' and d.get('key') == 'Designator'}
net_names = {d['value'] for h, d in records if h['type'] == 'ATTR' and d.get('key') == 'NET' and d.get('value')}
assert len(components) == len(expected['parts']) == 50
assert refs == {p['reference'] for p in expected['parts']}
assert net_names == set(expected['nets'])
report = {
    'status': 'source structure verified after EasyEDA Pro import',
    'components': len(components), 'reference_designators': len(refs),
    'named_nets': len(net_names),
    'page_uuid': records[0][1]['uuid'],
    'limitations': [
        'PCB netlist export blocked by 50 unassigned footprints.',
        'Source structure verification is not electrical simulation or complete ERC.',
        'Module SKUs, harness pin order, MCU headers and footprints require selection before PCB.',
    ],
}
(root / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
