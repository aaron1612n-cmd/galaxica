import sys
from PIL import Image
src=sys.argv[1]; im=Image.open(src).convert('RGB').resize((469,352),Image.LANCZOS); im.save(sys.argv[2],quality=86)
