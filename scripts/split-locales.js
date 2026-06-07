#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

const src = path.join(__dirname, "..", "src", "lib", "locale")
const dst = path.join(__dirname, "..", "public", "locale")
if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true })

const en = JSON.parse(fs.readFileSync(path.join(src, "en.json"), "utf-8"))
const fr = JSON.parse(fs.readFileSync(path.join(src, "fr.json"), "utf-8"))

const codes = [
  "aa","ab","af","ak","am","an","ar","as","av","ay","az","ba","be","bg","bh","bi","bm","bn",
  "bo","br","bs","ca","ce","ch","co","cr","cs","cu","cv","cy","da","de","dv","dz","ee","el","eo",
  "es","et","eu","fa","ff","fi","fj","fo","fy","ga","gd","gl","gn","gu","gv","ha","he","hi",
  "ho","hr","ht","hu","hy","hz","ia","id","ie","ig","ii","ik","io","is","it","iu","ja","jv","ka",
  "kg","ki","kj","kk","kl","km","kn","ko","kr","ks","ku","kv","kw","ky","la","lb","lg","li","ln",
  "lo","lt","lu","lv","mg","mh","mi","mk","ml","mn","mr","ms","mt","my","na","nb","nd","ne","ng",
  "nl","nn","no","nr","nv","ny","oc","oj","om","or","os","pa","pi","pl","ps","pt","qu","rm","rn",
  "ro","ru","rw","sa","sc","sd","se","sg","si","sk","sl","sm","sn","so","sq","sr","ss","st","su",
  "sv","sw","ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty","ug","uk","ur",
  "uz","ve","vi","vo","wa","wo","xh","yi","yo","za","zh","zu"
]

// Write English as reference
fs.writeFileSync(path.join(dst, "en.json"), JSON.stringify(en))

// Write French with real translations
fs.writeFileSync(path.join(dst, "fr.json"), JSON.stringify(fr))

// For all others, write a copy of English (placeholder until real translations are added)
codes.forEach((code) => {
  if (code === "en" || code === "fr") return
  fs.writeFileSync(path.join(dst, `${code}.json`), JSON.stringify(en))
})

// Also copy to src/lib/locale for backward compat
codes.forEach((code) => {
  if (code === "en" || code === "fr") return
  const p = path.join(src, `${code}.json`)
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(en))
})

console.log(`Done: ${codes.length + 2} files in public/locale/`)
