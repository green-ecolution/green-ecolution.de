# Cuts the web fonts down to the characters the site can show.
#   pnpm build
#   nix-shell -p "python3.withPackages (ps: [ps.fonttools ps.brotli])" --run "python3 scripts/subset-fonts.py"
# Kept are Basic Latin, Latin-1, Latin Extended-A, what lato-400 covers (the
# Google Fonts latin set) and every character found in dist/. A character
# outside of that falls back to a system font, so run this again after adding
# a font file or text in another script.
import glob
import html
import os
import re
import tempfile

from fontTools import subset
from fontTools.ttLib import TTFont

FONTS = 'src/assets/fonts'
# A rewritten file that saves less than this is left alone: woff2 output is
# not byte-stable, and a font that is already cut down should not show up as
# changed.
MIN_SAVING = 0.05

reference = set(TTFont(f'{FONTS}/lato-400.woff2').getBestCmap())

used = set()
for page in glob.glob('dist/**/*.html', recursive=True):
    text = open(page, encoding='utf8').read()
    text = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', text)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    used |= {ord(char) for char in text if ord(char) >= 0x20}
if not used:
    raise SystemExit('dist/ holds no pages, run pnpm build first')

keep = reference | used | set(range(0x20, 0x7F)) | set(range(0xA0, 0x180))

for path in sorted(glob.glob(f'{FONTS}/*.woff2')):
    font = TTFont(path)
    covered = set(font.getBestCmap())

    options = subset.Options()
    options.flavor = 'woff2'
    # The defaults plus the figure styles the site asks for (tabular-nums).
    options.layout_features = options.layout_features + ['tnum', 'lnum', 'pnum']
    options.name_IDs = ['*']
    options.notdef_outline = True

    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(keep & covered))
    subsetter.subset(font)

    with tempfile.NamedTemporaryFile(suffix='.woff2', delete=False) as cut:
        subset.save_font(font, cut.name, options)
    before, after = os.path.getsize(path), os.path.getsize(cut.name)
    missing = ''.join(chr(char) for char in sorted(used - covered)) or '-'
    name = os.path.basename(path)

    if after < before * (1 - MIN_SAVING):
        os.replace(cut.name, path)
        print(f'{name:24} {before / 1024:6.1f} KB -> {after / 1024:6.1f} KB, not in this font: {missing}')
    else:
        os.remove(cut.name)
        print(f'{name:24} {before / 1024:6.1f} KB unchanged, not in this font: {missing}')
