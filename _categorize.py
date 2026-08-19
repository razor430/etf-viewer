import re, io
path = 'src/data/mockEtfs.ts'
s = open(path, encoding='utf-8').read()

# ticker -> categoria (agrupacion final: indices, sectores, commodities, bonos)
SECTORES = ['XLK','XLV','XLF','XLE','XLY','XLP','XLI','XLU','XLB','XLRE','XLC','SMH','DRAM','IGPT','BAI','ARKK','ARKW','ARKG','ARKQ','ARKF']
COMMODITIES = ['GDX','GLD','SLV','USO','DBC','SIL']
RENTA_FIJA = ['AGG','TLT','HYG','LQD']
def cat(t):
    if t in SECTORES: return 'sectores'
    if t in COMMODITIES: return 'commodities'
    if t in RENTA_FIJA: return 'renta-fija'
    return 'indices'

pat = re.compile(r"id: '(?P<t>[A-Z0-9.]+)',(?P<body>.*?sector: '[^']*',)\n", re.S)
count = [0]
def repl(m):
    # Idempotente: si el bloque ya declara category, no duplicar.
    if 'category:' in m.group('body'):
        return m.group(0)
    t = m.group('t')
    c = cat(t)
    count[0] += 1
    return m.group(0) + f"    category: '{c}',\n"

out, n = pat.subn(repl, s)
open(path, 'w', encoding='utf-8', newline='\n').write(out)
print('inserted category into', n, 'blocks')