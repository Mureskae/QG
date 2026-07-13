import re
path = "app/app.go"
with open(path) as f:
    content = f.read()

before = content.count("qgmodulekeeper")
content = re.sub(r'\n\s*qgmodulekeeper "qgchaind/x/qg/keeper"', '', content)
content = re.sub(r'\n\s*QgKeeper\s+qgmodulekeeper\.Keeper', '', content)
after = content.count("qgmodulekeeper")

with open(path, "w") as f:
    f.write(content)

print("qgmodulekeeper references:", before, "->", after)

