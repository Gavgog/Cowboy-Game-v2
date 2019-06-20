file = open("male names.txt")
filenames = file.readlines()
names = []
for name in filenames:
    if name != '\n':
        comp = name.split(" ")
        ncomp = [];
        for nic in comp:
            if nic != 'â€“':
                ncomp.append(nic.strip(','))
        
        ncomp[-1] = ncomp[-1][:-2]
        names.append(ncomp);

f= open("mensnames.json","w+")
f.write("[")
for name in names:
    lis = ""
    for i in name[1:]:
        lis += i
    notation = "{'" + name[0] + "':'" +lis+ "'},"
    f.write(notation)

f.write("]")

f.close()
print("done")
