#!/usr/bin/env python3
"""Monthly research scan: list new PubMed papers that may belong under a topic's
"research behind it". Only finds candidates; it never edits the site data.

Usage: python3 scripts/research-scan.py [--month YYYY-MM] [--out research/candidates/YYYY-MM.md]

Looks for, in the given month (default: last month), papers on children 0-18 that are
  - systematic reviews or meta-analyses, or
  - cohort / longitudinal studies or randomised trials in a top journal (research/watch.yaml)
and skips anything whose DOI is already in src/data/resources.yaml.
Uses only the Python standard library, so it works behind an HTTPS proxy.
"""
import argparse, datetime as dt, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
AGES = '(infant[mh] OR child[mh] OR child, preschool[mh] OR adolescent[mh])'
REVIEWS = '(systematic review[pt] OR meta-analysis[pt])'
PRIMARY = '(cohort studies[mh] OR longitudinal studies[mh] OR randomized controlled trial[pt])'
EXCLUDE = 'NOT (case reports[pt] OR comment[pt] OR editorial[pt] OR letter[pt] OR protocol[ti])'

def get(path, **params):
    params.update(tool='edustack-research-scan', retmode='json')
    url = EUTILS + path + '?' + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # network hiccup or rate limit
            if attempt == 3: raise
            time.sleep(2 ** attempt)
    time.sleep(0.4)  # stay under 3 requests a second

def load_watch():
    # tiny parser for research/watch.yaml so the script needs no packages
    text = (ROOT / 'research/watch.yaml').read_text()
    journals = re.findall(r'^  - (?!topic)(.+)$', text.split('queries:')[0], re.M)
    queries = re.findall(r"- topic: (\S+)\n    q: (.+)", text)
    return [j.strip() for j in journals], [(t, q.strip().strip("'")) for t, q in queries]

def month_range(m):
    start = dt.date.fromisoformat(m + '-01')
    end = (start.replace(day=28) + dt.timedelta(days=4)).replace(day=1) - dt.timedelta(days=1)
    return start, end

def main():
    ap = argparse.ArgumentParser()
    last = (dt.date.today().replace(day=1) - dt.timedelta(days=1)).strftime('%Y-%m')
    ap.add_argument('--month', default=last)
    ap.add_argument('--out')
    a = ap.parse_args()
    start, end = month_range(a.month)
    known = set(d.lower() for d in re.findall(r'doi: (\S+)', (ROOT / 'src/data/resources.yaml').read_text()))
    journals, queries = load_watch()
    jq = '(' + ' OR '.join(f'"{j}"[ta]' for j in journals) + ')'
    found = {}
    for topic, q in queries:
        term = f'({q}) AND {AGES} AND ({REVIEWS} OR ({PRIMARY} AND {jq})) {EXCLUDE}'
        r = get('esearch.fcgi', db='pubmed', term=term, datetype='edat', mindate=start.strftime('%Y/%m/%d'),
                maxdate=end.strftime('%Y/%m/%d'), retmax=200)
        for pmid in r['esearchresult']['idlist']:
            found.setdefault(pmid, set()).add(topic)
        time.sleep(0.4)
    ids = list(found)
    rows = []
    for i in range(0, len(ids), 150):
        res = get('esummary.fcgi', db='pubmed', id=','.join(ids[i:i + 150]))['result']
        for pmid in res.get('uids', []):
            d = res[pmid]
            doi = next((x['value'] for x in d.get('articleids', []) if x['idtype'] == 'doi'), '')
            if doi.lower() in known: continue
            pts = d.get('pubtype', [])
            kind = 'meta-analysis' if 'Meta-Analysis' in pts else 'systematic review' if 'Systematic Review' in pts else 'trial' if 'Randomized Controlled Trial' in pts else 'cohort'
            rows.append(dict(pmid=pmid, title=d.get('title', ''), journal=d.get('source', ''), date=d.get('pubdate', ''),
                             kind=kind, doi=doi, topics=sorted(found[pmid])))
        time.sleep(0.4)
    order = {'meta-analysis': 0, 'systematic review': 1, 'trial': 2, 'cohort': 3}
    rows.sort(key=lambda r: (order[r['kind']], r['journal'] not in journals, r['title']))
    out = [f'# Research scan {a.month}', '',
           f'{len(rows)} candidates from PubMed ({start} to {end}), not yet reviewed. Already-listed DOIs are skipped.', '',
           '| # | Kind | Topics | Title | Journal | Link |', '|---|---|---|---|---|---|']
    for n, r in enumerate(rows, 1):
        link = f'https://doi.org/{r["doi"]}' if r['doi'] else f'https://pubmed.ncbi.nlm.nih.gov/{r["pmid"]}/'
        out.append(f'| {n} | {r["kind"]} | {", ".join(r["topics"])} | {r["title"].replace("|", "/")} | {r["journal"]} | [PMID {r["pmid"]}]({link}) |')
    md = '\n'.join(out) + '\n'
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True); Path(a.out).write_text(md)
        print(f'{len(rows)} candidates written to {a.out}')
    else:
        sys.stdout.write(md)

if __name__ == '__main__':
    main()
