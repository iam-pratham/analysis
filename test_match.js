const collectionData = require('./src/data/collection_data.json');
const rawKeys = new Set();
collectionData.forEach(row => {
    Object.keys(row).forEach(k => {
        if (k !== '__EMPTY') rawKeys.add(k);
    });
});
const availableCollectionKeys = Array.from(rawKeys);
console.log("Available keys:", availableCollectionKeys);

const claimName = "Bruce J Buckman - PT";
const cleanClaimBase = claimName.split(' - ')[0].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
const claimWords = cleanClaimBase.split(' ').filter(w => w.length > 2 && !['dpt', 'dc', 'md', 'do', 'pt', 'ot'].includes(w))
console.log("Clean claim base:", cleanClaimBase, "claimWords:", claimWords);

const match = availableCollectionKeys.find(k => {
    const cleanKey = k.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    const keyWords = cleanKey.split(' ').filter(w => w.length > 2 && !['dpt', 'dc', 'md', 'do', 'pt', 'ot'].includes(w))
    
    if (cleanClaimBase.includes(cleanKey) || cleanKey.includes(cleanClaimBase)) return true;
    
    let matchCount = 0;
    claimWords.forEach(cw => {
        if (keyWords.includes(cw)) matchCount++;
    })
    return matchCount >= 1;
});
console.log("Match for Bruce:", match);
