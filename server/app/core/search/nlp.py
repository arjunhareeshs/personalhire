"""NLP pipeline for the stored resume index: normalize → tokenize → stopwords →
synonyms/canonical skills → stemming → n-grams/phrases. Dependency-free."""
import re

STOP = frozenset("""a an the and or of to in on for with by at from as is are was were be been
being it its this that these those i you he she we they them his her our your their
my me him us our ours yours hers theirs myself yourself himself herself itself
not no nor but if then else when while do does did done have has had having will
would can could shall should may might must also just very more most other some
such than too within without per via etc vs et al including include includes
using used use based mainly overall across between through during before after
above below under over again once here there where which who whom whose what
why how all any both each few many own same so""".split())

# canonical skill forms (query "js" must hit resume "JavaScript")
SYNONYMS = {
    "js": "javascript", "javascript": "javascript", "ts": "typescript", "typescript": "typescript",
    "nodejs": "nodejs", "node": "nodejs", "reactjs": "react", "react": "react",
    "postgres": "postgresql", "postgresql": "postgresql", "mongo": "mongodb", "mongodb": "mongodb",
    "k8s": "kubernetes", "kubernetes": "kubernetes", "tf": "tensorflow", "tensorflow": "tensorflow",
    "pytorch": "pytorch", "sklearn": "sklearn", "scikit": "sklearn", "ml": "machinelearning",
    "ai": "artificialintelligence", "ds": "datascience",
}

def normalize(text: str) -> str:
    t = (text or "").lower()
    t = re.sub(r"[’‘`]", "'", t)
    t = re.sub(r"[^a-z0-9+#.\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:[#+][a-z0-9]+)?", normalize(text))

def stem(w: str) -> str:
    """Compact rule-based stemmer (Porter-lite): plurals, -ing/-ed, adverbials."""
    if len(w) <= 3:
        return w
    if w.endswith("ies") and len(w) > 4:
        return w[:-3] + "y"
    if w.endswith(("sses", "xes", "zes", "ches", "shes")):
        return w[:-2]
    if w.endswith("s") and not w.endswith("ss"):
        w = w[:-1]
    for suf, rep in (("ational", "ate"), ("tional", "tion"), ("ization", "ize"),
                     ("fulness", "ful"), ("iveness", "ive"), ("ousness", "ous")):
        if w.endswith(suf) and len(w) > len(suf) + 2:
            w = w[: -len(suf)] + rep
            break
    if w.endswith("ing") and len(w) > 5:
        w = w[:-3]
    elif w.endswith("ed") and len(w) > 4:
        w = w[:-2]
    if w.endswith("ly") and len(w) > 5:
        w = w[:-2]
    return w

def analyze(text: str, keep_stop_for_phrase: bool = False) -> list[str]:
    out = []
    for tok in tokenize(text):
        if tok in STOP and not keep_stop_for_phrase:
            continue
        tok = SYNONYMS.get(tok, tok)
        out.append(stem(tok))
    return out

def parse_query(q: str) -> dict:
    """Split query into stemmed terms + quoted phrases (also stemmed)."""
    phrases = re.findall(r'"([^"]+)"', q or "")
    rest = re.sub(r'"[^"]+"', " ", q or "")
    terms = analyze(rest)
    pstems = [analyze(p) for p in phrases]
    return {"terms": terms, "phrases": [p for p in pstems if p],
            "raw_terms": tokenize(rest)}
